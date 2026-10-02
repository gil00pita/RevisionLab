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
  // Warm swatches use dark text; green/teal/cyan need darker fills for white text.
  const darkText = color === "orange" || color === "yellow";
  const shade =
    color === "yellow"
      ? "300"
      : color === "orange"
        ? "400"
        : ["green", "teal", "cyan"].includes(color)
          ? "700"
          : "600";
  return {
    solid: `${color}.${shade}`,
    contrast: darkText ? "gray.950" : "white",
    hover: `${color}.${darkText ? "500" : "800"}`,
    outline: `${color}.700`,
    tint: `${color}.500/10`,
  };
}
