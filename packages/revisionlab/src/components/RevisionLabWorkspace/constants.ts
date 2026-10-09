import type { WorkspaceView } from "./components/WorkspaceNavigation.js";

export const workspaceViewTitles: Record<WorkspaceView, string> = {
  dashboard: "Overview",
  sessions: "Test sessions",
  flows: "Flows",
  feedback: "Feedback Review",
  personas: "Personas",
  settings: "Settings",
};

export const workspaceViewSubtitles: Record<WorkspaceView, string> = {
  dashboard: "Review counts and workspace activity.",
  sessions:
    "Invite participants, follow live tests, and replay their journeys.",
  flows: "Review recorded journeys, screens, and versions.",
  feedback: "Consolidate recurring feedback and draft tickets with Codex.",
  personas: "Explore the people, behaviours, and evidence behind your research.",
  settings: "Manage the widget, comments, accessibility, and reviewer access.",
};
