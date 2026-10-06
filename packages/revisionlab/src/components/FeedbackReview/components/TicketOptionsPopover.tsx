import {
  Button,
  CloseButton,
  Field,
  Icon,
  Popover,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import type { ComponentProps } from "react";
import { Settings2 } from "lucide-react";
import { TemplatePicker } from "./TemplatePicker.js";

export function TicketOptionsPopover({
  open,
  onOpenChange,
  busy,
  editing,
  template,
  notes,
  onNotes,
  canGenerate,
}: {
  template: ComponentProps<typeof TemplatePicker>;
  notes: string;
  onNotes: (notes: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  editing: boolean;
  canGenerate: boolean;
}) {
  return (
    <Popover.Root
      open={open}
      onOpenChange={(event) => onOpenChange(event.open)}
      positioning={{ placement: "top-end", strategy: "fixed", gutter: 12 }}
      closeOnInteractOutside={!editing}
      closeOnEscape={!editing}
    >
      <Popover.Trigger asChild>
        <Button size="xs" variant="ghost" disabled={busy}>
          <Icon size="sm">
            <Settings2 />
          </Icon>
          Options
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner data-revisionlab-ui zIndex="popover">
          <Popover.Content
            bg="white"
            color="gray.900"
            fontFamily="body"
            colorPalette="blue"
            w="sm"
            maxW="calc(100dvw - 1rem)"
            maxH="70dvh"
            overflowY="auto"
            shadow="lg"
            borderWidth="1px"
            borderColor="gray.300"
            _motionReduce={{ animation: "none" }}
          >
            <Popover.Header pe="12">
              <Popover.Title fontWeight="semibold">
                Ticket options
              </Popover.Title>
            </Popover.Header>
            <Popover.Body>
              <Stack gap="3">
                <TemplatePicker {...template} />
                <Field.Root disabled={busy || !canGenerate}>
                  <Field.Label>Reviewer notes (optional)</Field.Label>
                  <Textarea
                    rows={3}
                    maxLength={4000}
                    value={notes}
                    onChange={(event) => onNotes(event.target.value)}
                    borderColor="gray.500"
                    placeholder="What did you observe in the tests? What should change?"
                  />
                  <Field.HelperText>
                    Test timing and clicks provide context. Add your observed
                    findings; metrics alone do not prove a problem.
                  </Field.HelperText>
                </Field.Root>
                <Text fontSize="xs" color="gray.600">
                  {canGenerate
                    ? "Uses your signed-in local Codex account and saved AI Instructions. Selected feedback may be sent to your configured model."
                    : "Generation requires an Owner or Editor on localhost in development with a signed-in Codex CLI. Saved tickets remain available for review."}
                </Text>
              </Stack>
            </Popover.Body>
            <Popover.CloseTrigger asChild>
              <CloseButton
                position="absolute"
                top="2"
                right="2"
                size="sm"
                aria-label="Close ticket options"
              />
            </Popover.CloseTrigger>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
