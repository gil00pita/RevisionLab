import { Collapsible, Flex, Icon } from "@chakra-ui/react";
import { Camera, MessageSquarePlus } from "lucide-react";
import type { PageAccessibility } from "../hooks/usePageAccessibility.js";
import { AccessibilityControl } from "./AccessibilityControl.js";
import { WidgetTool } from "./WidgetTool.js";
import { WidgetWorkspaceLink } from "./WidgetWorkspaceLink.js";

import {
  widgetColorTokens,
  widgetPlacement,
  type WidgetSettings,
} from "../../../widget-settings.js";
import type { RevisionLabSettings } from "../../../comment-settings.js";
import { WidgetToggle } from "./WidgetToggle.js";

export function WidgetLauncher({
  settings,
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
  settings: WidgetSettings & Pick<RevisionLabSettings, "auditLivePages">;
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
      {...widgetPlacement(settings)}
      zIndex="popover"
      display="flex"
      alignItems="center"
      flexDirection={settings.widgetSide === "left" ? "row-reverse" : "row"}
      bg={widgetColorTokens(settings.widgetColor).solid}
      color="colorPalette.contrast"
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
        <Flex
          align="center"
          px="0.5"
          w="max-content"
          flexDirection={settings.widgetSide === "left" ? "row-reverse" : "row"}
        >
          <WidgetWorkspaceLink href={workspaceHref} />
          {settings.auditLivePages && (
            <AccessibilityControl
              result={accessibility}
              onRerun={onRerun}
              disabled={!authorized}
            />
          )}
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
          variant="stop"
          disabled={busy}
          onClick={onRecord}
        />
      )}
      {commenting && (
        <WidgetTool label="Stop commenting" variant="stop" onClick={onComment} />
      )}
      {settings.auditLivePages && auditing && (
        <WidgetTool
          label="Stop auditing"
          variant="scanning"
          onClick={onStopAudit}
        />
      )}
      <WidgetToggle expanded={expanded} accessibility={accessibility} />
    </Collapsible.Root>
  );
}
