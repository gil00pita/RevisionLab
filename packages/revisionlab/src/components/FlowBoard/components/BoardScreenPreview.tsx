import { Box, Image } from "@chakra-ui/react";
import type { RevisionLabStep } from "../../../server/types.js";
import { CursorTrail } from "../../CursorTrail/index.js";
import {
  CARD_HEADER_HEIGHT,
  screenshotPreviewFrame,
  type ClickPreviewPoint,
} from "../geometry.js";

export interface BoardClickTarget {
  edgeId: string;
  point: ClickPreviewPoint;
  label: string;
}

export function BoardScreenPreview({
  step,
  showCursor,
  clickTargets,
}: {
  step: RevisionLabStep;
  showCursor: boolean;
  clickTargets: BoardClickTarget[];
}) {
  const frame = screenshotPreviewFrame(step);
  return (
    <Box
      position="relative"
      flex="1"
      minH="0"
      w="full"
      flexShrink="0"
      overflow="hidden"
      bg="bg.subtle"
    >
      <Box
        position="absolute"
        left={frame ? `${frame.x}px` : "0"}
        top="0"
        w={frame ? `${frame.width}px` : "full"}
        h={frame ? `${frame.height}px` : "full"}
      >
        <Image
          src={step.screenshot!}
          alt=""
          h="full"
          w="full"
          objectFit="contain"
          objectPosition="top"
          loading="lazy"
          draggable={false}
        />
        {showCursor && step.capture && <CursorTrail capture={step.capture} />}
      </Box>
      {clickTargets.map(({ edgeId, point, label }) => (
        <Box
          key={edgeId}
          aria-hidden="true"
          title={`Recorded click: ${label}`}
          position="absolute"
          left={`${point.x - 1}px`}
          top={`${point.y - CARD_HEADER_HEIGHT - 1}px`}
          boxSize="10px"
          transform="translate(-50%, -50%)"
          bg="pink.solid"
          borderWidth="1px"
          borderColor="bg.panel"
          borderRadius="full"
          pointerEvents="none"
          zIndex="1"
        />
      ))}
    </Box>
  );
}
