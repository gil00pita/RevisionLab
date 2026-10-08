import { NextResponse, type NextRequest } from "next/server";
import { protectRevisionLab } from "revisionlab/server";
import revisionlabConfig from "../revisionlab.config";

export async function proxy(request: NextRequest) {
  // This host's sales page and installation guide are public. Keep the
  // embedded review workspace and every API behind their existing guards.
  const path = request.nextUrl.pathname;
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    (path === "/" || path === "/setup" || path.startsWith("/fonts/"))
  ) {
    return NextResponse.next();
  }

  return (
    (await protectRevisionLab(request, revisionlabConfig)) ??
    NextResponse.next()
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
