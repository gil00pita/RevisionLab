import { Field, Heading, Stack, Switch, Text } from "@chakra-ui/react";
import type { RevisionLabSettings } from "../../comment-settings.js";
import { widgetColorTokens } from "../../widget-settings.js";
import { wcagLevels, wcagVersions, wcagLabel } from "../../wcag-settings.js";
import { SegmentedField } from "../SegmentedField/index.js";
import {
  WidgetPreview,
  LiveCommentPreview,
} from "../RevisionLabWidget/index.js";
import { BubbleColorPicker } from "./components/BubbleColorPicker.js";

export function AppearanceSettings({
  section,
  value,
  disabled = false,
  onChange,
}: {
  section: "widget" | "comments" | "accessibility";
  value: RevisionLabSettings;
  disabled?: boolean;
  onChange: (patch: Partial<RevisionLabSettings>) => void;
}) {
  const toggle = (
    key:
      | "showWidget"
      | "showCommentBubbles"
      | "auditLivePages"
      | "auditRecordings",
    label: string,
  ) => (
    <Field.Root disabled={disabled}>
      <Switch.Root
        checked={value[key]}
        disabled={disabled}
        onCheckedChange={(event) => onChange({ [key]: event.checked })}
        colorPalette="blue"
        minH="11"
      >
        <Switch.HiddenInput />
        <Switch.Control
          outlineWidth="1px"
          outlineStyle="solid"
          outlineColor="border.emphasized"
          _checked={{ outlineColor: "blue.border" }}
        >
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label lineHeight="tall">{label}</Switch.Label>
      </Switch.Root>
    </Field.Root>
  );
  return (
    <Stack gap="6">
      {section === "widget" && (
        <>
          <BubbleColorPicker
            label="Widget color"
            value={value.widgetColor}
            tokens={widgetColorTokens}
            disabled={disabled}
            readOnly={false}
            onChange={(widgetColor) => onChange({ widgetColor })}
          />
          <SegmentedField
            label="Widget position"
            value={value.widgetPosition}
            disabled={disabled}
            options={[
              { value: "bottom-left", label: "Bottom left" },
              { value: "bottom-right", label: "Bottom right" },
            ]}
            onChange={(position) => {
              if (position === "bottom-left" || position === "bottom-right")
                onChange({
                  widgetPosition: position,
                  widgetSide: position === "bottom-left" ? "left" : "right",
                });
            }}
          />
          {toggle("showWidget", "Show the RevisionLab widget")}
          <Text color="fg.muted" fontSize="sm">
            You can always open the workspace directly to change these settings.
          </Text>
          <WidgetPreview settings={value} />
        </>
      )}
      {section === "comments" && (
        <>
          {toggle("showCommentBubbles", "Show live comments on the prototype")}
          <BubbleColorPicker
            label="Comment color"
            value={value.commentBubbleColor}
            disabled={disabled}
            readOnly={false}
            onChange={(commentBubbleColor) => onChange({ commentBubbleColor })}
          />
          <LiveCommentPreview
            key={String(value.showCommentBubbles)}
            color={value.commentBubbleColor}
            visible={value.showCommentBubbles}
          />
        </>
      )}
      {section === "accessibility" && (
        <>
          <Heading as="h3" size="md">
            Automated accessibility checks
          </Heading>
          <SegmentedField
            label="WCAG version"
            value={value.wcagVersion}
            disabled={disabled}
            options={wcagVersions.map((version) => ({
              value: version,
              label: version,
            }))}
            onChange={(version) => {
              const wcagVersion = wcagVersions.find((item) => item === version);
              if (wcagVersion) onChange({ wcagVersion });
            }}
          />
          <SegmentedField
            label="Conformance level"
            value={value.wcagLevel}
            disabled={disabled}
            options={wcagLevels.map((level) => ({
              value: level,
              label: level,
            }))}
            onChange={(level) => {
              const wcagLevel = wcagLevels.find((item) => item === level);
              if (wcagLevel) onChange({ wcagLevel });
            }}
          />
          {toggle("auditLivePages", "Audit live prototype pages")}
          {toggle("auditRecordings", "Audit recorded screens")}
          <Text color="fg.muted" fontSize="sm">
            Selected target: {wcagLabel(value)}. AA includes A; AAA includes A
            and AA.
          </Text>
          <Text color="fg.muted">
            Run supported checks on live pages and new recordings. Some
            criteria, including many AAA requirements, need manual review.
            Automated checks do not certify compliance. Saved reports stay
            unchanged.
          </Text>
        </>
      )}
    </Stack>
  );
}
