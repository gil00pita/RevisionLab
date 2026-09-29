import {
  CloseButton,
  Dialog,
  Icon,
  Link,
  Portal,
  Stack,
} from "@chakra-ui/react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function WidgetDialog({
  open,
  picking,
  onOpenChange,
  onEscape,
  title,
  projectName,
  route,
  basePath,
  children,
  actions,
}: {
  open: boolean;
  picking: boolean;
  onOpenChange: (open: boolean) => void;
  onEscape: () => void;
  title: string;
  projectName: string;
  route: string;
  basePath: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => onOpenChange(event.open)}
      restoreFocus={!picking}
      finalFocusEl={() =>
        document.querySelector<HTMLAnchorElement>(
          '[aria-label="Open RevisionLab workspace"]',
        )
      }
      motionPreset={picking ? "none" : "scale"}
      placement="center"
      size="sm"
      scrollBehavior="inside"
      onEscapeKeyDown={(event) => {
        event.preventDefault();
        onEscape();
      }}
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner data-revisionlab-ui colorPalette="blue">
          <Dialog.Content
            bg="white"
            color="gray.900"
            fontFamily="body"
            borderRadius="lg"
          >
            <Dialog.Header pb="3" display="block" pr="10">
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description
                color="gray.600"
                overflowWrap="anywhere"
                fontSize="xs"
                mt="1"
              >
                {projectName} · {route}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            <Dialog.Footer borderTopWidth="1px" borderColor="gray.200">
              <Stack gap="3" w="full">
                {actions}
                <Link
                  href={basePath}
                  fontWeight="semibold"
                  fontSize="sm"
                  color="blue.700"
                >
                  Open full workspace
                  <Icon>
                    <ArrowUpRight />
                  </Icon>
                </Link>
              </Stack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Close RevisionLab" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
