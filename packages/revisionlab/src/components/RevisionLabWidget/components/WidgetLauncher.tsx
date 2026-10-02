import { Collapsible, Flex, Icon, IconButton, Image } from "@chakra-ui/react";
import { Camera, MessageSquarePlus } from "lucide-react";
import type { PageAccessibility } from "../hooks/usePageAccessibility.js";
import { AccessibilityControl } from "./AccessibilityControl.js";
import { WidgetTool } from "./WidgetTool.js";
import { WidgetWorkspaceLink } from "./WidgetWorkspaceLink.js";

const markUrl = new URL("../../../../assets/widget-mark.svg", import.meta.url)
  .href;

export function WidgetLauncher({
  expanded,
  onExpandedChange,
  onStopAudit,
  recording,
  canRecord,
  commenting,
  commentCount,
  busy,
  accessibility,
  onRerun,
  workspaceHref,
  onRecord,
  onComment,
  authorized,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onStopAudit: () => void;
  recording: boolean;
  canRecord: boolean;
  commenting: boolean;
  commentCount: number;
  busy: boolean;
  accessibility: PageAccessibility;
  authorized: boolean;
  onRerun: () => void;
  workspaceHref: string;
  onRecord: () => void;
  onComment: () => void;
}) {
  const auditing = accessibility.status === "checking";
  return (
    <Collapsible.Root
      unmountOnExit
      open={expanded}
      onOpenChange={(event) => onExpandedChange(event.open)}
      data-revisionlab-ui
      role="group"
      aria-label="RevisionLab toolbar"
      position="fixed"
      bottom={{ base: "4", md: "6" }}
      right={{ base: "3", md: "6" }}
      zIndex="popover"
      display="flex"
      alignItems="center"
      bg="blue.600"
      color="white"
      borderRadius="full"
      shadow="lg"
      maxW="calc(100vw - 1.5rem)"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onExpandedChange(false);
          event.currentTarget
            .querySelector<HTMLButtonElement>("[data-widget-toggle]")
            ?.focus();
        }
      }}
    >
      <Collapsible.Content
        flexShrink="0"
        inert={!expanded}
        animationFillMode="both"
        _open={{
          animationName: "expand-width, fade-in",
          animationDuration: "moderate",
          animationTimingFunction: "ease-out",
          _motionReduce: { animationName: "none" },
        }}
        _closed={{
          animationName: "collapse-width, fade-out",
          animationDuration: "fast",
          animationTimingFunction: "ease-in",
          pointerEvents: "none",
          _motionReduce: { animationName: "none" },
        }}
      >
        <Flex align="center" pl="1" w="max-content">
          <WidgetWorkspaceLink href={workspaceHref} />
          <AccessibilityControl
            result={accessibility}
            onRerun={onRerun}
            disabled={!authorized}
          />
          {canRecord && !recording && (
            <WidgetTool
              label="Record prototype"
              disabled={busy}
              onClick={onRecord}
            >
              <Icon boxSize="5">
                <Camera />
              </Icon>
            </WidgetTool>
          )}
          {!commenting && (
            <WidgetTool
              label="Comment on an element"
              disabled={!authorized}
              onClick={onComment}
              count={commentCount}
            >
              <Icon boxSize="5">
                <MessageSquarePlus />
              </Icon>
            </WidgetTool>
          )}
        </Flex>
      </Collapsible.Content>
      {recording && (
        <WidgetTool
          label="Stop recording"
          active
          disabled={busy}
          onClick={onRecord}
        />
      )}
      {commenting && (
        <WidgetTool label="Stop commenting" active onClick={onComment} />
      )}
      {auditing && (
        <WidgetTool label="Stop auditing" active onClick={onStopAudit} />
      )}
      <Collapsible.Trigger asChild>
        <IconButton
          data-widget-toggle
          aria-label={
            expanded
              ? "Collapse RevisionLab widget"
              : "Expand RevisionLab widget"
          }
          title={
            expanded
              ? "Collapse RevisionLab widget"
              : "Expand RevisionLab widget"
          }
          variant="plain"
          color="white"
          size="sm"
          boxSize="9"
          minW="9"
          flexShrink="0"
          borderRadius="full"
          _hover={{ bg: "blackAlpha.200" }}
          focusRing="inset"
        >
          <Image src={markUrl} alt="" w="16px" h="18px" flexShrink="0" />
        </IconButton>
      </Collapsible.Trigger>
    </Collapsible.Root>
  );
}
