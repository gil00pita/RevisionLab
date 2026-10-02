import { Badge, Heading, Link, List, Stack, Text } from "@chakra-ui/react";
import type { AccessibilityReport } from "../../../accessibility.js";
import { AccessibilityStatus } from "../../AccessibilityStatus/index.js";
import { ReviewItemActions } from "../../ReviewAutomation/index.js";

export function ScreenAccessibility({
  report,
}: {
  report?: AccessibilityReport;
}) {
  return (
    <Stack gap="4" aria-label="Saved accessibility report">
      <Heading as="h3" size="md">
        Accessibility
      </Heading>
      <AccessibilityStatus report={report} />
      {!report ? (
        <Text fontSize="sm" color="gray.600">
          No accessibility report was saved for this screen.
        </Text>
      ) : report.status === "unavailable" ? (
        <Text fontSize="sm" color="gray.600">
          {report.reason === "changed"
            ? "The page changed during the check. No matching results were saved."
            : report.reason === "not-scanned"
              ? "No completed check matched this pre-interaction screen."
              : "The accessibility check failed or timed out. The screen was saved without results."}
        </Text>
      ) : (
        <>
          <Text fontSize="xs" color="gray.600">
            {report.checkedAt && new Date(report.checkedAt).toLocaleString()} ·
            axe {report.engineVersion}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Automated WCAG A/AA checks are not a compliance certification.
          </Text>
          {report.incomplete > 0 && (
            <Text fontSize="sm" color="orange.800">
              {report.incomplete}{" "}
              {report.incomplete === 1 ? "check needs" : "checks need"} manual
              review.
            </Text>
          )}
          {report.truncated && (
            <Text fontSize="sm" color="gray.600">
              Showing a limited set of rules or affected elements. Total
              detected rules: {report.violationCount}.
            </Text>
          )}
          <Stack gap="4">
            {report.issues.map((issue) => (
              <Stack
                key={issue.id}
                gap="2"
                borderTopWidth="1px"
                borderColor="gray.200"
                pt="4"
              >
                <Heading as="h4" size="sm" overflowWrap="anywhere">
                  {issue.help}
                </Heading>
                <Badge
                  alignSelf="start"
                  colorPalette={
                    issue.impact === "critical" || issue.impact === "serious"
                      ? "red"
                      : "orange"
                  }
                >
                  {issue.impact ?? "Unspecified severity"}
                </Badge>
                <Text fontSize="xs" color="gray.600">
                  {issue.id} · {issue.count} affected{" "}
                  {issue.count === 1 ? "element" : "elements"}
                </Text>
                <List.Root ps="4" gap="2">
                  {issue.targets.map((target, index) => (
                    <List.Item
                      key={index}
                      fontFamily="mono"
                      fontSize="xs"
                      overflowWrap="anywhere"
                    >
                      {target}
                    </List.Item>
                  ))}
                </List.Root>
                <Link
                  href={issue.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize="sm"
                  color="blue.700"
                >
                  Read more
                </Link>
                <ReviewItemActions
                  target={{ kind: "accessibility", issueId: issue.id }}
                />
              </Stack>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
