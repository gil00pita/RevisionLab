import type { WorkspaceView } from "./components/WorkspaceNavigation.js";

export const workspaceViewTitles: Record<WorkspaceView, string> = {
  dashboard: "Dashboard",
  sessions: "Test sessions",
  flows: "Flows",
  comments: "Comments",
  personas: "Personas",
  settings: "Settings",
};

export const workspaceViewSubtitles: Record<WorkspaceView, string> = {
  dashboard:
    "Review counts, workspace connections, and the last successful sync.",
  sessions:
    "Invite participants, follow live tests, and replay their journeys.",
  flows: "Review recorded journeys, screens, and versions.",
  comments: "Review feedback and follow the discussion.",
  personas: "Organize the personas used in your recordings.",
  settings: "Manage the widget, comments, accessibility, and reviewer access.",
};
