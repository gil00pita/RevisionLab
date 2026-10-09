import type { ReactNode } from "react";
import { Badge, HStack, Stack, Table, Text } from "@chakra-ui/react";
import type { RevisionLabPersona } from "../../../server/types.js";
import { PersonaAvatar } from "../../PersonaAvatar/index.js";
import { PersonaResearchMetadata } from "./personas/PersonaResearchMetadata.js";

export function PersonaTable({
  personas,
  actions,
  layout = "workspace",
}: {
  personas: RevisionLabPersona[];
  actions?: (persona: RevisionLabPersona) => ReactNode;
  layout?: "workspace" | "wizard";
}) {
  const wizard = layout === "wizard";
  return (
    <Table.ScrollArea maxW="full" minW="0">
      <Table.Root size="sm" tableLayout="fixed" whiteSpace="normal" w="full">
        <Table.Caption srOnly={!wizard}>
          {wizard ? "Saved personas" : "Persona list"}
        </Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Persona</Table.ColumnHeader>
            <Table.ColumnHeader hideBelow="md" w={wizard ? "40" : "60"}>
              Research
            </Table.ColumnHeader>
            {actions && (
              <Table.ColumnHeader textAlign="end" w="40" hideBelow="md">
                Actions
              </Table.ColumnHeader>
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {personas.map((persona) => (
            <Table.Row key={persona.id}>
              <Table.Cell minW="0" verticalAlign="top">
                <HStack gap="3" align="start" minW="0">
                  <PersonaAvatar name={persona.name} avatar={persona.avatar} />
                  <Stack gap="1" minW="0">
                    <Text fontWeight="medium" overflowWrap="anywhere">
                      {persona.name}
                    </Text>
                    <Text
                      color="fg.muted"
                      whiteSpace="normal"
                      overflowWrap="anywhere"
                    >
                      {persona.description || "—"}
                    </Text>
                    <PersonaResearchSummary persona={persona} hideFrom="md" />
                    {persona.archivedAt && (
                      <Badge
                        alignSelf="start"
                        whiteSpace="normal"
                        overflowWrap="anywhere"
                      >
                        Archived
                      </Badge>
                    )}
                    {persona.hasCredentials && (
                      <Badge
                        colorPalette="blue"
                        alignSelf="start"
                        whiteSpace="normal"
                        overflowWrap="anywhere"
                      >
                        Test account configured
                      </Badge>
                    )}
                  </Stack>
                </HStack>
                {actions && (
                  <Stack hideFrom="md" mt="3" minW="0">
                    {actions(persona)}
                  </Stack>
                )}
              </Table.Cell>

              <Table.Cell minW="0" hideBelow="md" verticalAlign="top">
                <PersonaResearchSummary persona={persona} />
              </Table.Cell>
              {actions && (
                <Table.Cell verticalAlign="top" hideBelow="md">
                  {actions(persona)}
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

function PersonaResearchSummary({
  persona,
  hideFrom,
}: {
  persona: RevisionLabPersona;
  hideFrom?: "md";
}) {
  return (
    <Stack hideFrom={hideFrom} minW="0">
      <PersonaResearchMetadata persona={persona} />
    </Stack>
  );
}
