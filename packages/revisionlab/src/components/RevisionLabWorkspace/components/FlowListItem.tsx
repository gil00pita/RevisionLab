import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  Text,
} from "@chakra-ui/react";
import { ContactRound, GitBranch, Monitor } from "lucide-react";
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
  const createdAt = new Date(flow.createdAt);
  const recordedAt = Number.isNaN(createdAt.getTime())
    ? "Date unavailable"
    : createdAt.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  return (
    <Flex
      align="start"
      gap="1"
      w="full"
      borderBottomWidth="1px"
      borderColor="border"
      bg={current ? "blue.subtle" : "transparent"}
      px={selecting ? "2" : "0"}
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
        borderRadius="0"
        minW="0"
        h="auto"
        py="3"
        px={selecting ? "2" : "4"}
        alignItems="start"
        textAlign="left"
        whiteSpace="normal"
        justifyContent="start"
        color="fg"
        _hover={{ bg: current ? "blue.subtle" : "blue.subtle" }}
        focusRing="inside"
        focusRingColor="blue.focusRing"
        disabled={disabled}
        onClick={onSelect}
        aria-pressed={current}
      >
        {!selecting && (
          <Icon asChild mt="1" flexShrink="0" color={current ? "blue.fg" : "fg.muted"}>
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
              bg="blue.subtle"
              color="blue.fg"
              maxW="full"
              whiteSpace="normal"
              overflowWrap="anywhere"
            >
              {flow.workspace.name}
            </Badge>
          )}
          <Flex align="center" gap="1" color="fg.muted" mt="1">
            <Icon asChild boxSize="3.5" flexShrink="0">
              <ContactRound />
            </Icon>
            <Text fontSize="xs" overflowWrap="anywhere">
              {flow.persona}
            </Text>
          </Flex>
          <Flex gap="2" mt="2" flexWrap="wrap" align="center">
            <Badge colorPalette="blue" bg="blue.subtle" color="blue.fg">
              v{flow.version}
            </Badge>
            <Text
              as="span"
              display="inline-flex"
              alignItems="center"
              gap="1"
              fontSize="xs"
              color="fg.muted"
              aria-label={`${flow.steps.length} ${flow.steps.length === 1 ? "screen" : "screens"}`}
            >
              {flow.steps.length}
              <Icon asChild boxSize="3.5">
                <Monitor />
              </Icon>
            </Text>
            {active && (
              <Badge colorPalette="blue" bg="blue.subtle" color="blue.fg">
                Recording
              </Badge>
            )}
          </Flex>
          <Text
            fontSize="xs"
            color="fg.muted"
            mt="2"
            title="Recording created"
            overflowWrap="anywhere"
          >
            {recordedAt}
          </Text>
        </Box>
      </Button>
    </Flex>
  );
}
