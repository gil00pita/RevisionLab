import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { useState } from "react";
import { Box, Icon, IconButton, Image, Skeleton } from "@chakra-ui/react";
import { ZoomIn } from "lucide-react";
import type { ReviewEvidence } from "../../../feedback-review.js";

export function ScreenshotImage({
  item,
  thumbnail = false,
  onZoom,
}: {
  item: ReviewEvidence;
  thumbnail?: boolean;
  onZoom?: (trigger: HTMLButtonElement) => void;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [ratio, setRatio] = useState(1);
  if (!item.screenshot || state === "error")
    return (
      <IllustratedEmptyState
        illustration="images"
        size={thumbnail ? "sm" : "md"}
        description={item.screenshot
          ? "Screenshot unavailable. Saved feedback and location remain below."
          : "No screenshot was saved for this feedback."}
      />
    );
  return (
    <Box
      position="relative"
      w={thumbnail ? `min(100%, ${Math.round(192 * ratio)}px)` : "full"}
      borderWidth="1px"
      borderColor="border.emphasized"
      bg="bg.subtle"
      rounded="md"
      overflow="hidden"
    >
      {state === "loading" && (
        <Skeleton
          position="absolute"
          inset="0"
          h="full"
          w="full"
          _motionReduce={{ animation: "none" }}
        />
      )}
      <Image
        src={item.screenshot}
        alt={`Saved screen: ${item.screen ?? item.route}`}
        loading={thumbnail ? "lazy" : "eager"}
        w="full"
        h={state === "loading" ? "32" : "auto"}
        opacity={state === "loading" ? 0 : 1}
        display="block"
        onLoad={(event) => {
          setState("ready");
          setRatio(
            event.currentTarget.naturalWidth /
              event.currentTarget.naturalHeight,
          );
        }}
        onError={() => setState("error")}
      />
      {state === "ready" && item.anchor && (
        <Box
          position="absolute"
          left={`${item.anchor.x * 100}%`}
          top={`${item.anchor.y * 100}%`}
          transform="translate(-50%, -50%)"
          w="7"
          h="7"
          rounded="full"
          bg="blue.solid"
          color="colorPalette.contrast"
          borderWidth="2px"
          borderColor="bg.panel"
          shadow="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="sm"
          fontWeight="bold"
          aria-label={`Comment location: ${Math.round(item.anchor.x * 100)}%, ${Math.round(item.anchor.y * 100)}%`}
        >
          1
        </Box>
      )}
      {onZoom && (
        <IconButton
          position="absolute"
          top="2"
          right="2"
          size="sm"
          variant="outline"
          bg="bg.panel"
          color="blue.fg"
          borderColor="border.emphasized"
          shadow="sm"
          focusRing="outside"
          _hover={{ bg: "blue.subtle" }}
          aria-label={`Zoom screenshot · ${item.screen ?? item.route}`}
          title="Zoom screenshot"
          onClick={(event) => onZoom(event.currentTarget)}
        >
          <Icon size="sm">
            <ZoomIn />
          </Icon>
        </IconButton>
      )}
    </Box>
  );
}
