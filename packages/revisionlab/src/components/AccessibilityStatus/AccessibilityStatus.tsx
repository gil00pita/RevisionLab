import { Badge, Icon } from "@chakra-ui/react";
import { Accessibility, CircleCheck, CircleHelp } from "lucide-react";
import {
  accessibilityLabel,
  type AccessibilityReport,
} from "../../accessibility.js";

export function AccessibilityStatus({
  report,
  compact = false,
}: {
  report?: AccessibilityReport | null;
  compact?: boolean;
}) {
  const label = accessibilityLabel(report);
  const passed = report?.status === "passed";
  const issues = report?.status === "issues";
  const review = report?.status === "review";
  return (
    <Badge
      colorPalette={
        issues ? "red" : passed ? "green" : review ? "orange" : "gray"
      }
      aria-label={label}
      title={label}
      flexShrink="0"
      whiteSpace="normal"
    >
      <Icon size="xs">
        {passed ? (
          <CircleCheck />
        ) : issues || review ? (
          <Accessibility />
        ) : (
          <CircleHelp />
        )}
      </Icon>
      {compact ? (issues ? report.violationCount : null) : label}
    </Badge>
  );
}
