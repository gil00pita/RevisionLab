import type { RevisionLabRole, RevisionLabState } from "./server/types.js";

export interface WorkspaceOrigin {
  id: string;
  name: string;
  url: string;
  basePath: string;
  role: RevisionLabRole;
}
export interface WorkspaceInstance extends WorkspaceOrigin {
  dashboard?: RevisionLabState["dashboard"];
  /** Client-side evidence timestamp, retained only for successfully loaded sources. */
  lastLoadedAt?: number;
  instanceId: string;
  apiPath: string;
  status: "connected" | "unavailable";
  error?: string;
}
export interface WorkspaceApiKey {
  id: string;
  name: string;
  role: "editor" | "commenter";
  createdAt: string;
  revokedAt: string | null;
}
export interface WorkspaceState extends RevisionLabState {
  workspaces: WorkspaceInstance[];
  selection: string;
  settingsWorkspace?: WorkspaceInstance;
}
export function sourceApiPath(apiPath: string, source?: WorkspaceOrigin) {
  return !source || source.id === "local"
    ? apiPath
    : `${apiPath}/instances/${source.id}/proxy`;
}
export function sourceCanEdit(role: RevisionLabRole, source?: WorkspaceOrigin) {
  return role !== "commenter" && (!source || source.role !== "commenter");
}
export function rawSourceId(id: string) {
  return id.includes("~") ? id.slice(id.indexOf("~") + 1) : id;
}
