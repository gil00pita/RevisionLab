import { useEffect, useRef } from "react";
import {
  Badge,
  Button,
  CloseButton,
  Icon,
  Popover,
  Stack,
  Text,
  usePopoverContext,
} from "@chakra-ui/react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useAccessibilityInspection } from "../hooks/useAccessibilityInspection.js";
import type { PageAccessibility } from "../hooks/usePageAccessibility.js";
import { AccessibilityMarkers } from "./AccessibilityMarkers.js";
import {
  AccessibilityIssue,
  AccessibilityRuleLink,
} from "./AccessibilityIssue.js";

export function AccessibilityResults({
  result,
  label,
  onRerun,
  disabled,
  onPlacementChange,
}: {
  result: PageAccessibility;
  label: string;
  onRerun: () => void;
  disabled: boolean;
  onPlacementChange: (top: boolean) => void;
}) {
  const inspection = useAccessibilityInspection(
    result.status === "issues" ? result.issues : [],
  );
  const { reposition } = usePopoverContext();
  const title = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const active = inspection.active;
  useEffect(() => {
    if (active) title.current?.focus({ preventScroll: true });
  }, [active]);
  // Keep the compact detail panel away from targets near the page bottom.
  const topPanel = Boolean(
    active &&
    inspection.highlight &&
    inspection.highlight.y + inspection.highlight.height >
      window.innerHeight / 2,
  );
  useEffect(() => {
    onPlacementChange(topPanel);
    reposition({
      placement: topPanel ? "bottom-end" : "top",
      getAnchorRect: topPanel
        ? () => ({ x: window.innerWidth - 16, y: 8, width: 0, height: 0 })
        : undefined,
    });
  }, [topPanel, onPlacementChange, reposition]);
  return (
    <>
      <AccessibilityMarkers inspection={inspection} />
      <Popover.Positioner data-revisionlab-ui>
        <Popover.Content
          ref={panel}
          aria-label="Accessibility"
          w="sm"
          maxW="calc(100vw - 2rem)"
          bg="white"
          color="gray.900"
          borderRadius="lg"
        >
          {!topPanel && <Popover.Arrow />}
          <Popover.Header pr="10">
            <Popover.Title>Accessibility</Popover.Title>
          </Popover.Header>
          <Popover.Body>
            {active ? (
              <Stack gap="2" maxH="30dvh" overflowY="auto" align="start">
                <Button
                  size="xs"
                  variant="plain"
                  onClick={() => {
                    panel.current?.focus({ preventScroll: true });
                    inspection.clear();
                  }}
                >
                  <Icon>
                    <ArrowLeft />
                  </Icon>
                  All issues
                </Button>
                <Button
                  ref={title}
                  variant="plain"
                  h="auto"
                  whiteSpace="normal"
                  textAlign="left"
                  color="red.700"
                  onClick={() => inspection.select(active)}
                >
                  {active.issue.help}
                </Button>
                <Text fontFamily="mono" fontSize="xs" overflowWrap="anywhere">
                  {active.issue.targets[active.index].label}
                </Text>
                <AccessibilityRuleLink issue={active.issue} />
              </Stack>
            ) : (
              <Stack gap="3" maxH="min(60dvh, 480px)" overflowY="auto">
                <Text role="status" fontWeight="semibold">
                  {label.replace("Accessibility: ", "")}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Automated WCAG A/AA checks only. Manual testing is still
                  required.
                </Text>
                {result.checkedAt && (
                  <Text fontSize="xs" color="gray.600">
                    Checked {new Date(result.checkedAt).toLocaleTimeString()}
                  </Text>
                )}
                {result.error && (
                  <Text role="alert" color="red.700">
                    {result.error}
                  </Text>
                )}
                {result.incomplete > 0 && (
                  <Badge alignSelf="start" colorPalette="orange">
                    {result.incomplete} checks need manual review
                  </Badge>
                )}
                {result.issues.map((issue) => (
                  <AccessibilityIssue
                    key={issue.id}
                    issue={issue}
                    current={result.status === "issues"}
                    onSelect={inspection.select}
                  />
                ))}
              </Stack>
            )}
          </Popover.Body>
          {!active && (
            <Popover.Footer>
              <Button
                size="sm"
                variant="outline"
                onClick={onRerun}
                disabled={disabled || result.status === "checking"}
              >
                <Icon>
                  <RefreshCw />
                </Icon>
                Run again
              </Button>
            </Popover.Footer>
          )}
          <Popover.CloseTrigger asChild>
            <CloseButton
              position="absolute"
              top="1"
              right="1"
              size="sm"
              aria-label="Close accessibility results"
            />
          </Popover.CloseTrigger>
        </Popover.Content>
      </Popover.Positioner>
    </>
  );
}
