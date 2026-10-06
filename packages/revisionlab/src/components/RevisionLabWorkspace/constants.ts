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
    "Your review activity, deployment, and workspace sync at a glance.",
  sessions:
    "Invite participants, follow live tests, and replay their journeys.",
  flows: "Review recorded journeys, screens, and versions.",
  comments: "Review feedback and follow the discussion.",
  personas: "Organize the personas used in your recordings.",
  settings: "Manage the widget, comments, accessibility, and reviewer access.",
};
