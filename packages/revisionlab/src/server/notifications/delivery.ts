import { defaultNotificationSettings } from "../../notification-settings.js";
import nodemailer from "nodemailer";
import type { Client } from "@libsql/client";
import type { ResolvedConfig } from "../config.js";
import { HttpError } from "../security.js";
import { openNotificationSecrets, readNotificationRecord } from "./store.js";

function remainingDeliveryTime(deadline: number) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("Notification delivery timed out");
  return remaining;
}

type Mail = { to: string[]; subject: string; text: string };
export async function sendEmail(
  client: Client,
  config: ResolvedConfig,
  mail: Mail,
  deadline = Date.now() + 10_000,
): Promise<void> {
  const record = await readNotificationRecord(client);
  const { settings } = record;
  const provider = settings.defaultProvider;
  if (provider === "disabled")
    throw new HttpError(
      503,
      "Email delivery is disabled in Notifications settings.",
    );
  const secrets =
    provider === "environment"
      ? {}
      : await openNotificationSecrets(record.ciphertext, config);
  if (provider === "environment" || provider === "resend") {
    const key =
      provider === "environment" ? config.resendApiKey : secrets.resendApiKey;
    const from =
      provider === "environment" ? config.emailFrom : settings.resend.from;
    if (!key || !from)
      throw new HttpError(
        503,
        "Configure an email provider and sender in Notifications settings or the host environment.",
      );
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(remainingDeliveryTime(deadline)),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...mail }),
    });
    if (!response.ok) throw new Error("Email delivery rejected");
    return;
  }
  const smtp =
    provider === "smtpdev"
      ? {
          ...settings.smtpdev,
          host: "send.smtp.dev",
          port: 587,
          security: "starttls",
          password: secrets.smtpdevPassword,
        }
      : { ...settings.custom, password: secrets.customPassword };
  if (!smtp.host || !smtp.from)
    throw new HttpError(
      503,
      "Configure the selected SMTP provider before sending email.",
    );
  const timeout = remainingDeliveryTime(deadline);
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.security === "tls",
    requireTLS: true,
    auth: smtp.username
      ? { user: smtp.username, pass: smtp.password }
      : undefined,
    connectionTimeout: Math.min(5000, timeout),
    greetingTimeout: Math.min(5000, timeout),
    socketTimeout: timeout,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      transport.sendMail({ from: smtp.from, ...mail }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          transport.close();
          reject(new Error("SMTP delivery timed out"));
        }, timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    transport.close();
  }
}

export async function sendSlack(
  client: Client,
  config: ResolvedConfig,
  message: string,
  deadline = Date.now() + 10_000,
) {
  const record = await readNotificationRecord(client);
  const secrets = await openNotificationSecrets(record.ciphertext, config);
  if (!secrets.slackWebhook)
    throw new HttpError(503, "Configure a Slack incoming webhook first.");
  const response = await fetch(secrets.slackWebhook, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(remainingDeliveryTime(deadline)),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "RevisionLab notification",
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: message.slice(0, 2900),
            emoji: false,
          },
        },
      ],
    }),
  });
  if (!response.ok || (await response.text()).trim() !== "ok")
    throw new Error("Slack delivery rejected");
}

export async function recordDelivery(
  client: Client,
  channel: "email" | "slack",
  success: boolean,
) {
  await client.execute({
    sql: `INSERT INTO notification_settings (id, settings_json, ${channel === "email" ? "email_status" : "slack_status"})
      VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET
      ${channel === "email" ? "email_status = excluded.email_status" : "slack_status = excluded.slack_status"}`,
    args: [
      JSON.stringify(defaultNotificationSettings),
      `${new Date().toISOString()} — ${success ? "Accepted by provider" : "Delivery failed; check credentials and provider settings"}`,
    ],
  });
}
