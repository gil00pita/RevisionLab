import type { ReactNode } from "react";
import { Badge, HStack, Stack, Table, Text } from "@chakra-ui/react";
import type { RevisionLabPersona } from "../../../server/types.js";
import { PersonaAvatar } from "../../PersonaAvatar/index.js";

export function PersonaTable({
  personas,
  actions,
}: {
  personas: RevisionLabPersona[];
  actions?: (persona: RevisionLabPersona) => ReactNode;
}) {
  return (
    <Table.ScrollArea maxW="full">
      <Table.Root size="sm">
        <Table.Caption>Saved personas</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Persona</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Research</Table.ColumnHeader>
            {actions && (
              <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {personas.map((persona) => (
            <Table.Row key={persona.id}>
              <Table.Cell minW="48">
                <HStack gap="3">
                  <PersonaAvatar name={persona.name} avatar={persona.avatar} />
                  <Stack gap="1">
                    <Text fontWeight="medium" overflowWrap="anywhere">
                      {persona.name}
                    </Text>
                    {persona.archivedAt && (
                      <Badge alignSelf="start">Archived</Badge>
                    )}
                    {persona.hasCredentials && (
                      <Badge colorPalette="blue" alignSelf="start">
                        Test account configured
                      </Badge>
                    )}
                  </Stack>
                </HStack>
              </Table.Cell>
              <Table.Cell
                minW="40"
                maxW="80"
                whiteSpace="normal"
                overflowWrap="anywhere"
                color="fg.muted"
              >
                {persona.description || "—"}
              </Table.Cell>
              <Table.Cell minW="36"><Stack gap="1"><Badge alignSelf="start" colorPalette={persona.researchStatus === "Research-Backed" ? "green" : "orange"}>{persona.researchStatus ?? "Assumption-Based"}</Badge><Text fontSize="xs" color="fg.muted">{persona.personaType ?? "Primary"} · {persona.confidenceLevel ?? "Not Assessed"}</Text></Stack></Table.Cell>
              {actions && <Table.Cell>{actions(persona)}</Table.Cell>}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
