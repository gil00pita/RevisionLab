import type { TicketTemplate } from "../../../feedback-review.js";
import { TicketOptionsPopover } from "./TicketOptionsPopover.js";
import { useState } from "react";
import {
  ActionBar,
  Button,
  CloseButton,
  Flex,
  Icon,
  Portal,
  Text,
} from "@chakra-ui/react";
import { Sparkles } from "lucide-react";

export function TicketGeneration({
  ids,
  duplicates,
  canGenerate,
  busy,
  editing,
  onGenerate,
  onGenerated,
  onClear,
  onCancel,
  templates,
  canEdit,
  onAddTemplate,
  onTemplateDirtyChange,
  templateError,
}: {
  ids: string[];
  duplicates: number;
  canGenerate: boolean;
  busy: boolean;
  editing: boolean;
  onGenerate: (
    ids: string[],
    notes: string,
    templateId: string,
  ) => Promise<boolean>;
  onGenerated: () => void;
  onClear: () => void;
  onCancel: () => void;
  templates: TicketTemplate[];
  canEdit: boolean;
  onAddTemplate: (
    name: string,
    markdown: string,
  ) => Promise<TicketTemplate | null>;
  onTemplateDirtyChange: (dirty: boolean) => void;
  templateError?: string;
}) {
  const [templateId, setTemplateId] = useState("bug-report");
  const [notes, setNotes] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  return (
    <ActionBar.Root
      open={ids.length > 0 || busy}
      closeOnInteractOutside={false}
      closeOnEscape={false}
      autoFocus={false}
      restoreFocus={false}
      placement="bottom-end"
    >
      <Portal>
        <ActionBar.Positioner
          data-revisionlab-ui
          zIndex="sticky"
          px={{ base: "2", md: "4" }}
        >
          <ActionBar.Content
            aria-label="Selected feedback actions"
            w="sm"
            maxW="full"
            flexDirection="column"
            alignItems="stretch"
            bg="white"
            color="gray.900"
            fontFamily="body"
            colorPalette="blue"
            borderWidth="1px"
            borderColor="gray.300"
            shadow="lg"
            gap="2"
            p="3"
            maxH="80dvh"
            overflowY="auto"
            _motionReduce={{ animation: "none" }}
          >
            <Flex gap="2" align="center" justify="space-between">
              <Text fontWeight="medium" fontSize="sm" role="status">
                {ids.length} source{ids.length === 1 ? "" : "s"} selected
              </Text>
              <TicketOptionsPopover
                open={optionsOpen}
                onOpenChange={setOptionsOpen}
                busy={busy}
                editing={editing}
                template={{
                  templates,
                  selected: templateId,
                  onSelect: setTemplateId,
                  disabled: busy || editing,
                  canAdd: canEdit,
                  onAdd: onAddTemplate,
                  onDirtyChange: onTemplateDirtyChange,
                  error: templateError,
                }}
                notes={notes}
                onNotes={setNotes}
                canGenerate={canGenerate}
              />
              <CloseButton
                size="sm"
                aria-label="Clear selected feedback"
                disabled={busy || editing}
                onClick={() => {
                  setOptionsOpen(false);
                  onClear();
                }}
              />
            </Flex>
            {!busy && (
              <Text fontSize="xs" color="gray.600">
                Template:{" "}
                {templates.find((item) => item.id === templateId)?.name ??
                  "Bug report"}
              </Text>
            )}
            {duplicates > 0 && (
              <Text fontSize="xs" color="orange.800">
                {duplicates} selected sources already appear in saved drafts.
                Running again will create additional drafts.
              </Text>
            )}
            {ids.length > 50 && (
              <Text role="alert" fontSize="sm" color="red.700">
                Select at most 50 source occurrences per run.
              </Text>
            )}
            {editing && (
              <Text fontSize="xs" color="gray.600">
                Save or discard ticket edits before generating more drafts.
              </Text>
            )}
            <Flex gap="2" flexWrap="wrap">
              <Button
                colorPalette="blue"
                size="sm"
                flex="1"
                loading={busy}
                loadingText="Drafting tickets…"
                disabled={
                  !canGenerate || !ids.length || ids.length > 50 || editing
                }
                onClick={() => {
                  setOptionsOpen(false);
                  void onGenerate(ids, notes, templateId).then((success) => {
                    if (success) onGenerated();
                  });
                }}
              >
                <Icon size="sm">
                  <Sparkles />
                </Icon>
                Create tickets with Codex
              </Button>
              {busy && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel Codex
                </Button>
              )}
            </Flex>
            {busy && (
              <Text fontSize="xs" color="gray.600">
                Codex is consolidating the selected evidence. This may take a
                few minutes.
              </Text>
            )}
          </ActionBar.Content>
        </ActionBar.Positioner>
      </Portal>
    </ActionBar.Root>
  );
}
