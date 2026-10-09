import { Box, Icon, Text } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import {
  clickConnectionStart,
  connectionGeometry,
  manualConnectionPoints,
  type ClickPreviewPoint,
} from "../geometry.js";
import type { BoardEdge, BoardNode } from "../types.js";

const connectorColor = "fg.muted";

export function BoardConnector({
  edge,
  source,
  target,
  lane,
  click,
}: {
  edge: BoardEdge;
  source: BoardNode;
  target: BoardNode;
  lane?: number;
  click?: ClickPreviewPoint;
}) {
  if (edge.kind === "manual" || lane !== undefined) {
    const points = manualConnectionPoints(source, target, lane);
    const middle = { x: (points[1].x + points[2].x) / 2, y: points[1].y };
    return (
      <Box aria-hidden="true" pointerEvents="none">
        {edge.kind === "recorded" && click && (
          <ClickLead
            start={clickConnectionStart(source, click)}
            end={points[0]}
          />
        )}
        {points.slice(0, -1).map((point, index) => {
          const next = points[index + 1];
          const length = Math.hypot(next.x - point.x, next.y - point.y);
          const angle =
            (Math.atan2(next.y - point.y, next.x - point.x) * 180) / Math.PI;
          return (
            <Box
              key={index}
              position="absolute"
              left={`${point.x}px`}
              top={`${point.y}px`}
              w={`${length}px`}
              h="0"
              transform={`rotate(${angle}deg)`}
              transformOrigin="left center"
            >
              <Box
                borderTopWidth="2px"
                borderStyle={edge.kind === "manual" ? "dashed" : "solid"}
                borderColor={connectorColor}
              />
              {index === 2 && (
                <Icon
                  position="absolute"
                  right="-1px"
                  top="-11px"
                  w="24px"
                  h="24px"
                  color={connectorColor}
                >
                  <ArrowRight />
                </Icon>
              )}
            </Box>
          );
        })}
        <Text
          position="absolute"
          left={`${middle.x}px`}
          top={`${middle.y}px`}
          transform="translate(-50%, -50%)"
          maxW="48"
          bg="bg.subtle"
          px="2"
          py="1"
          fontSize="xs"
          color={connectorColor}
          borderRadius="sm"
          textAlign="center"
          lineClamp={2}
        >
          {edge.label}
        </Text>
      </Box>
    );
  }
  const geometry = connectionGeometry(source, target);
  if (!geometry) return null;
  return (
    <Box aria-hidden="true" pointerEvents="none">
      {click && (
        <ClickLead
          start={clickConnectionStart(source, click)}
          end={geometry.start}
        />
      )}
      <Box
        position="absolute"
        left={`${geometry.start.x}px`}
        top={`${geometry.start.y}px`}
        w={`${geometry.length}px`}
        h="0"
        transform={`rotate(${geometry.angle}deg)`}
        transformOrigin="left center"
      >
        <Box
          position="absolute"
          left="0"
          right="2"
          top="0"
          borderTopWidth="2px"
          borderStyle="solid"
          borderColor={connectorColor}
        />
        <Icon
          position="absolute"
          right="-1px"
          top="-11px"
          w="24px"
          h="24px"
          color={connectorColor}
        >
          <ArrowRight />
        </Icon>
      </Box>
      {edge.label && (
        <Text
          position="absolute"
          left={`${geometry.midpoint.x}px`}
          top={`${geometry.midpoint.y - 16}px`}
          transform="translate(-50%, -50%)"
          maxW="48"
          bg="bg.subtle"
          px="2"
          py="1"
          fontSize="xs"
          color={connectorColor}
          borderRadius="sm"
          textAlign="center"
          lineClamp={2}
        >
          {edge.label}
        </Text>
      )}
    </Box>
  );
}

function ClickLead({
  start,
  end,
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
}) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return (
    <Box
      position="absolute"
      left={`${start.x}px`}
      top={`${start.y}px`}
      w={`${Math.hypot(dx, dy)}px`}
      h="0"
      transform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`}
      transformOrigin="left center"
      borderTopWidth="2px"
      borderStyle="solid"
      borderColor={connectorColor}
    />
  );
}
