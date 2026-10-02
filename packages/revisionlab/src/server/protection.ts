import { getDatabase } from "./database.js";
import { participantSession } from "./test-sessions/store.js";
import { authorizeRevisionLabRequest } from "./authentication.js";
import { resolveConfig } from "./config.js";
import { HttpError, json } from "./security.js";
import type { RevisionLabConfig } from "./types.js";

/** Node.js navigation guard. Host APIs must also authorize at their own data boundary. */
export async function protectRevisionLab(
  request: Request,
  initialConfig: RevisionLabConfig,
): Promise<Response | undefined> {
  try {
    const config = resolveConfig(initialConfig);
    const url = new URL(request.url);
    const publicPaths = [
      `${config.basePath}/access`,
      `${config.apiPath}/auth/options`,
      `${config.apiPath}/auth/request`,
      `${config.apiPath}/auth/verify`,
      `${config.apiPath}/auth/magic-request`,
      `${config.apiPath}/auth/magic-consume`,
      `${config.apiPath}/auth/logout`,
    ];
    // Participant capabilities authorize only prototype documents and their own API.
    if (
      url.pathname === `${config.apiPath}/test-participant` ||
      url.pathname.startsWith(`${config.apiPath}/test-participant/`)
    )
      return undefined;
    if (
      request.method === "GET" &&
      !url.pathname.startsWith(config.basePath) &&
      !url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith(config.apiPath)
    ) {
      const test = await participantSession(
        request,
        await getDatabase(config),
        config,
      );
      if (
        test &&
        ["waiting", "live"].includes(String(test.status)) &&
        Number(test.expires_at) > Date.now()
      )
        return undefined;
    }
    if (publicPaths.includes(url.pathname)) return undefined;
    // The federation route verifies its scoped API key; it cannot authorize host pages.
    if (url.pathname.startsWith(`${config.apiPath}/federation/`))
      return undefined;
    try {
      await authorizeRevisionLabRequest(request, config);
      return undefined;
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 401) throw error;
      if (url.pathname.startsWith("/api/") || request.method !== "GET")
        return json({ error: error.message }, 401);
      const access = new URL(`${config.basePath}/access`, url);
      access.searchParams.set("returnTo", `${url.pathname}${url.search}`);
      return new Response(null, {
        status: 307,
        headers: { Location: access.toString(), "Cache-Control": "no-store" },
      });
    }
  } catch (error) {
    return json(
      {
        error:
          error instanceof HttpError
            ? error.message
            : "Review access is temporarily unavailable.",
      },
      error instanceof HttpError ? error.status : 503,
    );
  }
}
