interface CommentAnchor {
  id: string;
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CommentBubbleLayoutItem extends Rectangle {
  id: string;
  anchorX: number;
  anchorY: number;
  tailX: number;
  tailY: number;
}

const BUBBLE_WIDTH = 256;
const BUBBLE_HEIGHT = 128;
const PIN_GAP = 20;
const BUBBLE_GAP = 12;

function clamp(value: number, lower: number, upper: number) {
  return Math.max(lower, Math.min(upper, value));
}

function normalized(value: number) {
  return Number.isFinite(value) ? clamp(value, 0, 1) : 0;
}

function separated(first: Rectangle, second: Rectangle) {
  return (
    first.x + first.width + BUBBLE_GAP <= second.x ||
    second.x + second.width + BUBBLE_GAP <= first.x ||
    first.y + first.height + BUBBLE_GAP <= second.y ||
    second.y + second.height + BUBBLE_GAP <= first.y
  );
}

function nearestBoundary(
  rectangle: Rectangle,
  anchorX: number,
  anchorY: number,
) {
  return {
    tailX: clamp(anchorX, rectangle.x, rectangle.x + rectangle.width),
    tailY: clamp(anchorY, rectangle.y, rectangle.y + rectangle.height),
  };
}

function findOpenPosition(
  preferred: Rectangle[],
  placed: Rectangle[],
  anchorX: number,
  anchorY: number,
  imageWidth: number,
  imageHeight: number,
): Rectangle {
  const width = preferred[0].width;
  const height = BUBBLE_HEIGHT;
  const maxX = imageWidth - width;
  const xPositions = new Set(
    [
      ...preferred.map((rectangle) => rectangle.x),
      0,
      maxX,
      ...placed.flatMap((rectangle) => [
        rectangle.x - width - BUBBLE_GAP,
        rectangle.x + rectangle.width + BUBBLE_GAP,
      ]),
    ].map((x) => clamp(x, 0, maxX)),
  );
  let best: Rectangle | undefined;
  let bestOverflow = Infinity;
  let bestDistance = Infinity;

  for (const x of xPositions) {
    // Each obstacle forbids a range of top coordinates in this horizontal lane.
    const blocked = placed
      .filter(
        (rectangle) =>
          x < rectangle.x + rectangle.width + BUBBLE_GAP &&
          x + width + BUBBLE_GAP > rectangle.x,
      )
      .map((rectangle) => ({
        start: rectangle.y - height - BUBBLE_GAP,
        end: rectangle.y + rectangle.height + BUBBLE_GAP,
      }));
    if (x < anchorX + PIN_GAP && x + width > anchorX - PIN_GAP) {
      blocked.push({
        start: anchorY - height - PIN_GAP,
        end: anchorY + PIN_GAP,
      });
    }
    blocked.sort((first, second) => first.start - second.start);

    const consider = (start: number, end: number) => {
      if (start > end) return;
      const lastVisibleY = Math.max(start, imageHeight - height);
      const y = clamp(anchorY - height / 2, start, Math.min(end, lastVisibleY));
      const rectangle = { x, y, width, height };
      const overflow = Math.max(0, y + height - imageHeight);
      const tail = nearestBoundary(rectangle, anchorX, anchorY);
      const distance = Math.hypot(tail.tailX - anchorX, tail.tailY - anchorY);
      if (
        overflow < bestOverflow ||
        (overflow === bestOverflow && distance < bestDistance)
      ) {
        best = rectangle;
        bestOverflow = overflow;
        bestDistance = distance;
      }
    };

    let start = 0;
    for (const interval of blocked) {
      consider(start, interval.start);
      start = Math.max(start, interval.end);
    }
    consider(start, Infinity);
  }

  // Every lane has an unbounded final interval, so a position always exists.
  return best!;
}

/** Lay out previews without moving their saved, normalized screenshot anchors. */
export function layoutCommentBubbles(
  points: readonly CommentAnchor[],
  width: number,
  height: number,
): { items: CommentBubbleLayoutItem[]; height: number } {
  const imageWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  const imageHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const items: CommentBubbleLayoutItem[] = [];
  if (imageWidth === 0 || imageHeight === 0)
    return { items, height: imageHeight };

  const bubbleWidth = Math.min(BUBBLE_WIDTH, imageWidth);
  let canvasHeight = imageHeight;
  for (const point of points) {
    const anchorX = normalized(point.x) * imageWidth;
    const anchorY = normalized(point.y) * imageHeight;
    const centeredX = clamp(
      anchorX - bubbleWidth / 2,
      0,
      imageWidth - bubbleWidth,
    );
    const centeredY = clamp(
      anchorY - BUBBLE_HEIGHT / 2,
      0,
      Math.max(0, imageHeight - BUBBLE_HEIGHT),
    );
    const right = {
      x: anchorX + PIN_GAP,
      y: centeredY,
      width: bubbleWidth,
      height: BUBBLE_HEIGHT,
    };
    const left = { ...right, x: anchorX - bubbleWidth - PIN_GAP };
    const below = { ...right, x: centeredX, y: anchorY + PIN_GAP };
    const above = { ...below, y: anchorY - BUBBLE_HEIGHT - PIN_GAP };
    const preferred = [
      ...(anchorX <= imageWidth / 2 ? [right, left] : [left, right]),
      ...(anchorY <= imageHeight / 2 ? [below, above] : [above, below]),
    ];
    const rectangle =
      preferred.find(
        (candidate) =>
          candidate.x >= 0 &&
          candidate.x + candidate.width <= imageWidth &&
          candidate.y >= 0 &&
          candidate.y + candidate.height <= imageHeight &&
          items.every((item) => separated(candidate, item)),
      ) ??
      findOpenPosition(
        preferred,
        items,
        anchorX,
        anchorY,
        imageWidth,
        imageHeight,
      );

    items.push({
      ...rectangle,
      id: point.id,
      anchorX,
      anchorY,
      ...nearestBoundary(rectangle, anchorX, anchorY),
    });
    canvasHeight = Math.max(canvasHeight, rectangle.y + rectangle.height);
  }
  return { items, height: canvasHeight };
}
