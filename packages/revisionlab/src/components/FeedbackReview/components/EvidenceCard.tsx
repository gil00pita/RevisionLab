import { EvidenceScreenshot } from "./EvidencePreviewProvider.js";
import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { EvidenceGroup } from "../../../feedback-review.js";
import { EvidenceSources } from "./EvidenceSources.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { FeedbackPersonaLink } from "./FeedbackPersonaLink.js";

export function EvidenceCard({
  group,
  checked,
  disabled,
  drafted,
  basePath,
  apiPath,
  personas,
  onCheck,
  selectedIds,
  onSourceCheck,
}: {
  group: EvidenceGroup;
  checked: boolean | "indeterminate";
  disabled: boolean;
  drafted: number;
  basePath: string;
  apiPath: string;
  personas: RevisionLabPersona[];
  onCheck: (checked: boolean) => void;
  selectedIds: Set<string>;
  onSourceCheck: (id: string, checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const previews = group.evidence
    .filter(
      (item, index, items) =>
        item.screenshot &&
        items.findIndex((source) => source.screenshot === item.screenshot) ===
          index,
    )
    .slice(0, 3);
  const label =
    group.kind === "comment"
      ? "Comment"
      : group.kind === "test"
        ? "Test session"
        : "Accessibility";
  return (
    <Stack
      as="article"
      gap="3"
      p="4"
      borderWidth="1px"
      rounded="lg"
      borderColor={checked ? "blue.border" : "border.emphasized"}
      bg={checked ? "blue.subtle" : "bg.panel"}
    >
      <Flex gap="2" flexWrap="wrap" align="center">
        <Badge colorPalette={group.kind === "test" ? "purple" : "gray"}>
          {label}
        </Badge>
        <Badge colorPalette="blue">
          {group.evidence.length} occurrence
          {group.evidence.length === 1 ? "" : "s"}
        </Badge>
        {drafted > 0 && (
          <Badge colorPalette="green">{drafted} already drafted</Badge>
        )}
      </Flex>
      <Checkbox.Root
        checked={checked}
        disabled={disabled}
        colorPalette="blue"
        alignItems="flex-start"
        onCheckedChange={(event) => onCheck(event.checked === true)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control
          mt="1"
          borderColor={checked ? "blue.border" : "fg.muted"}
        >
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label fontWeight="medium" overflowWrap="anywhere">
          {group.title}
        </Checkbox.Label>
      </Checkbox.Root>
      <Text fontSize="sm" color="fg.muted" overflowWrap="anywhere">
        {[...new Set(group.evidence.map((item) => item.route))].join(" · ")}
      </Text>
      <Flex gap="3" flexWrap="wrap">
        {(previews.length ? previews : [group.evidence[0]]).map((item) => (
          <Box key={item.id} maxW="48" minW="0">
            <EvidenceScreenshot item={item} />
          </Box>
        ))}
      </Flex>
      <Button
        alignSelf="start"
        variant="plain"
        size="sm"
        color="blue.fg"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide" : "View"} source evidence
      </Button>
      {expanded && (
        <Box borderTopWidth="1px" borderColor="border.emphasized" pt="3">
          <EvidenceSources
            evidence={group.evidence}
            basePath={basePath}
            selection={{ ids: selectedIds, disabled, onCheck: onSourceCheck }}
          />
        </Box>
      )}
      {!disabled && personas.length > 0 && <FeedbackPersonaLink group={group} personas={personas} apiPath={apiPath} basePath={basePath} />}
    </Stack>
  );
}
