import { Button, Flex, Icon, Switch } from "@chakra-ui/react";
import { GitBranch, RotateCcw, Undo2 } from "lucide-react";

export function BoardToolbar({
  canEdit,
  canUndo,
  leaving,
  conflict,
  editing,
  onArrange,
  onUndo,
  onConnections,
  showCursor,
  hasCursor,
  onCursorChange,
}: {
  canEdit: boolean;
  canUndo: boolean;
  leaving: boolean;
  conflict: boolean;
  editing: boolean;
  onArrange: () => void;
  onUndo: () => void;
  onConnections: () => void;
  showCursor: boolean;
  hasCursor: boolean;
  onCursorChange: (checked: boolean) => void;
}) {
  if (!canEdit && !hasCursor) return null;
  return (
    <Flex
      p="3"
      gap="3"
      align="center"
      justify="space-between"
      flexWrap="wrap"
      bg="bg.panel"
      borderBottomWidth="1px"
      borderColor="border"
    >
      <Flex
        gap="1"
        align="center"
        flexWrap="wrap"
        aria-label="Board editing controls"
      >
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
    </Flex>
  );
}
