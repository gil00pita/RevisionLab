import type { Client } from "@libsql/client";
import { z } from "zod";
import type { ResolvedConfig } from "../config.js";
import type { RevisionLabActor } from "../types.js";
import { requireRole } from "../authentication.js";
import { consumeRateLimit } from "../database.js";
import { HttpError, json, readJson } from "../security.js";
import {
  readNotificationConfiguration,
  saveNotificationConfiguration,
} from "./store.js";
import { recordDelivery, sendEmail, sendSlack } from "./delivery.js";

export async function handleNotifications(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
) {
  requireRole(actor, "owner");
  if (path.length === 2 && request.method === "GET")
    return json(await readNotificationConfiguration(client, config));
  if (path.length === 2 && request.method === "PATCH")
    return json(
      await saveNotificationConfiguration(
        client,
        config,
        await readJson(request),
      ),
    );
  if (path.length === 3 && path[2] === "test" && request.method === "POST") {
    const input = z
      .discriminatedUnion("channel", [
        z.strictObject({
          channel: z.literal("email"),
          recipient: z.string().trim().email().max(254),
        }),
        z.strictObject({ channel: z.literal("slack") }),
      ])
      .parse(await readJson(request));
    await consumeRateLimit(client, `notification-test:${actor.id}`, 5, 60_000);
    try {
      const text = `This is a test notification from ${config.projectName} in RevisionLab.`;
      if (input.channel === "email")
        await sendEmail(client, config, {
          to: [input.recipient],
          subject: `${config.projectName}: test notification`,
          text,
        });
      else await sendSlack(client, config, text);
    } catch {
      await recordDelivery(client, input.channel, false);
      throw new HttpError(
        502,
        "Test delivery failed. Check the saved provider settings, credentials, and sender authorization.",
      );
    }
    await recordDelivery(client, input.channel, true);
    return json({
      message:
        "Test message accepted by the provider. Check the destination to confirm receipt.",
    });
  }
  throw new HttpError(404, "Not found.");
}
