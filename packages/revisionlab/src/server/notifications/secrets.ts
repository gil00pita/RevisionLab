import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { ResolvedConfig } from "../config.js";
import { HttpError } from "../security.js";

export function encryptionAvailable(config: ResolvedConfig) {
  return Boolean(
    config.notificationEncryptionKey || config.databaseUrl?.startsWith("file:"),
  );
}

export async function notificationKey(config: ResolvedConfig): Promise<string> {
  const configured = config.notificationEncryptionKey;
  if (configured) {
    if (Buffer.from(configured, "base64url").length !== 32)
      throw new HttpError(
        503,
        "REVISIONLAB_NOTIFICATION_ENCRYPTION_KEY must be a 32-byte base64url secret.",
      );
    return configured;
  }
  if (!config.databaseUrl?.startsWith("file:"))
    throw new HttpError(
      503,
      "Set REVISIONLAB_NOTIFICATION_ENCRYPTION_KEY on the server before saving notification credentials.",
    );
  const path = join(
    dirname(resolve(config.databaseUrl.slice(5))),
    "notification.key",
  );
  try {
    return (await readFile(path, "utf8")).trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const key = randomBytes(32).toString("base64url");
  try {
    await writeFile(path, key, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  return (await readFile(path, "utf8")).trim();
}
