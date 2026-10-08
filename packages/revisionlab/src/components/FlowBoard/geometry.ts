import type { RevisionLabClick, RevisionLabStep } from "../../server/types.js";
import type { BoardEdge, BoardNode } from "./types.js";

export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 300;
export const BOARD_PADDING = 48;
export const CARD_HEADER_HEIGHT = 32;
export const CARD_DETAILS_HEIGHT = 56;
export const CARD_IMAGE_WIDTH = CARD_WIDTH - 2;
export const CARD_IMAGE_HEIGHT =
  CARD_HEIGHT - 2 - CARD_HEADER_HEIGHT - CARD_DETAILS_HEIGHT;

export interface ClickPreviewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Match the screenshot's top-aligned, centered object-fit: cover crop. */
export function clickPreviewRect(
  step: RevisionLabStep,
  click: RevisionLabClick | null,
): ClickPreviewRect | null {
  const capture = step.capture;
  if (!step.screenshot || !capture || !click) return null;
  if (!(capture.width > 0 && capture.height > 0)) return null;
  const bounds = click.bounds;
  const point = click.point;
  const values = bounds
    ? [bounds.x, bounds.y, bounds.width, bounds.height]
    : point
      ? [point.x, point.y]
      : [];
  if (!values.length || values.some((value) => !Number.isFinite(value)))
    return null;
  const scale = Math.max(
    CARD_IMAGE_WIDTH / capture.width,
    CARD_IMAGE_HEIGHT / capture.height,
  );
  const cropX = (capture.width * scale - CARD_IMAGE_WIDTH) / 2;
  const left = bounds
    ? bounds.x * capture.width * scale - cropX
    : point!.x * capture.width * scale - cropX - 9;
  const top = bounds
    ? bounds.y * capture.height * scale
    : point!.y * capture.height * scale - 9;
  const right = left + (bounds ? bounds.width * capture.width * scale : 18);
  const bottom = top + (bounds ? bounds.height * capture.height * scale : 18);
  if (
    right <= 0 ||
    left >= CARD_IMAGE_WIDTH ||
    bottom <= 0 ||
    top >= CARD_IMAGE_HEIGHT
  )
    return null;
  const x = Math.max(0, left);
  const y = Math.max(0, top);
  return {
    x: x + 1,
    y: y + CARD_HEADER_HEIGHT + 1,
    width: Math.max(1, Math.min(CARD_IMAGE_WIDTH, right) - x),
    height: Math.max(1, Math.min(CARD_IMAGE_HEIGHT, bottom) - y),
  };
}

export function clickConnectionStart(
  source: BoardNode,
  target: BoardNode,
  click: ClickPreviewRect,
) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: source.x + click.x + (dx >= 0 ? click.width : 0),
      y: source.y + click.y + click.height / 2,
    };
  }
  return {
    x: source.x + click.x + click.width / 2,
    y: source.y + click.y + (dy >= 0 ? click.height : 0),
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
  const bottom = Math.max(0, ...nodes.map((node) => node.y + CARD_HEIGHT));
  for (const edge of edges) {
    const source = positions.get(edge.sourceStepId) ?? -1;
    const target = positions.get(edge.targetStepId) ?? -1;
    if (edge.kind === "manual" || target !== source + 1)
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
