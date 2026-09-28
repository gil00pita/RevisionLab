import { useRef } from "react";
import {
  Button,
  Dialog,
  Icon,
  List,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Trash2 } from "lucide-react";

import type { FlowDeletionTarget } from "../hooks/useFlowList.js";

export function DeleteFlowsDialog({
  targets,
  busy,
  error,
  onCancel,
  onConfirm,
  finalFocus,
}: {
  targets: FlowDeletionTarget[];
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <Dialog.Root
      open
      role="alertdialog"
      size="sm"
      placement="center"
      initialFocusEl={() => cancel.current}
      finalFocusEl={finalFocus}
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
      onOpenChange={(event) => {
        if (!event.open && !busy) onCancel();
      }}
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner data-revisionlab-ui p="4">
          <Dialog.Content
            maxW="md"
            w="full"
            borderRadius="lg"
            bg="white"
            color="gray.900"
            fontFamily="body"
            fontSize="sm"
            lineHeight="1.6"
            colorPalette="blue"
          >
            <Dialog.Header>
              <Dialog.Title>
                Delete{" "}
                {targets.length === 1 ? "flow" : `${targets.length} flows`}?
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                <Dialog.Description>
                  All versions, screenshots, boards, and attached comments for
                  these flows will be permanently deleted. This cannot be
                  undone.
                </Dialog.Description>
                <List.Root gap="2" maxH="60" overflowY="auto" ps="5">
                  {targets.map((target) => (
                    <List.Item key={target.familyId}>
                      <Text fontWeight="semibold" overflowWrap="anywhere">
                        {target.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {target.versions}{" "}
                        {target.versions === 1 ? "version" : "versions"},{" "}
                        {target.screens}{" "}
                        {target.screens === 1 ? "screen" : "screens"}
                      </Text>
                    </List.Item>
                  ))}
                </List.Root>
                {error && (
                  <Text role="alert" color="red.700" overflowWrap="anywhere">
                    {error}
                  </Text>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer flexWrap="wrap">
              <Button
                ref={cancel}
                variant="outline"
                disabled={busy}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                colorPalette="red"
                loading={busy}
                disabled={busy}
                onClick={onConfirm}
              >
                <Icon>
                  <Trash2 />
                </Icon>
                {error
                  ? "Retry deletion"
                  : targets.length === 1
                    ? "Delete flow"
                    : `Delete ${targets.length} flows`}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
