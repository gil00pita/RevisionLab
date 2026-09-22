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
      `${config.apiPath}/auth/request`,
      `${config.apiPath}/auth/verify`,
      `${config.apiPath}/auth/logout`,
    ];
    if (publicPaths.includes(url.pathname)) return undefined;
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
