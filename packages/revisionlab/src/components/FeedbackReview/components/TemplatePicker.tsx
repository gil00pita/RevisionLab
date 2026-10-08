import { useState } from "react";
import {
  Button,
  createListCollection,
  Field,
  Flex,
  Portal,
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import type { TicketTemplate } from "../../../feedback-review.js";
import { AddTemplateDialog } from "./AddTemplateDialog.js";

export function TemplatePicker({
  templates,
  selected,
  onSelect,
  disabled,
  canAdd,
  onAdd,
  onDirtyChange,
  error,
}: {
  templates: TicketTemplate[];
  selected: string;
  onSelect: (id: string) => void;
  disabled: boolean;
  canAdd: boolean;
  onAdd: (name: string, markdown: string) => Promise<TicketTemplate | null>;
  onDirtyChange: (dirty: boolean) => void;
  error?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState(false);
  const collection = createListCollection({
    items: templates,
    itemToString: (item) => item.name,
    itemToValue: (item) => item.id,
  });
  const template = templates.find((item) => item.id === selected);
  return (
    <Stack gap="3">
      <Field.Root>
        <Select.Root
          collection={collection}
          value={[selected]}
          onValueChange={(event) => onSelect(event.value[0] ?? "bug-report")}
          disabled={disabled}
        >
          <Select.HiddenSelect />
          <Select.Label>Ticket template</Select.Label>
          <Select.Control>
            <Select.Trigger borderColor="fg.muted">
              <Select.ValueText placeholder="Choose a template" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner data-revisionlab-ui color="fg" colorPalette="blue">
              <Select.Content bg="bg.panel" color="fg" fontFamily="body">
                {templates.map((item) => (
                  <Select.Item item={item} key={item.id}>
                    <Select.ItemText>{item.name}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        <Field.HelperText>
          Choose the structure Codex will use for the ticket.
        </Field.HelperText>
      </Field.Root>
      <Flex gap="2" flexWrap="wrap">
        <Button
          size="xs"
          variant="ghost"
          aria-expanded={preview}
          disabled={!template}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Hide" : "Preview"} template
        </Button>
        {canAdd && (
          <Button
            size="xs"
            variant="outline"
            disabled={disabled}
            onClick={() => setAdding(true)}
          >
            Add template
          </Button>
        )}
      </Flex>
      {error && (
        <Text role="alert" color="orange.fg" fontSize="sm">
          {error}
        </Text>
      )}
      {preview && template && (
        <Field.Root>
          <Field.Label>Selected template Markdown</Field.Label>
          <Textarea
            readOnly
            rows={8}
            value={template.markdown}
            borderColor="fg.muted"
          />
        </Field.Root>
      )}
      <AddTemplateDialog
        open={adding}
        onClose={() => setAdding(false)}
        onDirtyChange={onDirtyChange}
        onAdd={async (name, markdown) => {
          const added = await onAdd(name, markdown);
          if (added) onSelect(added.id);
          return added;
        }}
      />
    </Stack>
  );
}
