import { Button, Icon } from "@chakra-ui/react";
import { MessageCircle } from "lucide-react";
import { connectionGeometry, manualConnectionPoints } from "../geometry.js";
import type { BoardEdge, BoardNode } from "../types.js";

export function BoardConnectionTarget({
  edge,
  source,
  target,
  name,
  comments,
  selected,
  onSelect,
  lane,
}: {
  edge: BoardEdge;
  source: BoardNode;
  target: BoardNode;
  name: string;
  comments: number;
  selected: boolean;
  onSelect: () => void;
  lane?: number;
}) {
  const direct = connectionGeometry(source, target);
  const routed = edge.kind === "manual" || lane !== undefined;
  if (!routed && !direct) return null;
  const points = routed
    ? manualConnectionPoints(source, target, lane)
    : [direct!.start, direct!.end];
  const middle = routed
    ? { x: (points[1].x + points[2].x) / 2, y: points[1].y }
    : direct!.midpoint;
  return (
    <>
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const angle =
          (Math.atan2(next.y - point.y, next.x - point.x) * 180) / Math.PI;
        return (
          <Button
            key={index}
            position="absolute"
            left={`${point.x}px`}
            top={`${point.y - 10}px`}
            w={`${Math.hypot(next.x - point.x, next.y - point.y)}px`}
            minW="0"
            h="20px"
            p="0"
            variant="plain"
            bg="transparent"
            transform={`rotate(${angle}deg)`}
            transformOrigin="0 10px"
            pointerEvents="auto"
            tabIndex={-1}
            aria-label={`Select connection: ${name}`}
            onClick={onSelect}
          />
        );
      })}
      <Button
        position="absolute"
        left={`${middle.x}px`}
        top={`${middle.y}px`}
        transform="translate(-50%, -50%)"
        pointerEvents="auto"
        size="xs"
        maxW="48"
        h="auto"
        minH="8"
        py="1"
        whiteSpace="normal"
        overflowWrap="anywhere"
        variant={selected ? "solid" : "outline"}
        colorPalette="blue"
        bg={selected ? "blue.600" : "white"}
        aria-label={`Connection: ${name}`}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <Icon>
          <MessageCircle />
        </Icon>
        {edge.label || "Path"}
        {comments > 0 ? ` · ${comments}` : ""}
      </Button>
    </>
  );
}
