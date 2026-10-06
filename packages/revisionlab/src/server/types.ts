import type { WorkspaceOrigin } from "../workspace-instances.js";
import type { RevisionLabSettings } from "../comment-settings.js";
import type { AccessibilityReport } from "../accessibility.js";
export type {
  RevisionLabSettings,
  CommentBubbleColor,
} from "../comment-settings.js";

export type RevisionLabRole = "owner" | "editor" | "commenter";

/** Server-only adapter. Keys are generated UUIDs, never user-provided paths. */
export interface RevisionLabArtifactStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
}

export interface RevisionLabConfig {
  projectId: string;
  projectName: string;
  databaseUrl?: string;
  databaseAuthToken?: string;
  ownerEmail?: string;
  resendApiKey?: string;
  emailFrom?: string;
  systemUrl?: string;
  personaEncryptionKey?: string;
  notificationEncryptionKey?: string;
  basePath?: string;
  apiPath?: string;
  localOwner?: boolean;
  artifactsDirectory?: string;
  artifactStorage?: RevisionLabArtifactStorage;
  /** Local Markdown file, relative to the host working directory or absolute. */
  aiInstructionsFile?: string;
  /** Local Git project used for Codex proposals. Defaults to the host working directory. */
  aiProjectDirectory?: string;
}

export interface RevisionLabActor {
  id: string;
  email: string;
  name: string;
  role: RevisionLabRole;
  local?: boolean;
}

/** Board positions use pixels; screenshot comment anchors use normalized 0–1 coordinates. */
export interface RevisionLabPoint {
  x: number;
  y: number;
}

export interface RevisionLabBoard {
  revision: number;
  hiddenStepIds?: string[];
  nodes: (RevisionLabPoint & { stepId: string })[];
  edges: {
    id: string;
    sourceStepId: string;
    targetStepId: string;
    label: string;
    kind: "recorded" | "manual";
  }[];
}

export interface RevisionLabFlow {
  testSessionId?: string;
  workspace?: WorkspaceOrigin;
  id: string;
  familyId: string;
  version: number;
  previousVersionId: string | null;
  name: string;
  persona: string;
  route: string;
  status: "recording" | "complete";
  createdAt: string;
  updatedAt: string;
  steps: RevisionLabStep[];
  board: RevisionLabBoard;
  transitions?: RevisionLabTransition[];
}

export interface RevisionLabClick {
  target: RevisionLabElementAnchor;
  point: RevisionLabPoint | null;
  bounds: (RevisionLabPoint & { width: number; height: number }) | null;
  activation: "pointer" | "keyboard";
}

export interface RevisionLabTransition {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  interaction: RevisionLabClick | null;
}

export interface RevisionLabStep {
  id: string;
  flowId: string;
  title: string;
  route: string;
  screenshot: string | null;
  position: number;
  createdAt: string;
  capture?: RevisionLabCapture | null;
}

export interface RevisionLabCapture {
  accessibility?: AccessibilityReport;
  width: number;
  height: number;
  reason: "page" | "click" | "change" | "manual";
  cursor: { x: number; y: number; t: number; click?: number }[];
}

export interface RevisionLabElementAnchor {
  selector: string;
  tag: string;
  label: string;
}

export interface RevisionLabComment {
  workspace?: WorkspaceOrigin;
  id: string;
  flowId: string | null;
  stepId: string | null;
  edgeId?: string | null;
  edge?: {
    sourceStepId: string;
    targetStepId: string;
    label: string;
    kind: "recorded" | "manual";
    archived: boolean;
  } | null;
  route: string;
  body: string;
  status: "open" | "resolved";
  authorName: string;
  createdAt: string;
  resolvedAt: string | null;
  anchor: RevisionLabPoint | null;
  elementAnchor?: RevisionLabElementAnchor | null;
  parentId: string | null;
}

export interface RevisionLabInvitation {
  id: string;
  email: string | null;
  role: RevisionLabRole;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface RevisionLabPersona {
  workspace?: WorkspaceOrigin;
  id: string;
  name: string;
  description: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasCredentials: boolean;
}

export type RevisionLabMembershipStatus =
  "pending" | "active" | "suspended" | "removed";

export interface RevisionLabMembership {
  id: string;
  email: string;
  name: string | null;
  role: RevisionLabRole;
  status: RevisionLabMembershipStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionLabAccessSettings {
  systemUrl: string;
  allowedEmails: string[];
  joinCodeCreatedAt: string | null;
}

export interface RevisionLabState {
  /** Optional for backwards-compatible connections to earlier installations. */
  dashboard?: { testSessions: number; ticketsCreated: number };
  setup: import("../setup.js").SetupProgress;
  settings: RevisionLabSettings;
  project: { id: string; name: string };
  actor: RevisionLabActor;
  flows: RevisionLabFlow[];
  comments: RevisionLabComment[];
  invitations: RevisionLabInvitation[];
  personas: RevisionLabPersona[];
  memberships: RevisionLabMembership[];
  accessSettings: RevisionLabAccessSettings | null;
}

export interface RevisionLabRouteContext {
  params: Promise<{ path?: string[] }>;
}

export type RevisionLabRouteHandler = (
  request: Request,
  context: RevisionLabRouteContext,
) => Promise<Response>;
