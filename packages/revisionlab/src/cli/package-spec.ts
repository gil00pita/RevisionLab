import { readFile } from "node:fs/promises";
import path from "node:path";

export async function resolvePackageSpec(
  override?: string,
  manifestUrl = new URL("../../package.json", import.meta.url),
): Promise<string> {
  if (override) {
    return /^(?:\.|\/|file:)/.test(override)
      ? path.resolve(override.replace(/^file:/, ""))
      : override;
  }

  // Resolve from this installed CLI, never the host project's package.json.
  const manifest: unknown = JSON.parse(await readFile(manifestUrl, "utf8"));
  if (
    !manifest ||
    typeof manifest !== "object" ||
    !("name" in manifest) ||
    typeof manifest.name !== "string" ||
    !manifest.name ||
    !("version" in manifest) ||
    typeof manifest.version !== "string" ||
    !manifest.version
  ) {
    throw new Error(
      "The RevisionLab CLI package is missing its name or version.",
    );
  }
  return `${manifest.name}@${manifest.version}`;
}
