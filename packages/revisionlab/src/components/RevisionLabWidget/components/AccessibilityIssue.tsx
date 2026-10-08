import { Box, Button, Icon, Link, Stack, Text } from "@chakra-ui/react";
import { ExternalLink } from "lucide-react";
import {
  inspectableElement,
  type AccessibilityTarget,
} from "../accessibility-targets.js";
import type { AccessibilityFinding } from "../hooks/usePageAccessibility.js";

export function AccessibilityRuleLink({
  issue,
}: {
  issue: AccessibilityFinding;
}) {
  return (
    <Link
      href={issue.helpUrl}
      target="_blank"
      rel="noopener noreferrer"
      color="blue.fg"
      fontSize="xs"
      aria-label={`Read more about ${issue.help}`}
    >
      Read more{" "}
      <Icon boxSize="3">
        <ExternalLink />
      </Icon>
    </Link>
  );
}

export function AccessibilityIssue({
  issue,
  current,
  onSelect,
}: {
  issue: AccessibilityFinding;
  current: boolean;
  onSelect: (target: AccessibilityTarget) => void;
}) {
  const first = issue.targets.findIndex((_, index) =>
    inspectableElement({ issue, index }),
  );
  return (
    <Stack
      borderTopWidth="1px"
      borderColor="border"
      pt="3"
      gap="1"
      align="start"
    >
      <Button
        variant="plain"
        size="sm"
        h="auto"
        whiteSpace="normal"
        textAlign="left"
        justifyContent="start"
        color="blue.fg"
        onClick={() => onSelect({ issue, index: first })}
        disabled={!current || first < 0}
      >
        {issue.help}
      </Button>
      <Text fontSize="xs" color="fg.muted">
        {issue.count} affected {issue.count === 1 ? "element" : "elements"}
      </Text>
      {issue.targets.map((target, index) => {
        const available =
          current && Boolean(inspectableElement({ issue, index }));
        return (
          <Box key={target.label} maxW="full">
            <Button
              variant="plain"
              size="xs"
              h="auto"
              whiteSpace="normal"
              textAlign="left"
              fontFamily="mono"
              overflowWrap="anywhere"
              color="fg.muted"
              onClick={() => onSelect({ issue, index })}
              disabled={!available}
              aria-label={`Highlight ${target.label}`}
            >
              {target.label}
            </Button>
            {!available && (
              <Text fontSize="xs" color="fg.muted">
                {current ? "Element unavailable" : "Awaiting a fresh check"}
              </Text>
            )}
          </Box>
        );
      })}
      <AccessibilityRuleLink issue={issue} />
    </Stack>
  );
}
