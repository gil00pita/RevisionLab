import { Box, Icon, Text } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { connectionGeometry, manualConnectionPoints } from "../geometry.js";
import type { BoardEdge, BoardNode } from "../types.js";

export function BoardConnector({
  edge,
  source,
  target,
  lane,
}: {
  edge: BoardEdge;
  source: BoardNode;
  target: BoardNode;
  lane?: number;
}) {
  if (edge.kind === "manual" || lane !== undefined) {
    const points = manualConnectionPoints(source, target, lane);
    const middle = { x: (points[1].x + points[2].x) / 2, y: points[1].y };
    return (
      <Box aria-hidden="true" pointerEvents="none">
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
                borderColor={edge.kind === "manual" ? "blue.600" : "gray.600"}
              />
              {index === 2 && (
                <Icon
                  position="absolute"
                  right="-1px"
                  top="-11px"
                  w="24px"
                  h="24px"
                  color={edge.kind === "manual" ? "blue.600" : "gray.600"}
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
          bg="gray.50"
          px="2"
          py="1"
          fontSize="xs"
          color="blue.700"
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
  const color = "gray.600";
  return (
    <Box aria-hidden="true" pointerEvents="none">
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
          borderColor={color}
        />
        <Icon
          position="absolute"
          right="-1px"
          top="-11px"
          w="24px"
          h="24px"
          color={color}
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
          bg="gray.50"
          px="2"
          py="1"
          fontSize="xs"
          color={color}
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
