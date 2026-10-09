import { wcagLabel } from "../../../wcag-settings.js";
import { Stack, Text } from "@chakra-ui/react";
import type { AccessibilityReport } from "../../../accessibility.js";
import { AccessibilityStatus } from "../../AccessibilityStatus/index.js";
import { formatUtcTimestamp } from "../../../client/date-format.js";

export function ScreenAccessibility({ report }: { report?: AccessibilityReport; }) {
  return (
    <Stack gap="2" aria-label="Saved accessibility report" fontSize="xs" color="fg.muted" align="start">
      <AccessibilityStatus report={report} />
      {!report ? (
        <Text>No accessibility report was saved for this screen.</Text>
      ) : report.status === "unavailable" ? (
        <Text>{report.reason === "changed"
          ? "The page changed during the check. No matching results were saved."
          : report.reason === "not-scanned"
            ? "No completed check matched this pre-interaction screen."
            : "The accessibility check failed or timed out. The screen was saved without results."}</Text>
      ) : (
        <>
          <Text>{report.checkedAt && formatUtcTimestamp(report.checkedAt)} · axe {report.engineVersion} · {report.standard ? wcagLabel(report.standard) : "Legacy WCAG A/AA"}</Text>
          <Text>Automated checks are not a compliance certification.</Text>
          {report.incomplete > 0 && <Text color="orange.fg">{report.incomplete} {report.incomplete === 1 ? "check needs" : "checks need"} manual review.</Text>}
          {report.truncated && <Text>Showing a limited set of rules or affected elements. Total detected rules: {report.violationCount}.</Text>}
        </>
      )}
    </Stack>
  );
}
