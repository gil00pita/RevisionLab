import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";
import {
  fitBoard,
  MAX_BOARD_ZOOM,
  MIN_BOARD_ZOOM,
  wheelZoom,
  zoomAtPoint,
} from "../viewport.js";
import type { BoardCamera } from "../viewport.js";

export function useBoardViewport(width: number, height: number) {
  const [element, viewport] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<BoardCamera>({ zoom: 1, x: 0, y: 0 });
  const latest = useRef(camera);
  const frame = useRef<number | null>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    camera: BoardCamera;
  } | null>(null);
  const minZoom = Math.min(
    MIN_BOARD_ZOOM,
    fitBoard(width, height, size.width, size.height).zoom,
  );

  const update = useCallback((next: BoardCamera) => {
    latest.current = next;
    // Accumulate rapid wheel events immediately, rendering at most once per frame.
    if (frame.current === null)
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setCamera(latest.current);
      });
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!element) return;
    const measure = () =>
      setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  useEffect(() => {
    if (!element) return;
    function onWheel(event: WheelEvent) {
      if (!Number.isFinite(event.deltaX) || !Number.isFinite(event.deltaY))
        return;
      if (event.deltaX === 0 && event.deltaY === 0) return;
      event.preventDefault();
      if (drag.current || event.buttons !== 0) return;
      const current = latest.current;
      if (event.shiftKey || (event.deltaY === 0 && event.deltaX !== 0)) {
        const unit =
          event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? element!.clientHeight
              : 1;
        update({
          ...current,
          x: current.x - (event.deltaX || event.deltaY) * unit,
          y: current.y - (event.deltaX ? event.deltaY : 0) * unit,
        });
        return;
      }
      const bounds = element!.getBoundingClientRect();
      const next = wheelZoom(
        current.zoom,
        event.deltaY,
        event.deltaMode,
        element!.clientHeight,
        Math.min(minZoom, current.zoom),
      );
      update(
        zoomAtPoint(current, next, {
          x: event.clientX - bounds.left - element!.clientLeft,
          y: event.clientY - bounds.top - element!.clientTop,
        }),
      );
    }
    // React's delegated wheel listener is passive; cancellation stays local to this board.
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [element, minZoom, update]);

  function changeZoom(value: number) {
    if (!element || !Number.isFinite(value)) return;
    const next = Math.min(MAX_BOARD_ZOOM, Math.max(minZoom, value));
    update(
      zoomAtPoint(latest.current, next, {
        x: element.clientWidth / 2,
        y: element.clientHeight / 2,
      }),
    );
  }

  function fit() {
    if (element)
      update(
        fitBoard(width, height, element.clientWidth, element.clientHeight),
      );
  }

  function startPan(event: PointerEvent<HTMLButtonElement>) {
    if (!element || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      camera: latest.current,
    };
  }

  function pan(event: PointerEvent<HTMLButtonElement>) {
    const origin = drag.current;
    if (!origin || event.pointerId !== origin.pointerId) return;
    update({
      ...origin.camera,
      x: origin.camera.x + event.clientX - origin.x,
      y: origin.camera.y + event.clientY - origin.y,
    });
  }

  function keyPan(event: KeyboardEvent<HTMLButtonElement>) {
    const delta = {
      ArrowLeft: [-120, 0],
      ArrowRight: [120, 0],
      ArrowUp: [0, -120],
      ArrowDown: [0, 120],
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    update({
      ...latest.current,
      x: latest.current.x - delta[0],
      y: latest.current.y - delta[1],
    });
  }

  function revealFocus(event: FocusEvent<HTMLDivElement>) {
    if (
      !element ||
      event.target === element ||
      !event.target.matches(":focus-visible")
    )
      return;
    const bounds = element.getBoundingClientRect();
    const target = event.target.getBoundingClientRect();
    const offset = (start: number, end: number, low: number, high: number) =>
      start < low ? low - start : end > high ? high - end : 0;
    const x = offset(
      target.left,
      target.right,
      bounds.left,
      bounds.left + element.clientWidth,
    );
    const y = offset(
      target.top,
      target.bottom,
      bounds.top,
      bounds.top + element.clientHeight,
    );
    if (x || y)
      update({
        ...latest.current,
        x: latest.current.x + x,
        y: latest.current.y + y,
      });
  }

  return {
    viewport,
    zoom: camera.zoom,
    offset: { x: camera.x, y: camera.y },
    minZoom,
    changeZoom,
    fit,
    startPan,
    pan,
    keyPan,
    revealFocus,
    endPan: () => {
      drag.current = null;
    },
  };
}
