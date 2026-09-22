import { Button, CloseButton, Dialog, Portal, Stack } from "@chakra-ui/react";

export type BoardConfirmation =
  | { kind: "screen"; id: string; title: string; connections: number }
  | { kind: "connection"; id: string };

export function BoardEditDialog({
  action,
  disabled,
  onCancel,
  onRemove,
}: {
  action: BoardConfirmation | null;
  disabled: boolean;
  onCancel: () => void;
  onRemove: () => void;
}) {
  return (
    <Dialog.Root
      role="alertdialog"
      open={Boolean(action)}
      onOpenChange={(event) => {
        if (!event.open) onCancel();
      }}
      placement="center"
      size="sm"
      closeOnInteractOutside={false}
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner data-revisionlab-ui>
          <Dialog.Content bg="white" color="gray.900" fontFamily="body">
            <Dialog.Header flexDirection="column" gap="2" pe="12">
              <Dialog.Title>
                {action?.kind === "screen"
                  ? "Remove this screen from the board?"
                  : "Remove this connection?"}
              </Dialog.Title>
              <Dialog.Description color="gray.600">
                {action?.kind === "screen"
                  ? `${action.title} and its ${action.connections} connected paths will be removed from this board. The captured screen, recording history, and comments are kept. This change saves automatically; Undo restores the screen and its paths.`
                  : "This path will be removed from the board and the change saved automatically. Its existing discussions remain in All comments. Undo restores the connection."}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Stack gap="2" w="full">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  disabled={disabled}
                  onClick={onRemove}
                >
                  Remove from board
                </Button>
              </Stack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Cancel removal" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
