import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  Text,
} from "@chakra-ui/react";
import { GitBranch } from "lucide-react";
import type { RevisionLabFlow } from "../../../server/types.js";

export function FlowListItem({
  flow,
  current,
  checked,
  selecting,
  active,
  disabled,
  onCheck,
  onSelect,
}: {
  flow: RevisionLabFlow;
  current: boolean;
  checked: boolean;
  selecting: boolean;
  active: boolean;
  disabled: boolean;
  onCheck: (checked: boolean) => void;
  onSelect: () => void;
}) {
  return (
    <Flex
      align="start"
      gap="1"
      borderRadius="md"
      bg={current ? "blue.50" : "transparent"}
      px="2"
    >
      {selecting && (
        <Checkbox.Root
          size="sm"
          colorPalette="blue"
          mt="1"
          p="2"
          minH="10"
          flexShrink="0"
          checked={checked}
          disabled={disabled || active || flow.workspace?.role === "commenter"}
          onCheckedChange={(event) => onCheck(event.checked === true)}
        >
          <Checkbox.HiddenInput aria-label={`Select ${flow.name}`} />
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Root>
      )}
      <Button
        variant="ghost"
        flex="1"
        minW="0"
        h="auto"
        py="3"
        px="2"
        alignItems="start"
        textAlign="left"
        whiteSpace="normal"
        justifyContent="start"
        color="gray.900"
        disabled={disabled}
        onClick={onSelect}
        aria-pressed={current}
      >
        {!selecting && (
          <Icon mt="1" flexShrink="0" color={current ? "blue.700" : "gray.500"}>
            <GitBranch />
          </Icon>
        )}
        <Box minW="0">
          <Text fontWeight="semibold" overflowWrap="anywhere">
            {flow.name}
          </Text>
          {flow.workspace && (
            <Badge
              mt="1"
              colorPalette="blue"
              maxW="full"
              whiteSpace="normal"
              overflowWrap="anywhere"
            >
              {flow.workspace.name}
            </Badge>
          )}
          <Text fontSize="xs" color="gray.600" mt="1" overflowWrap="anywhere">
            {flow.persona}
          </Text>
          <Flex gap="2" mt="2" flexWrap="wrap">
            <Badge colorPalette="gray">v{flow.version}</Badge>
            <Text fontSize="xs" color="gray.600">
              {flow.steps.length}{" "}
              {flow.steps.length === 1 ? "screen" : "screens"}
            </Text>
            {active && <Badge colorPalette="orange">Recording</Badge>}
          </Flex>
        </Box>
      </Button>
    </Flex>
  );
}
