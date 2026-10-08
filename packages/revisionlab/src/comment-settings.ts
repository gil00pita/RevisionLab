import {
  defaultAiSettings,
  type AiInstructionSettings,
} from "./ai-instructions/index.js";
import { defaultWcagSettings, type WcagSettings } from "./wcag-settings.js";

export const commentBubbleColors = [
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "purple",
  "pink",
] as const;

export type CommentBubbleColor = (typeof commentBubbleColors)[number];

export interface RevisionLabSettings extends WcagSettings {
  ai: AiInstructionSettings;
  widgetPosition: "bottom-right" | "bottom-left";
  auditLivePages: boolean;
  auditRecordings: boolean;
  showCommentBubbles: boolean;
  commentBubbleColor: CommentBubbleColor;
  showWidget: boolean;
  widgetColor: CommentBubbleColor;
  widgetSide: "left" | "right";
  widgetOffset: number;
  widgetBottomOffset: number;
}

export const defaultSettings: RevisionLabSettings = {
  ai: defaultAiSettings,
  ...defaultWcagSettings,
  widgetPosition: "bottom-right",
  auditLivePages: true,
  auditRecordings: true,
  showCommentBubbles: true,
  commentBubbleColor: "blue",
  showWidget: true,
  widgetColor: "blue",
  widgetSide: "right",
  widgetOffset: 24,
  widgetBottomOffset: 24,
};

export function commentBubbleTokens(color: CommentBubbleColor) {
  // Preserve the saved hue while the palette supplies theme-aware contrast.
  return {
    solid: `${color}.solid`,
    contrast: `${color}.contrast`,
    hover: `${color}.solid/90`,
    outline: `${color}.fg`,
    tint: `${color}.solid/10`,
  };
}
