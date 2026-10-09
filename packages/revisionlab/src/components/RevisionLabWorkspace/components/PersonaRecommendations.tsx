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
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import {
  personaTemplates,
  type PersonaTemplate,
} from "../persona-recommendations.js";

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
  async function add(persona: PersonaTemplate) {
    if (pending.current) return;
    pending.current = true;
    setBusy(persona.name);
    onBusyChange(true);
    setError("");
    try {
      await apiRequest(apiPath, "personas", {
        method: "POST",
        body: JSON.stringify({ name: persona.name, description: persona.description, avatar: persona.avatar, templateId: persona.id }),
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
              <Table.ScrollArea maxW="full" minW="0">
                <Table.Root size="sm" tableLayout="fixed" whiteSpace="normal" w="full">
                  <Table.Caption>Optional recommended personas</Table.Caption>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Persona</Table.ColumnHeader>
                      <Table.ColumnHeader w="24" hideBelow="md">
                        Add
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {personaTemplates.map((persona) => {
                      const exists =
                        added.includes(persona.name) ||
                        personas.some(
                          (saved) =>
                            saved.name.toLowerCase() ===
                            persona.name.toLowerCase(),
                        );
                      const addButton = (
                        <Button
                          size="sm"
                          variant="outline"
                          maxW="full"
                          whiteSpace="normal"
                          h="auto"
                          py="2"
                          aria-label={`${exists ? "Added" : "Add"} ${persona.name}`}
                          disabled={Boolean(busy) || exists}
                          loading={busy === persona.name}
                          onClick={() => void add(persona)}
                        >
                          {exists ? "Added" : "Add"}
                        </Button>
                      );
                      return (
                        <Table.Row key={persona.name}>
                          <Table.Cell minW="0" verticalAlign="top">
                            <HStack gap="3" align="start" minW="0">
                              <PersonaAvatar
                                name={persona.name}
                                avatar={persona.avatar}
                              />
                              <Stack gap="1" minW="0">
                                <Text fontWeight="medium" overflowWrap="anywhere">
                                  {persona.name}
                                </Text>
                                <Text color="fg.muted" whiteSpace="normal" overflowWrap="anywhere">
                                  {persona.description}
                                </Text>
                              </Stack>
                            </HStack>
                            <Stack hideFrom="md" align="start" mt="3" minW="0">
                              {addButton}
                            </Stack>
                          </Table.Cell>
                          <Table.Cell verticalAlign="top" hideBelow="md">
                            {addButton}
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
