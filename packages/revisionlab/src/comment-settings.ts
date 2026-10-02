import {
  defaultAiSettings,
  type AiInstructionSettings,
} from "./ai-instructions/index.js";

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

export interface RevisionLabSettings {
  ai: AiInstructionSettings;
  showCommentBubbles: boolean;
  commentBubbleColor: CommentBubbleColor;
}

export const defaultSettings: RevisionLabSettings = {
  ai: defaultAiSettings,
  showCommentBubbles: true,
  commentBubbleColor: "blue",
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
