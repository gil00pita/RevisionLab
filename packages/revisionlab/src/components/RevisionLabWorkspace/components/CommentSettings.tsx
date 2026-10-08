import { Field, Heading, Stack, Switch } from "@chakra-ui/react";
import type { RevisionLabSettings } from "../../../comment-settings.js";
import { SettingsColorPicker } from "./SettingsColorPicker.js";

type CommentPreferences = Pick<
  RevisionLabSettings,
  "showCommentBubbles" | "commentBubbleColor"
>;

export function CommentSettings({
  settings,
  canEdit,
  busy,
  onChange,
}: {
  settings: CommentPreferences;
  canEdit: boolean;
  busy: boolean;
  onChange: (patch: Partial<CommentPreferences>) => Promise<void>;
}) {
  return (
    <Stack gap="5">
      <Heading as="h2" size="md">
        Live comments
      </Heading>
      <Field.Root disabled={!canEdit}>
        <Switch.Root
          checked={settings.showCommentBubbles}
          disabled={!canEdit}
          readOnly={busy}
          onCheckedChange={(event) =>
            void onChange({ showCommentBubbles: event.checked })
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
          <Switch.Label>Show comment bubbles by default</Switch.Label>
        </Switch.Root>
      </Field.Root>
      <SettingsColorPicker
        value={settings.commentBubbleColor}
        disabled={!canEdit}
        readOnly={busy}
        onChange={(color) => void onChange({ commentBubbleColor: color })}
      />
    </Stack>
  );
}
