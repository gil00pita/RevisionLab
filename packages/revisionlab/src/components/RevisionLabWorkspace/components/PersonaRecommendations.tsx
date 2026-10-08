import { useRef, useState } from "react";
import {
  Accordion,
  Button,
  HStack,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { PersonaAvatar } from "../../PersonaAvatar/index.js";
import { personaAvatarIds } from "../../../persona-avatars.js";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { personaRecommendations } from "../persona-recommendations.js";

export function PersonaRecommendations({
  apiPath,
  personas,
  onRefresh,
  onBusyChange,
}: {
  apiPath: string;
  personas: RevisionLabPersona[];
  onRefresh: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState("");
  async function add(persona: (typeof personaRecommendations)[number]) {
    if (pending.current) return;
    pending.current = true;
    setBusy(persona.name);
    onBusyChange(true);
    setError("");
    try {
      await apiRequest(apiPath, "personas", {
        method: "POST",
        body: JSON.stringify({
          ...persona,
          avatar: personaAvatarIds[personaRecommendations.indexOf(persona)],
        }),
      });
      setAdded((previous) => [...previous, persona.name]);
      await onRefresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add this persona.",
      );
    } finally {
      pending.current = false;
      setBusy("");
      onBusyChange(false);
    }
  }
  return (
    <Stack gap="4">
      <Accordion.Root collapsible lazyMount unmountOnExit defaultValue={[]}>
        <Accordion.Item value="recommended">
          <Accordion.ItemTrigger>
            <Text flex="1">Recommended personas</Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody px="0">
              <Text color="fg.muted" mb="4">
                Add only the perspectives you want to review.
              </Text>
              {error && (
                <Text role="alert" color="red.fg">
                  {error}
                </Text>
              )}
              <Table.ScrollArea>
                <Table.Root size="sm">
                  <Table.Caption>Optional recommended personas</Table.Caption>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Persona</Table.ColumnHeader>
                      <Table.ColumnHeader>Description</Table.ColumnHeader>
                      <Table.ColumnHeader>Add</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {personaRecommendations.map((persona, index) => {
                      const exists =
                        added.includes(persona.name) ||
                        personas.some(
                          (saved) =>
                            saved.name.toLowerCase() ===
                            persona.name.toLowerCase(),
                        );
                      return (
                        <Table.Row key={persona.name}>
                          <Table.Cell minW="48">
                            <HStack gap="3">
                              <PersonaAvatar
                                name={persona.name}
                                avatar={personaAvatarIds[index]}
                              />
                              <Text fontWeight="medium">{persona.name}</Text>
                            </HStack>
                          </Table.Cell>
                          <Table.Cell minW="40" color="fg.muted">
                            {persona.description}
                          </Table.Cell>
                          <Table.Cell>
                            <Button
                              size="sm"
                              variant="outline"
                              flexShrink="0"
                              aria-label={`${exists ? "Added" : "Add"} ${persona.name}`}
                              disabled={Boolean(busy) || exists}
                              loading={busy === persona.name}
                              onClick={() => void add(persona)}
                            >
                              {exists ? "Added" : "Add"}
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Table.ScrollArea>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}
