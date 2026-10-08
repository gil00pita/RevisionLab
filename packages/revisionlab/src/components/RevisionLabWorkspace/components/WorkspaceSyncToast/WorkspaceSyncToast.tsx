import { useEffect, useRef, useState } from "react";
import {
  CloseButton,
  Flex,
  Portal,
  Toast,
  Toaster,
  createToaster,
} from "@chakra-ui/react";
import type { WorkspaceState } from "../../../../workspace-instances.js";

const syncToastId = "workspace-sync-error";

export function WorkspaceSyncToast({
  data,
  syncError,
}: {
  data: WorkspaceState;
  syncError: boolean;
}) {
  const [toaster] = useState(() =>
    createToaster({
      placement: "top-end",
      max: 1,
      pauseOnPageIdle: true,
    }),
  );
  const notified = useRef(false);
  const unavailable = data.workspaces.filter(
    (source) =>
      (data.selection === "all" || source.id === data.selection) &&
      source.status !== "connected",
  );
  const failed = syncError || unavailable.length > 0;
  const description = syncError
    ? "Could not update workspace data. Showing last-loaded data where available. Retrying automatically."
    : `Could not sync ${unavailable.map((source) => source.name).join(", ")}. Showing last-loaded data where available. Retrying automatically.`;

  useEffect(() => {
    let cancelled = false;
    // Toast stores flush subscribers synchronously; update them outside React's effect lifecycle.
    queueMicrotask(() => {
      if (cancelled) return;
      if (!failed) {
        notified.current = false;
        toaster.dismiss(syncToastId);
      } else if (!notified.current) {
        notified.current = true;
        toaster.create({
          id: syncToastId,
          type: "error",
          title: "Workspace sync interrupted",
          description,
          duration: 10_000,
          closable: true,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [failed, description, toaster]);

  return (
    <Portal>
      <Toaster toaster={toaster} data-revisionlab-ui color="fg" colorPalette="red">
        {(toast) => (
          <Toast.Root
            bg="red.subtle"
            color="red.fg"
            borderWidth="1px"
            borderColor="red.border"
            display="block"
            pe="4"
            w="sm"
            maxW="calc(100vw - 2rem)"
            overflowWrap="anywhere"
            _motionReduce={{ transition: "none" }}
          >
            <Flex gap="2" align="start">
              <Toast.Indicator hideBelow="md" />
              <Toast.Title flex="1" minW="0">
                {toast.title}
              </Toast.Title>
              <Toast.CloseTrigger asChild>
                <CloseButton
                  aria-label="Dismiss sync error"
                  position="static"
                  flexShrink="0"
                  mt="-2"
                  me="-2"
                  minH="11"
                  minW="11"
                  color="red.fg"
                  _hover={{ bg: "red.muted" }}
                  focusRing="inside"
                  focusRingColor="red.fg"
                />
              </Toast.CloseTrigger>
            </Flex>
            <Toast.Description display="block" mt="2" opacity="1">
              {toast.description}
            </Toast.Description>
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
}
