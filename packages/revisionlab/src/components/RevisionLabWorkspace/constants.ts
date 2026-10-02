import type { WorkspaceView } from "./components/WorkspaceNavigation.js";

export const workspaceViewTitles: Record<WorkspaceView, string> = {
  sessions: "Test sessions",
  flows: "Flows",
  comments: "Comments",
  personas: "Personas",
  settings: "Settings",
};

export const workspaceViewSubtitles: Record<WorkspaceView, string> = {
  sessions:
    "Invite participants, follow live tests, and replay their journeys.",
  flows: "Review recorded journeys, screens, and versions.",
  comments: "Review feedback and follow the discussion.",
  personas: "Organize the personas used in your recordings.",
  settings: "Manage the widget, comments, accessibility, and reviewer access.",
};
