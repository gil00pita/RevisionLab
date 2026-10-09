import { ApiError, apiRequest } from "../api.js";

/** Stable visit IDs make a lost response safe to retry. */
export async function journalRequest<T>(apiPath: string, path: string, method: string, body: unknown, active: () => boolean): Promise<T> {
  let last: unknown;
  for (const delay of [0, 250, 1000, 3000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (!active()) throw new Error("Recording is no longer active.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      return await apiRequest<T>(apiPath, path, { method, body: JSON.stringify(body), signal: controller.signal });
    } catch (cause) {
      last = cause;
      if (cause instanceof ApiError && cause.status < 500 && ![408, 429].includes(cause.status)) break;
    } finally { clearTimeout(timer); }
  }
  throw last instanceof Error ? last : new Error("Could not save recorded visits. Retry saving.");
}
