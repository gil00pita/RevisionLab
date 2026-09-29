import { useEffect, useRef, type ReactNode } from "react";
import { CloseButton, Popover, Portal } from "@chakra-ui/react";

export function RecordingPopover({
  open,
  busy,
  onClose,
  children,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        content.current?.querySelector("input")?.focus({ preventScroll: true }),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return (
    <Popover.Root
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(event) => {
        if (!event.open && !busy) onClose();
      }}
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
      initialFocusEl={() => content.current?.querySelector("input") ?? null}
      finalFocusEl={() =>
        document.querySelector<HTMLButtonElement>(
          '[aria-label="Record prototype"], [aria-label="Stop recording"]',
        )
      }
      positioning={{
        placement: "top-end",
        strategy: "fixed",
        gutter: 12,
        getAnchorRect: () =>
          document
            .querySelector('[aria-label="RevisionLab toolbar"]')
            ?.getBoundingClientRect() ?? null,
      }}
    >
      <Portal>
        <Popover.Positioner data-revisionlab-ui>
          <Popover.Content
            aria-label="Record a flow"
            ref={content}
            w="sm"
            maxW="calc(100vw - 1.5rem)"
            bg="white"
            color="gray.900"
            borderRadius="lg"
            shadow="lg"
          >
            <Popover.Arrow />
            <Popover.Header pr="10">
              <Popover.Title>Record a flow</Popover.Title>
            </Popover.Header>
            <Popover.Body maxH="calc(100dvh - 12rem)" overflowY="auto">
              {children}
            </Popover.Body>
            <Popover.CloseTrigger asChild>
              <CloseButton
                size="sm"
                position="absolute"
                top="1"
                right="1"
                aria-label="Close recording setup"
                disabled={busy}
              />
            </Popover.CloseTrigger>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
