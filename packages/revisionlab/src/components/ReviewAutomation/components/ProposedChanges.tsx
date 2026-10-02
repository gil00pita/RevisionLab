import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { ProposedChange } from "../../../review-automation.js";

export function ProposedChanges({ changes }: { changes: ProposedChange[] }) {
  return changes.map((change) => (
    <Stack key={change.file} gap="2" minW="0">
      <Heading as="h3" size="sm" overflowWrap="anywhere">
        {change.file}
      </Heading>
      <Text fontSize="xs" fontWeight="bold">
        Before
      </Text>
      <Box
        as="pre"
        p="3"
        bg="red.50"
        color="red.900"
        fontSize="xs"
        whiteSpace="pre-wrap"
        overflowWrap="anywhere"
        maxH="64"
        overflowY="auto"
      >
        {change.before}
      </Box>
      <Text fontSize="xs" fontWeight="bold">
        After
      </Text>
      <Box
        as="pre"
        p="3"
        bg="green.50"
        color="green.900"
        fontSize="xs"
        whiteSpace="pre-wrap"
        overflowWrap="anywhere"
        maxH="64"
        overflowY="auto"
      >
        {change.after}
      </Box>
    </Stack>
  ));
}
