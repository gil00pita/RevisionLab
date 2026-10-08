import { useId } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Image,
  Text,
} from "@chakra-ui/react";
import { Grip, ImageOff, MessageCircle, Trash2 } from "lucide-react";
import type { RevisionLabStep } from "../../../server/types.js";
import {
  CARD_DETAILS_HEIGHT,
  CARD_HEADER_HEIGHT,
  CARD_HEIGHT,
  CARD_WIDTH,
  type ClickPreviewRect,
} from "../geometry.js";
import type { BoardNode } from "../types.js";
import { useBoardNodeDrag } from "../hooks/useBoardNodeDrag.js";
import { CursorTrail } from "../../CursorTrail/index.js";
import { AccessibilityStatus } from "../../AccessibilityStatus/index.js";

interface BoardScreenProps {
  step: RevisionLabStep;
  node: BoardNode;
  number: number;
  comments: number;
  canEdit: boolean;
  selected: boolean;
  zoom: number;
  onMove: (stepId: string, x: number, y: number) => void;
  onMoveStart: (stepId: string) => void;
  onMoveEnd: () => void;
  onOpen: () => void;
  connectionSource?: string | null;
  onConnect?: () => void;
  onRemove?: () => void;
  showCursor: boolean;
  clickTargets: { edgeId: string; rect: ClickPreviewRect; label: string }[];
}

export function BoardScreen({
  step,
  node,
  number,
  comments,
  canEdit,
  selected,
  zoom,
  onMove,
  onMoveStart,
  onMoveEnd,
  onOpen,
  connectionSource,
  onConnect,
  onRemove,
  showCursor,
  clickTargets,
}: BoardScreenProps) {
  const helpId = useId();
  const { start, move, keyMove, end } = useBoardNodeDrag(
    node,
    zoom,
    onMove,
    onMoveStart,
    onMoveEnd,
  );

  return (
    <Box
      position="absolute"
      left={`${node.x}px`}
      top={`${node.y}px`}
      w={`${CARD_WIDTH}px`}
      h={`${CARD_HEIGHT}px`}
      bg="bg.panel"
      borderWidth="1px"
      borderColor={selected ? "blue.border" : "border.emphasized"}
      borderRadius="xl"
    >
      <Flex
        h={`${CARD_HEADER_HEIGHT}px`}
        flexShrink="0"
        px="3"
        align="center"
        justify="space-between"
        gap="2"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Badge colorPalette={selected ? "blue" : "gray"}>Screen {number}</Badge>
        {canEdit && (
          <Button
            size="xs"
            variant={connectionSource === step.id ? "solid" : "outline"}
            colorPalette="blue"
            onClick={onConnect}
            aria-label={`${connectionSource ? "Connect to" : "Connect from"} screen ${number}: ${step.title}`}
          >
            {connectionSource === step.id
              ? "Cancel"
              : connectionSource
                ? "Connect here"
                : "Connect"}
          </Button>
        )}
        {canEdit && (
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="red"
            aria-label={`Remove screen ${number}: ${step.title}`}
            onClick={onRemove}
          >
            <Icon>
              <Trash2 />
            </Icon>
          </IconButton>
        )}
        {canEdit && (
          <IconButton
            aria-label={`Move screen ${number}: ${step.title}`}
            aria-describedby={helpId}
            size="xs"
            variant="ghost"
            cursor="grab"
            touchAction="none"
            _active={{ cursor: "grabbing" }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onLostPointerCapture={end}
            onKeyDown={keyMove}
          >
            <Icon>
              <Grip />
            </Icon>
          </IconButton>
        )}
      </Flex>
      <Button
        variant="plain"
        w="full"
        h={`calc(100% - ${CARD_HEADER_HEIGHT}px)`}
        p="0"
        display="flex"
        flexDirection="column"
        gap="0"
        alignItems="stretch"
        justifyContent="start"
        borderRadius="0"
        borderBottomRadius="xl"
        color="fg"
        whiteSpace="normal"
        textAlign="left"
        overflow="hidden"
        aria-label={`Open screen ${number}: ${step.title}`}
        onClick={onOpen}
        _hover={{ bg: "blue.subtle" }}
      >
        {step.screenshot ? (
          <Box
            position="relative"
            flex="1"
            minH="0"
            w="full"
            flexShrink="0"
            overflow="hidden"
          >
            <Image
              src={step.screenshot}
              alt=""
              h="full"
              w="full"
              objectFit="cover"
              objectPosition="top"
              loading="lazy"
              draggable={false}
            />
            {showCursor && step.capture && (
              <CursorTrail capture={step.capture} cover />
            )}
            {clickTargets.map(({ edgeId, rect, label }) => (
              <Box
                key={edgeId}
                aria-hidden="true"
                title={`Recorded click: ${label}`}
                position="absolute"
                left={`${rect.x - 1}px`}
                top={`${rect.y - CARD_HEADER_HEIGHT - 1}px`}
                w={`${rect.width}px`}
                h={`${rect.height}px`}
                borderWidth="2px"
                borderStyle="solid"
                borderColor="pink.border"
                bg="pink.solid/10"
                borderRadius="md"
                pointerEvents="none"
              />
            ))}
          </Box>
        ) : (
          <Flex
            flex="1"
            minH="0"
            align="center"
            justify="center"
            gap="2"
            color="fg.muted"
            bg="bg.subtle"
          >
            <Icon>
              <ImageOff />
            </Icon>
            <Text fontSize="xs">No capture</Text>
          </Flex>
        )}
        <Box
          px="3"
          py="1"
          minW="0"
          h={`${CARD_DETAILS_HEIGHT}px`}
          flexShrink="0"
        >
          <Text fontSize="xs" fontWeight="semibold" lineClamp={1}>
            {step.title}
          </Text>
          <Flex gap="2" align="center" justify="space-between" mt="0.5">
            <Text
              fontSize="xs"
              fontFamily="mono"
              color="fg.muted"
              truncate
              minW="0"
              flex="1"
            >
              {step.route}
            </Text>
            {comments > 0 && (
              <Flex
                gap="1"
                align="center"
                color="blue.fg"
                flexShrink="0"
                aria-label={`${comments} open comment threads`}
              >
                <Icon size="xs">
                  <MessageCircle />
                </Icon>
                <Text fontSize="xs">{comments}</Text>
              </Flex>
            )}
            <AccessibilityStatus report={step.capture?.accessibility} compact />
          </Flex>
        </Box>
      </Button>
      <Text id={helpId} srOnly>
        Drag to move. Arrow keys move by 10 pixels; Shift plus arrow moves by
        40.
      </Text>
    </Box>
  );
}
