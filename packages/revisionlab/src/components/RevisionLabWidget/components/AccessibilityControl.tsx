import { useState } from "react";
import {
  Icon,
  IconButton,
  Image,
  Popover,
  Portal,
  Spinner,
} from "@chakra-ui/react";
import { CircleHelp, CircleAlert } from "lucide-react";
import type { PageAccessibility } from "../hooks/usePageAccessibility.js";
import { AccessibilityResults } from "./AccessibilityResults.js";

const issuesIconUrl = new URL(
  "../../../../assets/accessibility-issues.svg",
  import.meta.url,
).href;
const passedIconUrl = new URL(
  "../../../../assets/accessibility-passed.svg",
  import.meta.url,
).href;

const labels: Record<PageAccessibility["status"], string> = {
  stopped: "Accessibility: auditing stopped",
  waiting: "Accessibility: waiting for access",
  checking: "Accessibility: checking this page",
  passed: "Accessibility: automated checks passed",
  issues: "Accessibility: issues found",
  review: "Accessibility: manual review needed",
  stale: "Accessibility: awaiting a fresh check",
  error: "Accessibility: check failed",
};
export function AccessibilityControl({
  color = "white",
  result,
  onRerun,
  disabled,
}: {
  color?: string;
  result: PageAccessibility;
  onRerun: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = labels[result.status];
  return (
    <Popover.Root
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      onInteractOutside={(event) => {
        if (
          event.detail.target instanceof Element &&
          event.detail.target.closest("[data-revisionlab-accessibility-marker]")
        )
          event.preventDefault();
      }}
      positioning={{
        placement: "top",
        strategy: "fixed",
      }}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <IconButton
          aria-label={label}
          title={label}
          size="sm"
          boxSize="9"
          minW="9"
          borderRadius="0"
          variant="plain"
          color={color}
          _hover={{ bg: "blackAlpha.200" }}
          focusRing="inset"
        >
          {result.status === "checking" ? (
            <Spinner size="sm" />
          ) : result.status === "issues" || result.status === "passed" ? (
            <Image
              src={result.status === "passed" ? passedIconUrl : issuesIconUrl}
              alt=""
              w="24px"
              h="24px"
              flexShrink="0"
            />
          ) : (
            <Icon boxSize="5">
              {result.status === "error" ? (
                <CircleAlert />
              ) : (
                <CircleHelp />
              )}
            </Icon>
          )}
        </IconButton>
      </Popover.Trigger>
      {open && (
        <Portal>
          <AccessibilityResults
            result={result}
            label={label}
            onRerun={onRerun}
            disabled={disabled}
          />
        </Portal>
      )}
    </Popover.Root>
  );
}
