import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export function createToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function createOtp(): string {
  return randomInt(100_000, 1_000_000).toString();
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function valuesMatch(value: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashValue(value));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function encryptionKey(encoded: string): Buffer {
  const key = Buffer.from(encoded, "base64url");
  if (key.length !== 32)
    throw new HttpError(
      503,
      "Configure REVISIONLAB_PERSONA_ENCRYPTION_KEY as a 32-byte base64url secret.",
    );
  return key;
}

export function encryptSecret(value: string, encodedKey: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(encodedKey),
    nonce,
  );
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    nonce.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value: string, encodedKey: string): string {
  const [version, nonce, tag, ciphertext] = value.split(".");
  if (version !== "v1" || !nonce || !tag || ciphertext == null)
    throw new HttpError(500, "Stored persona credentials are invalid.");
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(encodedKey),
      Buffer.from(nonce, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Stored persona credentials cannot be opened.");
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new HttpError(403, "Cross-origin requests are not allowed.");
  }
  if (!origin) return;
  let matches = false;
  try {
    matches = new URL(origin).origin === new URL(request.url).origin;
  } catch {
    /* Invalid origins fail closed. */
  }
  if (!matches) {
    throw new HttpError(403, "Cross-origin requests are not allowed.");
  }
}

export function isLoopback(request: Request): boolean {
  const hosts = [new URL(request.url).hostname];
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    try {
      hosts.push(new URL(`http://${forwardedHost}`).hostname);
    } catch {
      return false;
    }
  }
  return (
    hosts.every((host) => ["localhost", "127.0.0.1", "[::1]"].includes(host)) &&
    !request.headers.has("forwarded")
  );
}

export async function readJson(
  request: Request,
  maximumBytes = 16_384,
): Promise<unknown> {
  if (
    !/^application\/json(?:;|$)/i.test(
      request.headers.get("content-type") ?? "",
    )
  ) {
    throw new HttpError(415, "Send this request as application/json.");
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maximumBytes)
    throw new HttpError(413, "This request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A JSON request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel();
        throw new HttpError(413, "This request is too large.");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "The request body must contain valid JSON.");
  } finally {
    reader.releaseLock();
  }
}

export function json(
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
