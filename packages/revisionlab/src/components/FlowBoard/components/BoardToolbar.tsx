import { Button, Flex, Icon, IconButton, Switch, Text } from "@chakra-ui/react";
import {
  GitBranch,
  Maximize,
  Minus,
  Plus,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { MAX_BOARD_ZOOM } from "../viewport.js";

export function BoardToolbar({
  zoom,
  minZoom,
  canEdit,
  canUndo,
  leaving,
  conflict,
  editing,
  onZoom,
  onFit,
  onArrange,
  onUndo,
  onConnections,
  showCursor,
  hasCursor,
  onCursorChange,
}: {
  zoom: number;
  minZoom: number;
  canEdit: boolean;
  canUndo: boolean;
  leaving: boolean;
  conflict: boolean;
  editing: boolean;
  onZoom: (zoom: number) => void;
  onFit: () => void;
  onArrange: () => void;
  onUndo: () => void;
  onConnections: () => void;
  showCursor: boolean;
  hasCursor: boolean;
  onCursorChange: (checked: boolean) => void;
}) {
  return (
    <Flex
      p="3"
      gap="3"
      align="center"
      justify="space-between"
      flexWrap="wrap"
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Flex
        gap="1"
        align="center"
        flexWrap="wrap"
        aria-label="Board view controls"
      >
        <IconButton
          aria-label="Zoom out"
          size="sm"
          variant="ghost"
          onClick={() => onZoom(zoom - 0.1)}
          disabled={zoom <= minZoom}
        >
          <Icon>
            <Minus />
          </Icon>
        </IconButton>
        <Button
          aria-label="Reset zoom to 100 percent"
          size="sm"
          variant="ghost"
          onClick={() => onZoom(1)}
          minW="16"
        >
          {Math.round(zoom * 100)}%
        </Button>
        <IconButton
          aria-label="Zoom in"
          size="sm"
          variant="ghost"
          onClick={() => onZoom(zoom + 0.1)}
          disabled={zoom >= MAX_BOARD_ZOOM}
        >
          <Icon>
            <Plus />
          </Icon>
        </IconButton>
        <Button size="sm" variant="ghost" onClick={onFit}>
          <Icon>
            <Maximize />
          </Icon>
          Fit
        </Button>
        {canEdit && (
          <Button
            size="sm"
            variant={editing ? "solid" : "ghost"}
            colorPalette="blue"
            aria-pressed={editing}
            loading={leaving}
            loadingText="Finishing…"
            onClick={onConnections}
          >
            <Icon>
              <GitBranch />
            </Icon>
            {editing ? "Done editing" : "Paths"}
          </Button>
        )}
        {hasCursor && (
          <Switch.Root
            size="sm"
            colorPalette="pink"
            ml="3"
            checked={showCursor}
            onCheckedChange={(event) => onCursorChange(event.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Cursor path</Switch.Label>
          </Switch.Root>
        )}
      </Flex>
      {canEdit && editing && (
        <Flex gap="2" align="center" flexWrap="wrap">
          <Button
            size="sm"
            variant="ghost"
            disabled={leaving || conflict}
            onClick={onArrange}
          >
            <Icon>
              <RotateCcw />
            </Icon>
            Auto-arrange
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!canUndo || conflict || leaving}
            onClick={onUndo}
          >
            <Icon>
              <Undo2 />
            </Icon>
            Undo
          </Button>
        </Flex>
      )}
      <Text w="full" fontSize="xs" color="gray.600">
        Use the mouse wheel to zoom. Drag the empty board or Shift+wheel to pan.
        Open a screen to place comments.
        {editing
          ? " Changes save automatically. Undo reverses your last board edit. Move screens by their grips, or select Connect on a source and then a target screen."
          : " Select a connection to discuss that path."}
      </Text>
    </Flex>
  );
}
