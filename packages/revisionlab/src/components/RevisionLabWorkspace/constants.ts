import type { WorkspaceView } from "./components/WorkspaceNavigation.js";

export const workspaceViewTitles: Record<WorkspaceView, string> = {
  flows: "Flows",
  comments: "Comments",
  personas: "Personas",
  settings: "Settings",
  people: "Review access",
};

export const workspaceViewSubtitles: Record<WorkspaceView, string> = {
  flows: "Review recorded journeys, screens, and versions.",
  comments: "Review feedback and follow the discussion.",
  personas: "Organize the personas used in your recordings.",
  settings: "Configure the widget and comments on your prototype.",
  people: "Manage invitations and reviewer permissions.",
};
