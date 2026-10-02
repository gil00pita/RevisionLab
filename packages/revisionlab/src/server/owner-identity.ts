import type { Client } from "@libsql/client";
import type { ResolvedConfig } from "./config.js";

/** Explicit host configuration takes precedence over an owner saved during setup. */
export async function withSetupOwner(
  client: Client,
  config: ResolvedConfig,
): Promise<ResolvedConfig> {
  if (config.ownerEmail) return config;
  const { rows } = await client.execute(
    "SELECT email FROM setup_progress WHERE id = 1 AND step > 0",
  );
  const email = rows[0]?.email;
  return email ? { ...config, ownerEmail: String(email) } : config;
}
