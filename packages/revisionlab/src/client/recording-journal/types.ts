import type { AccessibilityReport } from "../../accessibility.js";
import type { RevisionLabCapture, RevisionLabClick, RevisionLabStep } from "../../server/types.js";

export interface JournalEntry {
  id: string;
  previousVisitId: string | null;
  route: string;
  title: string;
  capture: RevisionLabCapture;
  interaction: RevisionLabClick | null;
  reservation: { title: string; capture: RevisionLabCapture };
  revision?: number;
  reserved: boolean;
  state: "waiting" | "rendering" | "saved" | "unavailable";
  failure?: RevisionLabStep["captureFailure"];
  signature?: string;
  uploaded?: boolean;
  audit?: AccessibilityReport;
  audited?: boolean;
}
export interface JournalData {
  flowId: string;
  entries: JournalEntry[];
  limitReached?: boolean;
  pendingClick?: { sourceVisitId: string; interaction: RevisionLabClick };
}
export interface JournalStatus {
  limited?: boolean;
  pending: number;
  phase: "Ready" | "Capturing" | "Saving" | "Retry";
  error: string;
  warning: string;
}
