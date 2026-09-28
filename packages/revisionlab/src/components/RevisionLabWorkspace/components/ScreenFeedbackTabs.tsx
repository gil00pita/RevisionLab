import type { ReactNode } from "react";
import { Badge, Tabs } from "@chakra-ui/react";
import type { AccessibilityReport } from "../../../accessibility.js";
import { ScreenAccessibility } from "./ScreenAccessibility.js";

export function ScreenFeedbackTabs({
  value,
  onChange,
  report,
  comments,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  report?: AccessibilityReport;
  comments: number;
  children: ReactNode;
}) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={(event) => onChange(event.value)}
      size="sm"
      fitted
    >
      <Tabs.List mb="4">
        <Tabs.Trigger value="comments" px="2" gap="1">
          Comments{comments > 0 && <Badge size="xs">{comments}</Badge>}
        </Tabs.Trigger>
        <Tabs.Trigger value="accessibility" px="2" gap="1">
          Accessibility
          {Boolean(report?.violationCount) && (
            <Badge size="xs" colorPalette="red">
              {report!.violationCount}
            </Badge>
          )}
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="comments" p="0">
        {children}
      </Tabs.Content>
      <Tabs.Content value="accessibility" p="0">
        <ScreenAccessibility report={report} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
