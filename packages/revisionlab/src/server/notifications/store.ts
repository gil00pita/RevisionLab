import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import {
  defaultNotificationSettings,
  emailProviders,
  notificationSecretNames,
  type NotificationConfiguration,
  type NotificationSecret,
  type NotificationSettings,
} from "../../notification-settings.js";
import type { ResolvedConfig } from "../config.js";
import { decryptSecret, encryptSecret, HttpError } from "../security.js";
import { write } from "../database.js";
import { encryptionAvailable, notificationKey } from "./secrets.js";

type Secrets = Partial<Record<NotificationSecret, string>>;
const address = z.union([z.literal(""), z.string().trim().email().max(254)]);
const text = z
  .string()
  .trim()
  .max(254)
  .refine((value) => !/[\r\n\0]/.test(value));
export const notificationSchema = z.strictObject({
  defaultProvider: z.enum(emailProviders),
  custom: z.strictObject({
    from: address,
    host: text.refine((value) => !value || /^[a-zA-Z0-9.-]+$/.test(value)),
    port: z.number().int().min(1).max(65535),
    security: z.enum(["starttls", "tls"]),
    username: text,
  }),
  resend: z.strictObject({ from: address }),
  smtpdev: z.strictObject({ from: address, username: address }),
  email: z.strictObject({
    recipients: z.array(z.string().trim().email().max(254)).max(20),
    comments: z.boolean(),
    issues: z.boolean(),
  }),
  slack: z.strictObject({
    enabled: z.boolean(),
    comments: z.boolean(),
    issues: z.boolean(),
  }),
});
export const notificationUpdateSchema = z.strictObject({
  settings: notificationSchema,
  revision: z.number().int().nonnegative(),
  secrets: z.partialRecord(
    z.enum(notificationSecretNames),
    z.string().min(1).max(4096).nullable(),
  ),
});

export async function readNotificationRecord(client: Client | Transaction) {
  const { rows } = await client.execute(
    "SELECT * FROM notification_settings WHERE id = 1",
  );
  const row = rows[0];
  return {
    settings: row
      ? notificationSchema.parse(JSON.parse(String(row.settings_json)))
      : structuredClone(defaultNotificationSettings),
    revision: Number(row?.revision ?? 0),
    ciphertext: row?.secrets_ciphertext ? String(row.secrets_ciphertext) : null,
    secretNames: row
      ? (JSON.parse(String(row.secret_names)) as NotificationSecret[])
      : [],
    lastDelivery: {
      email: row?.email_status ? String(row.email_status) : null,
      slack: row?.slack_status ? String(row.slack_status) : null,
    },
  };
}
export async function openNotificationSecrets(
  ciphertext: string | null,
  config: ResolvedConfig,
): Promise<Secrets> {
  return ciphertext
    ? JSON.parse(decryptSecret(ciphertext, await notificationKey(config)))
    : {};
}
export async function readNotificationConfiguration(
  client: Client,
  config: ResolvedConfig,
): Promise<NotificationConfiguration> {
  const record = await readNotificationRecord(client);
  return {
    settings: record.settings,
    revision: record.revision,
    lastDelivery: record.lastDelivery,
    configuredSecrets: Object.fromEntries(
      notificationSecretNames.map((name) => [
        name,
        record.secretNames.includes(name),
      ]),
    ) as Record<NotificationSecret, boolean>,
    encryptionAvailable: encryptionAvailable(config),
    environmentEmailConfigured: Boolean(
      config.resendApiKey && config.emailFrom,
    ),
  };
}
export function validateReady(
  settings: NotificationSettings,
  secrets: Secrets,
  config: ResolvedConfig,
) {
  const provider = settings.defaultProvider;
  if (
    provider === "custom" &&
    (!settings.custom.host ||
      !settings.custom.from ||
      Boolean(settings.custom.username) !== Boolean(secrets.customPassword))
  )
    throw new HttpError(
      400,
      "Set an SMTP host and sender, and supply both username and password when authentication is required.",
    );
  if (provider === "resend" && (!settings.resend.from || !secrets.resendApiKey))
    throw new HttpError(
      400,
      "Set a Resend sender and API key before making it the default.",
    );
  if (
    provider === "smtpdev" &&
    (!settings.smtpdev.from ||
      !settings.smtpdev.username ||
      !secrets.smtpdevPassword)
  )
    throw new HttpError(
      400,
      "Set an SMTP.dev sender, SMTP username, and SMTP password before making it the default. The API key does not send mail.",
    );
  if (settings.email.comments || settings.email.issues) {
    if (!settings.email.recipients.length)
      throw new HttpError(400, "Add at least one notification recipient.");
    if (
      provider === "disabled" ||
      (provider === "environment" &&
        (!config.emailFrom || !config.resendApiKey))
    )
      throw new HttpError(
        400,
        "Configure a default email provider before enabling email notifications.",
      );
  }
  if (settings.slack.enabled && !secrets.slackWebhook)
    throw new HttpError(
      400,
      "Add a Slack incoming webhook before enabling Slack notifications.",
    );
  if (
    secrets.slackWebhook &&
    !/^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(
      secrets.slackWebhook,
    )
  )
    throw new HttpError(
      400,
      "Use a Slack incoming webhook URL from hooks.slack.com/services/.",
    );
}
export async function saveNotificationConfiguration(
  client: Client,
  config: ResolvedConfig,
  raw: unknown,
) {
  const parsed = notificationUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(400, `Check ${issue.path.join(".")}: ${issue.message}`);
  }
  const input = parsed.data;
  await write(client, async (tx) => {
    const current = await readNotificationRecord(tx);
    if (input.revision !== current.revision)
      throw new HttpError(
        409,
        "Notification settings changed elsewhere. Reload before saving.",
      );
    const secrets = await openNotificationSecrets(current.ciphertext, config);
    for (const name of notificationSecretNames) {
      if (input.secrets[name] === null) delete secrets[name];
      else if (input.secrets[name] !== undefined)
        secrets[name] = input.secrets[name];
    }
    validateReady(input.settings, secrets, config);
    const names = notificationSecretNames.filter((name) =>
      Boolean(secrets[name]),
    );
    const ciphertext = names.length
      ? encryptSecret(JSON.stringify(secrets), await notificationKey(config))
      : null;
    await tx.execute({
      sql: `INSERT INTO notification_settings (id, settings_json, secrets_ciphertext, secret_names, revision) VALUES (1, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET settings_json=excluded.settings_json, secrets_ciphertext=excluded.secrets_ciphertext, secret_names=excluded.secret_names, revision=excluded.revision`,
      args: [
        JSON.stringify(input.settings),
        ciphertext,
        JSON.stringify(names),
        current.revision + 1,
      ],
    });
  });
  return readNotificationConfiguration(client, config);
}
