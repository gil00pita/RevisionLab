import { useRef, useState } from "react";
import { CloseButton, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../../client/api.js";
import { WorkspaceInstanceForm, type InstanceInput } from "../WorkspaceInstanceForm.js";

export function WorkspaceConnectionDialog({
  apiPath,
  onRefresh,
  onClose,
  finalFocus,
}: {
  apiPath: string;
  onRefresh: () => Promise<void>;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(input: InstanceInput) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, "instances", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await onRefresh();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect this workspace.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog.Root
      open
      size="md"
      placement="center"
      scrollBehavior="inside"
      finalFocusEl={finalFocus}
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
      onOpenChange={(event) => { if (!event.open && !busy) onClose(); }}
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui _motionReduce={{ animation: "none" }} />
        <Dialog.Positioner data-revisionlab-ui color="fg" colorPalette="blue" p="4">
          <Dialog.Content
            w="full"
            maxW="lg"
            maxH="calc(100dvh - 2rem)"
            bg="bg.panel"
            color="fg"
            fontFamily="body"
            fontSize="sm"
            colorPalette="blue"
            overflowWrap="anywhere"
            _motionReduce={{ animation: "none" }}
          >
            <Dialog.Header pe="12">
              <Dialog.Title>Add workspace</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb="6">
              <Stack gap="5">
                <Dialog.Description color="fg.muted">
                  Connect another installation of this project using its live URL and API key.
                </Dialog.Description>
                {error && <Text role="alert" color="red.fg">{error}</Text>}
                <WorkspaceInstanceForm busy={busy} onSave={save} onCancel={onClose} />
              </Stack>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" minW="11" minH="11" disabled={busy} aria-label="Close add workspace" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
