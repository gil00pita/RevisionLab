import { useRef } from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";

export function RecordingLeaveDialog({
  open,
  navigating,
  canContinue,
  capturing,
  state,
  busy,
  error,
  onCancel,
  onContinue,
  onDiscard,
}: {
  open: boolean;
  navigating: boolean;
  canContinue: boolean;
  capturing: boolean;
  state: "recording" | "save-pending" | "discard-pending";
  busy: boolean;
  error: string;
  onCancel: () => void;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const discardRequested = state === "discard-pending";
  const savePending = state === "save-pending";
  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(event) => {
        if (!event.open && !busy) onCancel();
      }}
      placement="center"
      size="sm"
      closeOnInteractOutside={false}
      closeOnEscape={!busy}
      initialFocusEl={() => cancelButton.current}
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner data-revisionlab-ui>
          <Dialog.Content bg="white" color="gray.900" fontFamily="body">
            <Dialog.Header flexDirection="column" gap="2" pe="12">
              <Dialog.Title>
                {savePending
                  ? "Recording stopped — saving is pending"
                  : discardRequested
                    ? "Finish discarding this recording"
                    : navigating
                      ? "Recording is still in progress"
                      : "Discard this recording?"}
              </Dialog.Title>
              <Dialog.Description color="gray.600">
                {navigating ? "You are about to leave this page. " : ""}
                {savePending
                  ? "Stay on this page and retry saving the recording before leaving. Saving may already have succeeded, so this recording cannot be discarded."
                  : "Discarding stops this recording and removes its captured screens. It will not be saved. Previously saved versions are kept."}
              </Dialog.Description>
            </Dialog.Header>
            {error && (
              <Dialog.Body>
                <Text role="alert" color="red.700">
                  {error}
                </Text>
              </Dialog.Body>
            )}
            <Dialog.Footer>
              <Stack gap="2" w="full">
                <Button
                  ref={cancelButton}
                  variant="outline"
                  disabled={busy}
                  onClick={onCancel}
                >
                  {state !== "recording"
                    ? "Stay on this page"
                    : "Stay and keep recording"}
                </Button>
                {canContinue && state === "recording" && (
                  <Button
                    colorPalette="blue"
                    disabled={busy || capturing}
                    onClick={onContinue}
                  >
                    {capturing
                      ? "Finishing screen capture…"
                      : "Continue recording on next page"}
                  </Button>
                )}
                {!savePending && (
                  <Button colorPalette="red" loading={busy} onClick={onDiscard}>
                    {navigating
                      ? "Discard recording and leave"
                      : "Discard recording"}
                  </Button>
                )}
              </Stack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                disabled={busy}
                aria-label="Stay on this page"
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
