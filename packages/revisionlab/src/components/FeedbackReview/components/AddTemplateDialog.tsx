import { useEffect, useState } from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import type { TicketTemplate } from "../../../feedback-review.js";

export function AddTemplateDialog({
  open,
  onClose,
  onAdd,
  onDirtyChange,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, markdown: string) => Promise<TicketTemplate | null>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = open && (Boolean(name || markdown) || saving);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  function close() {
    if (!saving) {
      setName("");
      setMarkdown("");
      setError("");
      onClose();
    }
  }
  async function save() {
    setSaving(true);
    setError("");
    try {
      const result = await onAdd(name, markdown);
      if (result) {
        setName("");
        setMarkdown("");
        onClose();
      } else
        setError(
          "Could not save the template. Your text is retained; check the error above and retry.",
        );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => {
        if (!event.open) close();
      }}
      closeOnEscape={!saving}
      closeOnInteractOutside={false}
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner data-revisionlab-ui>
          <Dialog.Content
            bg="white"
            color="gray.900"
            fontFamily="body"
            colorPalette="blue"
          >
            <Dialog.Header flexDirection="column" gap="2" pe="12">
              <Dialog.Title>Add ticket template</Dialog.Title>
              <Dialog.Description>
                Save reusable Markdown guidance for future tickets.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                <Field.Root required disabled={saving}>
                  <Field.Label>Template name</Field.Label>
                  <Input
                    value={name}
                    maxLength={100}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Design improvement"
                    borderColor="gray.500"
                  />
                </Field.Root>
                <Field.Root required disabled={saving}>
                  <Field.Label>Template Markdown</Field.Label>
                  <Textarea
                    rows={10}
                    value={markdown}
                    maxLength={16_000}
                    onChange={(event) => setMarkdown(event.target.value)}
                    placeholder={
                      "## Problem\nDescribe the feedback and user impact.\n\n## Proposed outcome\nDescribe the desired change.\n\nWrite acceptance criteria as a checklist."
                    }
                    borderColor="gray.500"
                  />
                  <Field.HelperText>
                    A .md file is saved in this installation. Use headings and
                    instructions for the ticket description and acceptance
                    criteria.
                  </Field.HelperText>
                </Field.Root>
                {error && (
                  <Text role="alert" color="red.700">
                    {error}
                  </Text>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" disabled={saving} onClick={close}>
                Cancel template
              </Button>
              <Button
                colorPalette="blue"
                loading={saving}
                disabled={!name.trim() || !markdown.trim()}
                onClick={() => void save()}
              >
                Save template
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" disabled={saving} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
