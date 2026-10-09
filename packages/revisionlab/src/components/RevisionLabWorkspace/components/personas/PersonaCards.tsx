import type { ReactNode } from "react";
import {
  Badge,
  Card,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PersonaAvatar } from "../../../PersonaAvatar/index.js";
import type { RevisionLabPersona } from "../../../../server/types.js";
import { PersonaResearchMetadata } from "./PersonaResearchMetadata.js";

export function PersonaCards({
  personas,
  actions,
}: {
  personas: RevisionLabPersona[];
  actions: (persona: RevisionLabPersona) => ReactNode;
}) {
  return (
    <SimpleGrid
      columns={{ base: 1, md: 2, xl: 3 }}
      gap="5"
      alignItems="stretch"
    >
      {personas.map((persona) => (
        <Card.Root
          as="article"
          aria-label={persona.name}
          key={persona.id}
          bg="bg.panel"
          borderColor="border"
          rounded="xl"
          minW="0"
          overflow="hidden"
        >
          <Card.Header p="5">
            <Flex gap="3" align="start" minW="0">
              <PersonaAvatar
                name={persona.name}
                avatar={persona.avatar}
                size="lg"
              />
              <Stack gap="1" minW="0">
                <Heading as="h2" size="md" overflowWrap="anywhere">
                  {persona.name}
                </Heading>
                {persona.archivedAt && (
                  <Badge alignSelf="start">Archived</Badge>
                )}
                {persona.hasCredentials && (
                  <Text fontSize="xs" color="fg.muted">
                    Test account configured
                  </Text>
                )}
              </Stack>
            </Flex>
          </Card.Header>
          <Card.Body px="5" pt="0" pb="5" gap="5">
            <Text
              fontSize="sm"
              color="fg.muted"
              lineClamp={3}
              minH="16"
              overflowWrap="anywhere"
            >
              {persona.description ||
                "Add a behavioural summary in the profile to describe this persona’s needs and context."}
            </Text>
            <PersonaResearchMetadata persona={persona} />
          </Card.Body>
          <Card.Footer
            px="5"
            py="4"
            borderTopWidth="1px"
            borderColor="border"
            justifyContent="space-between"
          >
            {actions(persona)}
          </Card.Footer>
        </Card.Root>
      ))}
    </SimpleGrid>
  );
}
