import {
  Badge,
  Checkbox,
  Icon,
  IconButton,
  Popover,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Users } from "lucide-react";
import type { CommentDraft } from "../hooks/useCommentDraft.js";

export function CommentPersonaPicker({
  draft,
  disabled,
}: {
  draft: CommentDraft;
  disabled: boolean;
}) {
  return (
    <Popover.Root
      positioning={{ placement: "bottom-start", fitViewport: true }}
    >
      <Popover.Trigger asChild>
        <IconButton
          type="button"
          aria-label="Assign personas"
          title="Assign personas"
          variant="ghost"
          size="sm"
          minW="11"
          minH="11"
          disabled={disabled || !draft.supported}
        >
          <Icon boxSize="4">
            <Users />
          </Icon>
          {draft.personas.length > 0 && (
            <Badge size="xs">{draft.personas.length}</Badge>
          )}
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner
          data-revisionlab-ui
          color="fg"
          colorPalette="blue"
          zIndex="popover"
        >
          <Popover.Content
            bg="bg.panel"
            color="fg"
            w="72"
            maxW="calc(100vw - 2rem)"
          >
            <Popover.Header>
              <Popover.Title>Link personas</Popover.Title>
            </Popover.Header>
            <Popover.Body>
              <Stack gap="3" maxH="60dvh" overflowY="auto">
                {draft.options?.personas.length === 0 && (
                  <Text fontSize="sm" color="fg.muted">
                    Create a persona in Personas first.
                  </Text>
                )}
                {draft.options?.personas.map((persona) => (
                  <Checkbox.Root
                    key={persona.id}
                    checked={draft.personas.some(
                      (selected) => selected.id === persona.id,
                    )}
                    disabled={
                      disabled ||
                      (draft.personas.length >= 20 &&
                        !draft.personas.some(
                          (selected) => selected.id === persona.id,
                        ))
                    }
                    onCheckedChange={(event) =>
                      draft.setPersonas((existing) =>
                        event.checked
                          ? [...existing, persona]
                          : existing.filter(
                              (selected) => selected.id !== persona.id,
                            ),
                      )
                    }
                    minH="11"
                    alignItems="center"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Label overflowWrap="anywhere">
                      {persona.name}
                    </Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
