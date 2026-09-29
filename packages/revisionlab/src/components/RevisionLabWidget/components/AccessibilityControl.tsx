import { useState } from "react";
import { Icon, IconButton, Image, Popover, Portal, Spinner } from "@chakra-ui/react";
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
  waiting: "Accessibility: waiting for access",
  checking: "Accessibility: checking this page",
  passed: "Accessibility: automated checks passed",
  issues: "Accessibility: issues found",
  review: "Accessibility: manual review needed",
  stale: "Accessibility: awaiting a fresh check",
  error: "Accessibility: check failed",
};
export function AccessibilityControl({
  result,
  onRerun,
  disabled,
}: {
  result: PageAccessibility;
  onRerun: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [topPanel, setTopPanel] = useState(false);
  const label = labels[result.status];
  return (
    <Popover.Root
      open={open}
      onOpenChange={(event) => {
        setOpen(event.open);
        if (!event.open) setTopPanel(false);
      }}
      onInteractOutside={(event) => {
        if (
          event.detail.target instanceof Element &&
          event.detail.target.closest("[data-revisionlab-accessibility-marker]")
        )
          event.preventDefault();
      }}
      positioning={{
        placement: topPanel ? "bottom-end" : "top",
        strategy: "fixed",
        getAnchorRect: topPanel
          ? () => ({ x: window.innerWidth - 16, y: 8, width: 0, height: 0 })
          : undefined,
      }}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <IconButton
          aria-label={label}
          title={label}
          w={{ base: "12", md: "14" }}
          h="14"
          borderRadius="0"
          variant="plain"
          color="white"
          _hover={{ bg: "blackAlpha.200" }}
          focusRing="inset"
        >
          {result.status === "checking" ? (
            <Spinner size="sm" />
          ) : result.status === "issues" || result.status === "passed" ? (
            <Image
              src={result.status === "passed" ? passedIconUrl : issuesIconUrl}
              alt=""
              w="28px"
              h="28px"
              flexShrink="0"
            />
          ) : (
            <Icon boxSize="7">
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
            onPlacementChange={setTopPanel}
          />
        </Portal>
      )}
    </Popover.Root>
  );
}
