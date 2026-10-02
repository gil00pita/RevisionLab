import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";
import { HttpError } from "../security.js";

const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["192.0.2.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(address, prefix, "ipv4");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2001::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");
export function publicAddress(address: string) {
  const family = isIP(address);
  return family === 4
    ? !blocked.check(address, "ipv4")
    : family === 6 && /^[23]/i.test(address) && !blocked.check(address, "ipv6");
}
export function instanceUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new HttpError(400, "Enter a valid live HTTPS URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.port && url.port !== "443")
  )
    throw new HttpError(
      400,
      "Use a public HTTPS URL without credentials, query parameters, or a custom port.",
    );
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    (isIP(host) && !publicAddress(host))
  )
    throw new HttpError(
      400,
      "The instance must use a public internet address.",
    );
  return url.origin;
}

async function send(
  url: URL,
  key: string,
  options: { method?: string; body?: string; role?: string } = {},
): Promise<Response> {
  instanceUrl(url.origin);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let records;
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    records = await Promise.race([
      lookup(host, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => {
        dnsTimer = setTimeout(() => reject(new Error("DNS timeout")), 4000);
      }),
    ]);
  } catch {
    throw new HttpError(502, "The instance hostname could not be resolved.");
  } finally {
    clearTimeout(dnsTimer);
  }
  if (
    !records.length ||
    records.some((record) => !publicAddress(record.address))
  )
    throw new HttpError(
      400,
      "The instance must resolve only to public internet addresses.",
    );
  const address = records[0];
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: options.method ?? "GET",
        agent: false,
        lookup: (_hostname, lookupOptions, callback) => {
          if (lookupOptions.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "Accept-Encoding": "identity",
          ...(options.role ? { "X-RevisionLab-Role": options.role } : {}),
          ...(options.body
            ? { "Content-Length": Buffer.byteLength(options.body) }
            : {}),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        response.on("data", (chunk) => {
          bytes += chunk.length;
          if (bytes > 16 * 1024 * 1024)
            req.destroy(new Error("Response too large"));
          else chunks.push(Buffer.from(chunk));
        });
        response.on("end", () => {
          clearTimeout(deadline);
          const status = response.statusCode ?? 502;
          if (status >= 300 && status < 400) {
            reject(
              new HttpError(
                502,
                "The instance redirected the API request. Use its final live URL.",
              ),
            );
            return;
          }
          resolve(
            new Response(
              status === 204 || status === 205 ? null : Buffer.concat(chunks),
              {
                status,
                headers: {
                  "Content-Type": String(
                    response.headers["content-type"] ??
                      "application/octet-stream",
                  ),
                  "Cache-Control": "no-store",
                  "X-Content-Type-Options": "nosniff",
                },
              },
            ),
          );
        });
        response.on("error", () => req.destroy());
      },
    );
    const deadline = setTimeout(
      () => req.destroy(new Error("Timed out")),
      8_000,
    );
    req.on("error", () => {
      clearTimeout(deadline);
      reject(
        new HttpError(
          502,
          "The instance is unavailable or its response exceeded the limit.",
        ),
      );
    });
    if (options.body) req.write(options.body);
    req.end();
  });
}
// Replaceable in isolated integration tests; production always uses the pinned HTTPS transport.
export const instanceTransport = { send };
