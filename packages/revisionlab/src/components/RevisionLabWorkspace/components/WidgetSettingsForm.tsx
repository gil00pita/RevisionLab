import { useState } from "react";
import {
  Button,
  Field,
  Heading,
  HStack,
  Input,
  RadioGroup,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import {
  maxWidgetOffset,
  widgetColorTokens,
  type WidgetSettings,
} from "../../../widget-settings.js";
import { SettingsColorPicker } from "./SettingsColorPicker.js";

export function WidgetSettingsForm({
  settings,
  canEdit,
  busy,
  onSave,
}: {
  settings: WidgetSettings;
  canEdit: boolean;
  busy: boolean;
  onSave: (settings: WidgetSettings) => Promise<void>;
}) {
  const incoming: WidgetSettings = {
    showWidget: settings.showWidget,
    widgetColor: settings.widgetColor,
    widgetSide: settings.widgetSide,
    widgetOffset: settings.widgetOffset,
    widgetBottomOffset: settings.widgetBottomOffset,
  };
  const settingsKey = JSON.stringify(incoming);
  const [sourceKey, setSourceKey] = useState(settingsKey);
  const [draft, setDraft] = useState(incoming);
  const [offset, setOffset] = useState(String(settings.widgetOffset));
  const [bottom, setBottom] = useState(String(settings.widgetBottomOffset));
  // Sync saved/external changes without remounting the focused control.
  if (settingsKey !== sourceKey) {
    setSourceKey(settingsKey);
    setDraft(incoming);
    setOffset(String(incoming.widgetOffset));
    setBottom(String(incoming.widgetBottomOffset));
  }
  return (
    <Stack
      as="form"
      gap="5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canEdit && !busy)
          void onSave({
            ...draft,
            widgetOffset: Number(offset),
            widgetBottomOffset: Number(bottom),
          });
      }}
    >
      <Heading as="h2" size="md">
        Widget
      </Heading>
      <Field.Root disabled={!canEdit}>
        <Switch.Root
          checked={draft.showWidget}
          disabled={!canEdit}
          readOnly={busy}
          onCheckedChange={(event) =>
            setDraft({ ...draft, showWidget: event.checked })
          }
          colorPalette="blue"
        >
          <Switch.HiddenInput />
          <Switch.Control
            borderWidth="1px"
            borderColor="fg.muted"
            _checked={{ borderColor: "blue.border" }}
          >
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Show widget</Switch.Label>
        </Switch.Root>
        <Field.HelperText>
          Active recordings and comment sessions keep their controls until
          finished. You can always reopen Settings from the workspace.
        </Field.HelperText>
      </Field.Root>
      <SettingsColorPicker
        label="Widget color"
        value={draft.widgetColor}
        tokens={widgetColorTokens}
        disabled={!canEdit}
        readOnly={busy}
        onChange={(widgetColor) => setDraft({ ...draft, widgetColor })}
      />
      <Field.Root disabled={!canEdit}>
        <Field.Label>Position</Field.Label>
        <RadioGroup.Root
          aria-label="Widget position"
          value={draft.widgetSide}
          disabled={!canEdit}
          readOnly={busy}
          colorPalette="blue"
          onValueChange={(event) => {
            if (event.value === "left" || event.value === "right")
              setDraft({ ...draft, widgetSide: event.value });
          }}
        >
          <HStack gap="6">
            {(["left", "right"] as const).map((side) => (
              <RadioGroup.Item key={side} value={side}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText textTransform="capitalize">
                  {side}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </HStack>
        </RadioGroup.Root>
      </Field.Root>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <Field.Root required disabled={!canEdit}>
          <Field.Label>
            Horizontal offset (px)
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="number"
            min={0}
            max={maxWidgetOffset}
            step={1}
            required
            value={offset}
            readOnly={busy}
            onChange={(event) => setOffset(event.target.value)}
          />
          <Field.HelperText>
            Distance from the {draft.widgetSide} edge.
          </Field.HelperText>
        </Field.Root>
        <Field.Root required disabled={!canEdit}>
          <Field.Label>
            Bottom offset (px)
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="number"
            min={0}
            max={maxWidgetOffset}
            step={1}
            required
            value={bottom}
            readOnly={busy}
            onChange={(event) => setBottom(event.target.value)}
          />
          <Field.HelperText>Distance from the bottom edge.</Field.HelperText>
        </Field.Root>
      </SimpleGrid>
      <Text fontSize="sm" color="fg.muted">
        Offsets are adjusted on small screens to keep the tools visible.
      </Text>
      {canEdit && (
        <Button
          type="submit"
          alignSelf="start"
          colorPalette="blue"
          loading={busy}
        >
          Save widget settings
        </Button>
      )}
    </Stack>
  );
}
