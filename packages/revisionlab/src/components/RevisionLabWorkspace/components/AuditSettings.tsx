import { useState } from "react";
import {
  Button,
  Field,
  Heading,
  HStack,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  wcagVersions,
  wcagLevels,
  wcagLabel,
  type WcagSettings,
} from "../../../wcag-settings.js";

export function AuditSettings({
  settings,
  canEdit,
  busy,
  onSave,
}: {
  settings: WcagSettings;
  canEdit: boolean;
  busy: boolean;
  onSave: (settings: WcagSettings) => Promise<void>;
}) {
  const incoming: WcagSettings = {
    wcagVersion: settings.wcagVersion,
    wcagLevel: settings.wcagLevel,
  };
  const settingsKey = wcagLabel(incoming);
  const [sourceKey, setSourceKey] = useState(settingsKey);
  const [draft, setDraft] = useState(incoming);
  if (sourceKey !== settingsKey) {
    setSourceKey(settingsKey);
    setDraft(incoming);
  }
  return (
    <Stack gap="6">
      <Stack
        as="form"
        gap="5"
        onSubmit={(event) => {
          event.preventDefault();
          if (canEdit && !busy) void onSave(draft);
        }}
      >
        <Heading as="h2" size="md">
          Default accessibility standard
        </Heading>
        <Text color="fg.muted">
          Choose the WCAG version and conformance level used for page checks and
          new recording evidence.
        </Text>
        <Field.Root disabled={!canEdit || busy}>
          <RadioGroup.Root
            name="wcagVersion"
            value={draft.wcagVersion}
            disabled={!canEdit || busy}
            colorPalette="blue"
            onValueChange={(event) => {
              const version = wcagVersions.find(
                (value) => value === event.value,
              );
              if (version) setDraft({ ...draft, wcagVersion: version });
            }}
          >
            <RadioGroup.Label fontWeight="medium" fontSize="sm" mb="3">
              WCAG version
            </RadioGroup.Label>
            <HStack gap="5" flexWrap="wrap">
              {wcagVersions.map((version) => (
                <RadioGroup.Item key={version} value={version}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>{version}</RadioGroup.ItemText>
                </RadioGroup.Item>
              ))}
            </HStack>
          </RadioGroup.Root>
        </Field.Root>
        <Field.Root disabled={!canEdit || busy}>
          <RadioGroup.Root
            name="wcagLevel"
            value={draft.wcagLevel}
            disabled={!canEdit || busy}
            colorPalette="blue"
            onValueChange={(event) => {
              const level = wcagLevels.find((value) => value === event.value);
              if (level) setDraft({ ...draft, wcagLevel: level });
            }}
          >
            <RadioGroup.Label fontWeight="medium" fontSize="sm" mb="3">
              Conformance level
            </RadioGroup.Label>
            <HStack gap="5" flexWrap="wrap">
              {wcagLevels.map((level) => (
                <RadioGroup.Item key={level} value={level}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>{level}</RadioGroup.ItemText>
                </RadioGroup.Item>
              ))}
            </HStack>
          </RadioGroup.Root>
          <Field.HelperText>
            AA includes A checks. AAA includes A and AA checks.
          </Field.HelperText>
        </Field.Root>
        <Text fontSize="sm" color="fg.muted">
          Selected default: {wcagLabel(draft)}. Existing saved reports stay
          unchanged.
        </Text>
        <Button
          type="submit"
          colorPalette="blue"
          alignSelf="start"
          disabled={!canEdit || busy}
          loading={busy}
        >
          Save audit settings
        </Button>
      </Stack>
      <Stack gap="4">
        <Heading as="h3" size="sm">
          Accessibility checks
        </Heading>
        <Text color="fg.muted">
          RevisionLab automatically checks visited prototype pages while the
          widget is visible. The collapsed widget shows a spinner during checks
          and a badge when issues are found.
        </Text>
        <Text color="fg.muted">
          Expand the widget and open its accessibility results to review
          findings or choose Run again. Stop auditing pauses live-page checks
          until you rerun them or reload the page. Accessibility evidence
          collected during recordings is checked separately using the saved
          standard.
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Only checks supported by the automated engine run. Some criteria,
          including many AAA requirements, need manual review; a passing scan
          does not establish WCAG conformance.
        </Text>
      </Stack>
    </Stack>
  );
}
