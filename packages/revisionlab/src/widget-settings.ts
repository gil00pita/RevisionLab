import type {
  CommentBubbleColor,
  RevisionLabSettings,
} from "./comment-settings.js";

export type WidgetSettings = Pick<
  RevisionLabSettings,
  | "showWidget"
  | "widgetColor"
  | "widgetSide"
  | "widgetOffset"
  | "widgetBottomOffset"
>;

export const maxWidgetOffset = 1000;

export function widgetColorTokens(color: CommentBubbleColor) {
  // Keep the supplied white mark and all controls legible on every palette.
  return {
    solid: `${color}.${color === "blue" ? "600" : "700"}`,
    contrast: "white",
    outline: `${color}.800`,
  };
}

export function widgetPlacement(settings: WidgetSettings, panel = false) {
  // Reserve enough room for the full toolbar (including all active stops),
  // or its wider help/status panel, even with a very large saved offset.
  const width = panel ? "min(320px, calc(100vw - 24px))" : "244px";
  const horizontal = `clamp(0px, ${settings.widgetOffset}px, calc(100vw - ${width} - 12px))`;
  const bottom = panel
    ? `clamp(48px, ${settings.widgetBottomOffset + 48}px, calc(100dvh - 220px))`
    : `clamp(0px, ${settings.widgetBottomOffset}px, calc(100dvh - 48px))`;
  return {
    left: settings.widgetSide === "left" ? horizontal : undefined,
    right: settings.widgetSide === "right" ? horizontal : undefined,
    bottom,
  };
}
