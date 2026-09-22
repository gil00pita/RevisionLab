export interface BoardCamera {
  zoom: number;
  x: number;
  y: number;
}

export const MIN_BOARD_ZOOM = 0.1;
export const MAX_BOARD_ZOOM = 3;

const WHEEL_LINE_HEIGHT = 16;
const MAX_WHEEL_DELTA = 100;
const WHEEL_ZOOM_SPEED = 0.002;

function positiveFinite(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

/** Camera translation is in viewport pixels: screen = world * zoom + offset. */
export function zoomAtPoint(
  camera: BoardCamera,
  nextZoom: number,
  point: { x: number; y: number },
): BoardCamera {
  const zoom = positiveFinite(camera.zoom, 1);
  const targetZoom = positiveFinite(nextZoom, zoom);
  const x = finite(camera.x);
  const y = finite(camera.y);
  const pointX = finite(point.x, x);
  const pointY = finite(point.y, y);
  const ratio = targetZoom / zoom;

  return {
    zoom: targetZoom,
    x: finite(pointX - (pointX - x) * ratio, x),
    y: finite(pointY - (pointY - y) * ratio, y),
  };
}

export function fitBoard(
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): BoardCamera {
  if (
    [width, height, viewportWidth, viewportHeight].some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  ) {
    return { zoom: 1, x: 0, y: 0 };
  }

  // A large board can require less than the ordinary manual zoom minimum.
  const zoom = Math.max(
    Number.MIN_VALUE,
    Math.min(1, viewportWidth / width, viewportHeight / height),
  );
  return {
    zoom,
    x: (viewportWidth - width * zoom) / 2,
    y: (viewportHeight - height * zoom) / 2,
  };
}

export function wheelZoom(
  currentZoom: number,
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
  minZoom = MIN_BOARD_ZOOM,
): number {
  const minimum = Math.min(
    MAX_BOARD_ZOOM,
    positiveFinite(minZoom, MIN_BOARD_ZOOM),
  );
  const zoom = Math.min(
    MAX_BOARD_ZOOM,
    Math.max(minimum, positiveFinite(currentZoom, 1)),
  );
  const unit =
    deltaMode === 1
      ? WHEEL_LINE_HEIGHT
      : deltaMode === 2
        ? positiveFinite(viewportHeight, 800)
        : 1;
  const delta = Math.max(
    -MAX_WHEEL_DELTA,
    Math.min(MAX_WHEEL_DELTA, finite(deltaY) * unit),
  );

  return Math.min(
    MAX_BOARD_ZOOM,
    Math.max(minimum, zoom * Math.exp(-delta * WHEEL_ZOOM_SPEED)),
  );
}
