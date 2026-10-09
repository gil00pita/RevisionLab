import type { RevisionLabClick, RevisionLabStep } from "../../server/types.js";
import type { BoardEdge, BoardNode } from "./types.js";

export const BOARD_LAYOUT_SCALE = 2;
export const BOARD_PADDING = 48;
export const CARD_HEADER_HEIGHT = 32;
export const CARD_DETAILS_HEIGHT = 56;
export const CARD_IMAGE_WIDTH = 298 * BOARD_LAYOUT_SCALE;
export const CARD_IMAGE_HEIGHT = 210 * BOARD_LAYOUT_SCALE;
export const CARD_WIDTH = CARD_IMAGE_WIDTH + 2;
export const CARD_HEIGHT =
  CARD_IMAGE_HEIGHT + 2 + CARD_HEADER_HEIGHT + CARD_DETAILS_HEIGHT;

export interface PreviewFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClickPreviewPoint {
  x: number;
  y: number;
}

/** Keep persisted coordinates unchanged while spacing the enlarged cards apart. */
export function displayNode(node: BoardNode): BoardNode {
  return {
    ...node,
    x: node.x * BOARD_LAYOUT_SCALE,
    y: node.y * BOARD_LAYOUT_SCALE,
  };
}

export function storedPosition(x: number, y: number) {
  return { x: x / BOARD_LAYOUT_SCALE, y: y / BOARD_LAYOUT_SCALE };
}

/** Match the full screenshot's top-aligned, centered object-fit: contain. */
export function screenshotPreviewFrame(
  step: RevisionLabStep,
): PreviewFrame | null {
  const capture = step.capture;
  if (
    !capture ||
    ![capture.width, capture.height].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return null;
  const scale = Math.min(
    CARD_IMAGE_WIDTH / capture.width,
    CARD_IMAGE_HEIGHT / capture.height,
  );
  const width = capture.width * scale;
  return {
    x: (CARD_IMAGE_WIDTH - width) / 2,
    y: 0,
    width,
    height: capture.height * scale,
  };
}

export function recordedClickPoint(
  click: RevisionLabClick | null,
): ClickPreviewPoint | null {
  if (!click) return null;
  const bounds = click.bounds;
  const validBounds =
    bounds &&
    [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) &&
    bounds.width > 0 &&
    bounds.height > 0 &&
    bounds.x >= 0 &&
    bounds.y >= 0 &&
    bounds.x + bounds.width <= 1 &&
    bounds.y + bounds.height <= 1;
  const point = click.point ??
    (validBounds
      ? {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        }
      : null);
  return point &&
    [point.x, point.y].every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 1,
    )
    ? point
    : null;
}

export function clickPreviewPoint(
  step: RevisionLabStep,
  click: RevisionLabClick | null,
): ClickPreviewPoint | null {
  const frame = screenshotPreviewFrame(step);
  const point = recordedClickPoint(click);
  if (!step.screenshot || !frame || !point) return null;
  return {
    x: frame.x + point.x * frame.width + 1,
    y: point.y * frame.height + CARD_HEADER_HEIGHT + 1,
  };
}

export function clickConnectionStart(
  source: BoardNode,
  click: ClickPreviewPoint,
) {
  return {
    x: source.x + click.x,
    y: source.y + click.y,
  };
}

export function clampPosition(value: number) {
  return Math.min(50000, Math.max(0, Math.round(value)));
}

export function arrangeNodes(stepIds: string[]): BoardNode[] {
  return stepIds.map((stepId, index) => ({
    stepId,
    x: BOARD_PADDING + (index % 100) * 360,
    y: BOARD_PADDING + Math.floor(index / 100) * 400,
  }));
}

export function connectionLanes(nodes: BoardNode[], edges: BoardEdge[]) {
  const lanes = new Map<string, number>();
  const positions = new Map(nodes.map((node, index) => [node.stepId, index]));
  const byId = new Map(nodes.map((node) => [node.stepId, node]));
  const bottom = Math.max(0, ...nodes.map((node) => node.y + CARD_HEIGHT));
  for (const edge of edges) {
    const source = positions.get(edge.sourceStepId) ?? -1;
    const target = positions.get(edge.targetStepId) ?? -1;
    const from = byId.get(edge.sourceStepId);
    const to = byId.get(edge.targetStepId);
    if (!from || !to) continue;
    if (
      edge.kind === "manual" ||
      target !== source + 1 ||
      !connectionGeometry(from, to)
    )
      lanes.set(edge.id, bottom + 40 + lanes.size * 44);
  }
  return lanes;
}

export function boardBounds(nodes: BoardNode[], edges: BoardEdge[] = []) {
  return {
    width: Math.max(
      640,
      ...nodes.map((node) => node.x + CARD_WIDTH + BOARD_PADDING),
    ),
    height: Math.max(
      440,
      ...nodes.map((node) => node.y + CARD_HEIGHT + BOARD_PADDING),
      ...[...connectionLanes(nodes, edges).values()].map(
        (lane) => lane + BOARD_PADDING,
      ),
    ),
  };
}

/** Clip the connector to each card's perimeter so arrows never cover its image. */
export function connectionGeometry(source: BoardNode, target: BoardNode) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return null;
  const ratio = Math.min(
    dx === 0 ? Infinity : CARD_WIDTH / 2 / Math.abs(dx),
    dy === 0 ? Infinity : CARD_HEIGHT / 2 / Math.abs(dy),
  );
  if (ratio >= 0.5) return null;
  const start = {
    x: source.x + CARD_WIDTH / 2 + dx * ratio,
    y: source.y + CARD_HEIGHT / 2 + dy * ratio,
  };
  const end = {
    x: target.x + CARD_WIDTH / 2 - dx * ratio,
    y: target.y + CARD_HEIGHT / 2 - dy * ratio,
  };
  return {
    start,
    end,
    length: Math.hypot(end.x - start.x, end.y - start.y),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
  };
}

export function manualConnectionPoints(
  source: BoardNode,
  target: BoardNode,
  lane = Math.max(source.y, target.y) + CARD_HEIGHT + 32,
) {
  const start = { x: source.x + CARD_WIDTH * 0.65, y: source.y + CARD_HEIGHT };
  const end = { x: target.x + CARD_WIDTH * 0.35, y: target.y + CARD_HEIGHT };
  return [start, { x: start.x, y: lane }, { x: end.x, y: lane }, end];
}
