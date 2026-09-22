import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { Client, Transaction } from "@libsql/client";
import type { ResolvedConfig } from "./config.js";
import { HttpError } from "./security.js";

export const MAX_IMAGE_BYTES = 3_000_000;
export const MAX_CAPTURE_BODY_BYTES = 4_020_000;

interface PreparedArtifact {
  id: string;
  contentType: string;
  bytes: Buffer;
  storage: "file" | "database" | "custom";
}

async function artifactDirectory(
  config: ResolvedConfig,
  create = false,
): Promise<string> {
  const directory = resolve(config.artifactsDirectory!);
  const inspect = async (path: string, allowMissing = false) => {
    try {
      const info = await lstat(path);
      if (info.isSymbolicLink() || !info.isDirectory()) {
        throw new HttpError(
          503,
          "Screenshot storage must be a real directory, not a symbolic link.",
        );
      }
    } catch (error) {
      if (!allowMissing || (error as NodeJS.ErrnoException).code !== "ENOENT")
        throw error;
    }
  };
  await inspect(dirname(directory), create);
  await inspect(directory, create);
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 });
  // Reject redirected .revisionlab/artifacts roots as well as individual file symlinks.
  await inspect(dirname(directory));
  await inspect(directory);
  return directory;
}

function decodeImage(value: string): { bytes: Buffer; contentType: string } {
  const match =
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value,
    );
  if (!match)
    throw new HttpError(
      400,
      "Screenshots must be PNG, JPEG, or WebP image data.",
    );
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_IMAGE_BYTES)
    throw new HttpError(413, "Screenshots must be smaller than 3 MB.");
  const type = match[1];
  const valid =
    (type === "image/png" &&
      bytes.length >= 24 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (type === "image/jpeg" &&
      bytes.length >= 4 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes.at(-2) === 255 &&
      bytes.at(-1) === 217) ||
    (type === "image/webp" &&
      bytes.length >= 16 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP");
  if (!valid)
    throw new HttpError(
      400,
      "The screenshot does not contain a valid supported image.",
    );
  return { bytes, contentType: type };
}

export async function prepareArtifact(
  value: string | null | undefined,
  config: ResolvedConfig,
): Promise<PreparedArtifact | null> {
  if (!value) return null;
  const image = decodeImage(value);
  const artifact: PreparedArtifact = {
    ...image,
    id: randomUUID(),
    storage: config.artifactStorage
      ? "custom"
      : config.databaseUrl?.startsWith("file:")
        ? "file"
        : "database",
  };
  if (artifact.storage === "custom") {
    await config.artifactStorage!.put(
      artifact.id,
      artifact.bytes,
      artifact.contentType,
    );
  } else if (artifact.storage === "file") {
    const directory = await artifactDirectory(config, true);
    await writeFile(join(directory, artifact.id), artifact.bytes, {
      flag: "wx",
      mode: 0o600,
    });
  }
  return artifact;
}

export async function insertArtifact(
  transaction: Transaction,
  artifact: PreparedArtifact | null,
): Promise<void> {
  if (!artifact) return;
  await transaction.execute({
    sql: "INSERT INTO artifacts (id, content_type, size, storage, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      artifact.id,
      artifact.contentType,
      artifact.bytes.length,
      artifact.storage,
      artifact.storage === "database" ? artifact.bytes : null,
      new Date().toISOString(),
    ],
  });
}

export async function discardArtifact(
  artifact: Pick<PreparedArtifact, "id" | "storage"> | null,
  config: ResolvedConfig,
): Promise<void> {
  if (!artifact) return;
  if (artifact.storage === "custom") {
    if (!config.artifactStorage)
      throw new HttpError(
        503,
        "The configured screenshot storage is unavailable.",
      );
    await config.artifactStorage.delete(artifact.id);
  }
  if (artifact.storage === "file") {
    try {
      await unlink(join(await artifactDirectory(config), artifact.id));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

/** Call only after authenticating; artifacts deliberately have no public URL. */
export async function readArtifact(
  id: string,
  client: Client,
  config: ResolvedConfig,
): Promise<Response> {
  const result = await client.execute({
    sql: "SELECT * FROM artifacts WHERE id = ?",
    args: [id],
  });
  const artifact = result.rows[0];
  if (!artifact) throw new HttpError(404, "Screenshot not found.");
  let bytes: Uint8Array | null = null;
  if (artifact.storage === "database" && artifact.bytes instanceof ArrayBuffer)
    bytes = new Uint8Array(artifact.bytes);
  if (artifact.storage === "custom") {
    if (!config.artifactStorage)
      throw new HttpError(
        503,
        "The configured screenshot storage is unavailable.",
      );
    bytes = await config.artifactStorage.get(id);
  }
  if (artifact.storage === "file") {
    try {
      const directory = await artifactDirectory(config);
      const file = await open(
        join(directory, id),
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
      try {
        bytes = await file.readFile();
      } finally {
        await file.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ELOOP")
        throw new HttpError(
          503,
          "Screenshot storage contains an invalid symbolic link.",
        );
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  if (!bytes) throw new HttpError(404, "Screenshot not found.");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": String(artifact.content_type),
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
