import { createContext, useContext } from "react";
import type { FeedbackTarget } from "../../review-automation.js";

export const AutomationContext = createContext<{
  canEdit: boolean;
  open: (
    mode: "fix" | "ticket",
    target: FeedbackTarget,
    trigger: HTMLElement,
  ) => void;
} | null>(null);
export const useAutomation = () => useContext(AutomationContext);
