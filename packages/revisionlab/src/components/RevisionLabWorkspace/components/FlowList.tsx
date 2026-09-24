import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { GitBranch } from "lucide-react";
import { useState } from "react";
import type { RevisionLabFlow } from "../../../server/types.js";

export function FlowList({
  flows,
  selected,
  onSelect,
}: {
  flows: RevisionLabFlow[];
  selected?: RevisionLabFlow;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const latest = new Map<string, RevisionLabFlow>();
  for (const flow of flows) {
    const existing = latest.get(flow.familyId);
    if (!existing || existing.version < flow.version)
      latest.set(flow.familyId, flow);
  }
  const filtered = [...latest.values()].filter((flow) =>
    `${flow.name} ${flow.persona}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box
      as="section"
      aria-label="Recorded flows"
      w="full"
      flexShrink="0"
      bg="white"
      borderColor="gray.200"
    >
      <Stack gap="4" p="5">
        <Heading as="h2" size="md">
          Your flows
        </Heading>
        <Field.Root>
          <Field.Label srOnly>Find a flow or persona</Field.Label>
          <Input
            placeholder="Find a flow or persona…"
            size="sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field.Root>
      </Stack>
      <Stack gap="1" p="2">
        {filtered.map((flow) => (
          <Button
            key={flow.id}
            variant="ghost"
            h="auto"
            py="4"
            px="3"
            alignItems="start"
            textAlign="left"
            whiteSpace="normal"
            justifyContent="start"
            bg={
              selected?.familyId === flow.familyId ? "blue.50" : "transparent"
            }
            color="gray.900"
            onClick={() => onSelect(flow.id)}
            aria-pressed={selected?.familyId === flow.familyId}
          >
            <Icon
              color={
                selected?.familyId === flow.familyId ? "blue.700" : "gray.500"
              }
              mt="1"
              flexShrink="0"
            >
              <GitBranch />
            </Icon>
            <Box minW="0">
              <Text fontWeight="semibold" overflowWrap="anywhere">
                {flow.name}
              </Text>
              <Text
                fontSize="xs"
                color="gray.600"
                mt="1"
                overflowWrap="anywhere"
              >
                {flow.persona}
              </Text>
              <Flex gap="2" mt="2">
                <Badge colorPalette="gray">v{flow.version}</Badge>
                <Text fontSize="xs" color="gray.600">
                  {flow.steps.length}{" "}
                  {flow.steps.length === 1 ? "screen" : "screens"}
                  {flow.status === "recording" ? " · Recording" : ""}
                </Text>
              </Flex>
            </Box>
          </Button>
        ))}
        {filtered.length === 0 && (
          <Text color="gray.600" p="3">
            {flows.length
              ? "No flows match your search."
              : "Your first recording will appear here."}
          </Text>
        )}
      </Stack>
    </Box>
  );
}
