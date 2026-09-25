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
import { CARD_HEIGHT, CARD_WIDTH } from "../geometry.js";
import type { BoardNode } from "../types.js";
import { useBoardNodeDrag } from "../hooks/useBoardNodeDrag.js";
import { CursorTrail } from "../../CursorTrail/index.js";

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
      bg="white"
      borderWidth="1px"
      borderColor={selected ? "blue.600" : "gray.300"}
      borderRadius="xl"
    >
      <Flex
        h="10"
        px="3"
        align="center"
        justify="space-between"
        gap="2"
        borderBottomWidth="1px"
        borderColor="gray.200"
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
        h="calc(100% - 2.5rem)"
        p="0"
        display="flex"
        flexDirection="column"
        gap="0"
        alignItems="stretch"
        justifyContent="start"
        borderRadius="0"
        borderBottomRadius="xl"
        color="gray.900"
        whiteSpace="normal"
        textAlign="left"
        overflow="hidden"
        aria-label={`Open screen ${number}: ${step.title}`}
        onClick={onOpen}
        _hover={{ bg: "blue.50" }}
      >
        {step.screenshot ? (
          <Box
            position="relative"
            h="132px"
            w="full"
            flexShrink="0"
            overflow="hidden"
          >
            <Image
              src={step.screenshot}
              alt=""
              h="132px"
              w="full"
              objectFit="cover"
              objectPosition="top"
              loading="lazy"
              draggable={false}
            />
            {showCursor && step.capture && (
              <CursorTrail capture={step.capture} cover />
            )}
          </Box>
        ) : (
          <Flex
            h="132px"
            align="center"
            justify="center"
            gap="2"
            color="gray.600"
            bg="gray.50"
          >
            <Icon>
              <ImageOff />
            </Icon>
            <Text fontSize="xs">No capture</Text>
          </Flex>
        )}
        <Box px="3" py="2" minW="0" flex="1">
          <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
            {step.title}
          </Text>
          <Flex gap="2" align="center" justify="space-between" mt="1">
            <Text fontSize="xs" fontFamily="mono" color="gray.600" truncate>
              {step.route}
            </Text>
            {comments > 0 && (
              <Flex
                gap="1"
                align="center"
                color="blue.700"
                flexShrink="0"
                aria-label={`${comments} open comment threads`}
              >
                <Icon size="xs">
                  <MessageCircle />
                </Icon>
                <Text fontSize="xs">{comments}</Text>
              </Flex>
            )}
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
