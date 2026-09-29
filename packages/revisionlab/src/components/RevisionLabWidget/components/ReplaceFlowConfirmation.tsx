import { useEffect, useRef, useState } from "react";
import {
  Button,
  createListCollection,
  Field,
  Heading,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { FlowNameConflict } from "../../../client/flow-name-conflicts.js";

export function ReplaceFlowConfirmation({
  name,
  conflicts,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  conflicts: FlowNameConflict[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  const [id, setId] = useState(conflicts[0].id);
  const cancel = useRef<HTMLButtonElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cancel.current?.focus();
  }, []);
  const selected = conflicts.find((flow) => flow.id === id);
  const collection = createListCollection({
    items: conflicts.map((flow) => ({
      value: flow.id,
      label: `v${flow.version} - ${flow.persona} - ${flow.route} (${flow.id.slice(0, 8)})`,
    })),
  });
  return (
    <Stack gap="4" ref={portal}>
      <Heading as="h3" size="sm">
        Replace existing flow?
      </Heading>
      <Text fontSize="sm" overflowWrap="anywhere">
        A flow named &quot;{name}&quot; already exists. Replace it with a new recording?
        Previous versions and comments will be kept.
      </Text>
      {conflicts.length > 1 ? (
        <Field.Root>
          <Field.Label>Existing flow</Field.Label>
          <Select.Root
            collection={collection}
            value={[id]}
            onValueChange={(event) => setId(event.value[0])}
            disabled={busy}
            positioning={{ strategy: "fixed" }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal container={portal}>
              <Select.Positioner data-revisionlab-ui>
                <Select.Content>
                  {collection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Select.ItemText overflowWrap="anywhere">
                        {item.label}
                      </Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Field.Root>
      ) : (
        <Text fontSize="sm" color="gray.600" overflowWrap="anywhere">
          Version {selected?.version} - {selected?.persona} - {selected?.route}
        </Text>
      )}
      {selected && !selected.canReplace && (
        <Text role="status" fontSize="sm" color="gray.700">
          This flow has an unfinished recording. Finish or discard it before
          replacing.
        </Text>
      )}
      <Stack direction={{ base: "column", sm: "row" }} gap="2">
        <Button
          ref={cancel}
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          colorPalette="blue"
          loading={busy}
          disabled={busy || !selected?.canReplace}
          onClick={() => onConfirm(id)}
        >
          Replace and record
        </Button>
      </Stack>
    </Stack>
  );
}
