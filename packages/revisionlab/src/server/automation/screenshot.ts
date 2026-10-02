import type { Client } from "@libsql/client";
import { z } from "zod";
import { MAX_IMAGE_BYTES, readArtifact } from "../artifacts.js";
import type { ResolvedConfig } from "../config.js";

export interface ScreenImage {
  bytes: Buffer;
  extension: string;
}
export async function screenImage(
  screenshot: string | null,
  client: Client,
  config: ResolvedConfig,
): Promise<ScreenImage | null> {
  if (!screenshot) return null;
  let bytes: Buffer;
  let contentType: string;
  const data =
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(
      screenshot,
    );
  if (data) {
    contentType = data[1];
    bytes = Buffer.from(data[2], "base64");
  } else {
    const prefix = `${config.apiPath}/artifacts/`;
    const id = screenshot.slice(prefix.length);
    if (
      !screenshot.startsWith(prefix) ||
      !z.string().uuid().safeParse(id).success
    )
      return null;
    const response = await readArtifact(id, client, config);
    contentType = response.headers.get("content-type") ?? "";
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const extension = (
    { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as Record<
      string,
      string
    >
  )[contentType];
  return extension && bytes.length <= MAX_IMAGE_BYTES
    ? { bytes, extension }
    : null;
}
