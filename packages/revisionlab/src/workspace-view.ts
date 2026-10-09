export type WorkspaceView =
  "dashboard" | "flows" | "sessions" | "feedback" | "personas" | "settings";
export type WorkspaceSkeletonPage =
  | WorkspaceView
  | "settings-users"
  | "flow-screen"
  | "session"
  | "session-detail"
  | "feedback-sources"
  | "notifications"
  | "instructions"
  | "history";

type WorkspaceQuery = Pick<URLSearchParams, "get" | "has">;

export function getWorkspaceView(query: WorkspaceQuery): WorkspaceView {
  const view = query.get("view");
  if (view === "comments") return "feedback";
  if (view === "people") return "settings";
  if (
    view === "dashboard" ||
    view === "flows" ||
    view === "sessions" ||
    view === "feedback" ||
    view === "personas" ||
    view === "settings"
  )
    return view;
  return query.has("flow") ? "flows" : "dashboard";
}

export function getWorkspaceSkeletonPage(
  query: WorkspaceQuery,
): WorkspaceSkeletonPage {
  const view = getWorkspaceView(query);
  if (query.get("view") === "people") return "settings-users";
  if (view === "flows" && query.has("screen")) return "flow-screen";
  if (view === "sessions" && query.has("session")) return "session";
  if (
    view === "feedback" &&
    query.has("workspace") &&
    query.get("workspace") !== "local"
  )
    return "feedback-sources";
  return view;
}
