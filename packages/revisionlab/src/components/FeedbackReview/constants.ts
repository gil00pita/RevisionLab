import { Accessibility, FlaskConical, MessageSquare } from "lucide-react";
import type { EvidenceKind } from "../../feedback-review.js";

export const feedbackTypes = [
  { value: "comment", label: "Comments", icon: MessageSquare },
  { value: "accessibility", label: "Accessibility", icon: Accessibility },
  { value: "test", label: "Tests", icon: FlaskConical },
] satisfies {
  value: EvidenceKind;
  label: string;
  icon: typeof MessageSquare;
}[];
