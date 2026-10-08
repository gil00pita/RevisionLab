import type { Client } from "@libsql/client";
import type { ResolvedConfig } from "../config.js";
import { readAccessConfiguration } from "../membership-routes.js";
import { readNotificationRecord } from "./store.js";
import { recordDelivery, sendEmail, sendSlack } from "./delivery.js";

/** Best effort after commit: a provider failure must never make the saved mutation fail. */
export async function notifyReviewEvent(
  client: Client,
  config: ResolvedConfig,
  event: {
    type: "comments" | "issues";
    title: string;
    detail: string;
    mentionRecipients?: string[];
  },
  requestDeadline = Infinity,
) {
  // Leave time for history and the response within federation's eight-second timeout.
  const deadline = Math.min(requestDeadline, Date.now() + 3000);
  try {
    const { settings } = await readNotificationRecord(client);
    const recipients = [
      ...new Set([
        ...(settings.email[event.type] ? settings.email.recipients : []),
        ...(event.mentionRecipients ?? []),
      ]),
    ];
    const email =
      recipients.length > 0 &&
      settings.defaultProvider !== "disabled" &&
      (settings.defaultProvider !== "environment" ||
        Boolean(config.resendApiKey && config.emailFrom));
    const slack = settings.slack.enabled && settings.slack[event.type];
    if (!email && !slack) return;
    const access = await readAccessConfiguration(client, config);
    const url = access.systemUrl
      ? `${access.systemUrl.replace(/\/$/, "")}${config.basePath}`
      : "";
    const subject = `${config.projectName}: ${event.title}`;
    const text = `${subject}\n\n${event.detail.slice(0, 1800)}${url ? `\n\nOpen workspace: ${url}` : ""}`;
    await Promise.allSettled(
      (["email", "slack"] as const).map(async (channel) => {
        if (!(channel === "email" ? email : slack)) return;
        let success = false;
        try {
          if (channel === "email")
            await sendEmail(
              client,
              config,
              { to: recipients, subject, text },
              deadline,
            );
          else await sendSlack(client, config, text, deadline);
          success = true;
        } finally {
          await recordDelivery(client, channel, success);
        }
      }),
    );
  } catch {
    // No payloads or provider errors are logged: they can contain credentials and private feedback.
  }
}
