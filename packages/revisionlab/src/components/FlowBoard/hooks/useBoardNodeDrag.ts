import { useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { BoardNode } from "../types.js";

export function useBoardNodeDrag(
  node: BoardNode,
  zoom: number,
  onMove: (stepId: string, x: number, y: number) => void,
  onMoveStart: (stepId: string) => void,
  onMoveEnd: () => void,
) {
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    onMoveStart(node.stepId);
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: node.x,
      y: node.y,
    };
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const origin = drag.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    onMove(
      node.stepId,
      origin.x + (event.clientX - origin.clientX) / zoom,
      origin.y + (event.clientY - origin.clientY) / zoom,
    );
  }

  function keyMove(event: KeyboardEvent<HTMLButtonElement>) {
    const distance = event.shiftKey ? 40 : 10;
    const offset = {
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
    }[event.key];
    if (!offset) return;
    event.preventDefault();
    onMoveStart(node.stepId);
    onMove(node.stepId, node.x + offset[0], node.y + offset[1]);
    onMoveEnd();
  }

  return {
    start,
    move,
    keyMove,
    end: () => {
      if (!drag.current) return;
      drag.current = null;
      onMoveEnd();
    },
  };
}
