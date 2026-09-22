import type { BoardNode } from "./types.js";

export const CARD_WIDTH = 280;
export const CARD_HEIGHT = 260;
export const BOARD_PADDING = 48;

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

export function boardBounds(nodes: BoardNode[]) {
  return {
    width: Math.max(
      640,
      ...nodes.map((node) => node.x + CARD_WIDTH + BOARD_PADDING),
    ),
    height: Math.max(
      440,
      ...nodes.map((node) => node.y + CARD_HEIGHT + BOARD_PADDING),
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

export function manualConnectionPoints(source: BoardNode, target: BoardNode) {
  const lane = Math.max(source.y, target.y) + CARD_HEIGHT + 32;
  const start = { x: source.x + CARD_WIDTH * 0.65, y: source.y + CARD_HEIGHT };
  const end = { x: target.x + CARD_WIDTH * 0.35, y: target.y + CARD_HEIGHT };
  return [start, { x: start.x, y: lane }, { x: end.x, y: lane }, end];
}
