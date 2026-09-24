import { useRef, useState } from "react";
import {
  Box,
  Button,
  createListCollection,
  Field,
  Icon,
  Input,
  Link,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Circle, UsersRound } from "lucide-react";
import type { RevisionLabPersona } from "../../../server/types.js";
import type { useRecording } from "../hooks/useRecording.js";

export function RecordingSetup({
  recorder,
  personas,
  basePath,
}: {
  recorder: ReturnType<typeof useRecording>;
  personas: RevisionLabPersona[];
  basePath: string;
}) {
  const [name, setName] = useState("");
  const [personaId, setPersonaId] = useState("");
  const portal = useRef<HTMLDivElement>(null);
  const active = personas.filter((persona) => !persona.archivedAt);
  const selected = active.find((persona) => persona.id === personaId);
  const collection = createListCollection({
    items: active.map((persona) => ({
      value: persona.id,
      label: persona.name,
    })),
  });
  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected) void recorder.start(name.trim(), selected.id);
      }}
    >
      <Stack gap="4" ref={portal}>
        <Field.Root required disabled={recorder.busy}>
          <Field.Label>
            Recording name
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            placeholder="e.g. Submit an application"
            bg="white"
          />
        </Field.Root>
        <Field.Root
          required
          disabled={recorder.busy || active.length === 0}
          invalid={Boolean(personaId && !selected)}
        >
          <Field.Label>
            Persona
            <Field.RequiredIndicator />
          </Field.Label>
          <Select.Root
            collection={collection}
            value={selected ? [selected.id] : []}
            onValueChange={(event) => setPersonaId(event.value[0] ?? "")}
            disabled={recorder.busy || active.length === 0}
            positioning={{ strategy: "fixed", hideWhenDetached: true }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger minW="0">
                <Select.ValueText placeholder="Choose a persona" truncate />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal container={portal}>
              <Select.Positioner data-revisionlab-ui zIndex="popover">
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
          {selected?.description && (
            <Field.HelperText overflowWrap="anywhere">
              {selected.description}
            </Field.HelperText>
          )}
          <Field.ErrorText>
            This persona is no longer available. Choose another.
          </Field.ErrorText>
        </Field.Root>
        {active.length === 0 && (
          <Text color="gray.600" fontSize="sm">
            No active personas yet.
          </Text>
        )}
        <Link
          href={`${basePath}?view=personas`}
          target="_blank"
          rel="noopener noreferrer"
          color="blue.700"
          fontSize="sm"
          alignSelf="start"
        >
          <Icon>
            <UsersRound />
          </Icon>
          Manage personas
        </Link>
        <Button
          type="submit"
          colorPalette="blue"
          loading={recorder.busy}
          disabled={!name.trim() || !selected || recorder.busy}
        >
          <Icon>
            <Circle />
          </Icon>
          Start recording
        </Button>
      </Stack>
    </Box>
  );
}
