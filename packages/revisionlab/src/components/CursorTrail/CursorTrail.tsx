"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import type { RevisionLabCapture } from "../../server/types.js";

export function CursorTrail({
  capture,
  cover = false,
}: {
  capture: RevisionLabCapture;
  cover?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const scale = cover
    ? Math.max(size.width / capture.width, size.height / capture.height)
    : 1;
  const points = capture.cursor.map((point) => ({
    ...point,
    x: cover
      ? point.x * capture.width * scale -
        (capture.width * scale - size.width) / 2
      : point.x * size.width,
    y: cover ? point.y * capture.height * scale : point.y * size.height,
  }));
  return (
    <Box
      ref={root}
      position="absolute"
      inset="0"
      overflow="hidden"
      pointerEvents="none"
      role="img"
      aria-label={`Cursor path with ${points.filter((point) => point.click).length} numbered clicks`}
    >
      {points.slice(1).map((point, index) => {
        const from = points[index];
        const dx = point.x - from.x,
          dy = point.y - from.y;
        return (
          <Box
            key={`line-${index}`}
            position="absolute"
            left={`${from.x}px`}
            top={`${from.y}px`}
            w={`${Math.hypot(dx, dy)}px`}
            h="2px"
            bg="pink.600"
            outlineWidth="1px"
            outlineStyle="solid"
            outlineColor="white"
            transform={`rotate(${Math.atan2(dy, dx)}rad)`}
            transformOrigin="left center"
          />
        );
      })}
      {points
        .filter((point) => point.click)
        .map((point, index) => (
          <Flex
            key={`click-${index}`}
            position="absolute"
            left={`${point.x}px`}
            top={`${point.y}px`}
            transform="translate(-50%, -50%)"
            minW="5"
            h="5"
            px="1"
            align="center"
            justify="center"
            borderRadius="full"
            borderWidth="1px"
            borderColor="white"
            bg="pink.700"
            color="white"
            fontSize="10px"
            fontWeight="bold"
          >
            {point.click}
          </Flex>
        ))}
    </Box>
  );
}
