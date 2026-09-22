import { NextResponse, type NextRequest } from "next/server";
import { protectRevisionLab } from "revisionlab/server";
import revisionlabConfig from "../revisionlab.config";

export async function proxy(request: NextRequest) {
  return (
    (await protectRevisionLab(request, revisionlabConfig)) ??
    NextResponse.next()
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
