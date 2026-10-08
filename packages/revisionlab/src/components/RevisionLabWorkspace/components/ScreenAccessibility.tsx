import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { wcagLabel } from "../../../wcag-settings.js";
import { Badge, Heading, Link, List, Stack, Text } from "@chakra-ui/react";
import type { AccessibilityReport } from "../../../accessibility.js";
import { AccessibilityStatus } from "../../AccessibilityStatus/index.js";
import { formatUtcTimestamp } from "../../../client/date-format.js";
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
        <IllustratedEmptyState illustration="documents" size="sm" description="No accessibility report was saved for this screen." />
      ) : report.status === "unavailable" ? (
        <IllustratedEmptyState
          illustration={report.reason === "changed" || report.reason === "not-scanned" ? "documents" : "error"}
          size="sm"
          description={report.reason === "changed"
            ? "The page changed during the check. No matching results were saved."
            : report.reason === "not-scanned"
              ? "No completed check matched this pre-interaction screen."
              : "The accessibility check failed or timed out. The screen was saved without results."}
        />
      ) : (
        <>
          <Text fontSize="xs" color="fg.muted">
            {report.checkedAt && formatUtcTimestamp(report.checkedAt)} · axe{" "}
            {report.engineVersion}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {report.standard ? wcagLabel(report.standard) : "Legacy WCAG A/AA"}{" "}
            automated checks are not a compliance certification.
          </Text>
          {report.status === "passed" && report.violationCount === 0 && report.incomplete === 0 && (
            <IllustratedEmptyState illustration="done" size="sm" description="No issues were found by this automated check." />
          )}
          {report.incomplete > 0 && (
            <Text fontSize="sm" color="orange.fg">
              {report.incomplete}{" "}
              {report.incomplete === 1 ? "check needs" : "checks need"} manual
              review.
            </Text>
          )}
          {report.truncated && (
            <Text fontSize="sm" color="fg.muted">
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
                borderColor="border"
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
                <Text fontSize="xs" color="fg.muted">
                  {issue.id} · {issue.count} affected{" "}
                  {issue.count === 1 ? "element" : "elements"}
                </Text>
                <List.Root ps="4" gap="2">
                  {issue.targets.map((target) => (
                    <List.Item
                      key={target}
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
                  color="blue.fg"
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
