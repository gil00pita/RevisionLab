import { createRevisionLabHandler } from "revisionlab/server";
import config from "../../../../../revisionlab.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createRevisionLabHandler(config);
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
