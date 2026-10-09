import { Badge, Box, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { RevisionLabPersona } from "../../../../server/types.js";
export function PersonaResearchMetadata({
  persona,
  explain = false,
}: {
  persona: RevisionLabPersona;
  explain?: boolean;
}) {
  const status = persona.researchStatus ?? "Assumption-Based";
  return (
    <Stack gap="3" minW="0">
      <Box>
        <Text fontSize="xs" color="fg.muted" mb="1">
          Research status
        </Text>
        <Badge
          colorPalette={status === "Research-Backed" ? "green" : "gray"}
          whiteSpace="normal"
          overflowWrap="anywhere"
        >
          {status}
        </Badge>
      </Box>
      <SimpleGrid columns={2} gap="4">
        <Box minW="0">
          <Text fontSize="xs" color="fg.muted">
            Persona type
          </Text>
          <Text fontSize="sm" overflowWrap="anywhere">
            {persona.personaType ?? "Primary"}
          </Text>
        </Box>
        <Box minW="0">
          <Text fontSize="xs" color="fg.muted">
            Confidence
          </Text>
          <Text fontSize="sm" overflowWrap="anywhere">
            {persona.confidenceLevel ?? "Not Assessed"}
          </Text>
        </Box>
      </SimpleGrid>
      {explain && (
        <Text fontSize="sm" color="fg.muted">
          {status === "Assumption-Based"
            ? "This persona reflects working assumptions. Add research evidence to test and refine them."
            : "Research status records validation progress. Review the supporting evidence before relying on this persona."}{" "}
          Type describes its role; confidence is assessed separately and never
          inferred from evidence counts.
        </Text>
      )}
    </Stack>
  );
}
