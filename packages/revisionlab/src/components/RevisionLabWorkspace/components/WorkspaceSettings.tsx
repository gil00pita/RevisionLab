import { useRef, useState } from "react";
import {
  Badge,
  Field,
  Flex,
  Heading,
  Separator,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabSettings } from "../../../comment-settings.js";
import { BubbleColorPicker } from "./BubbleColorPicker.js";

export function WorkspaceSettings({
  apiPath,
  settings,
  canEdit,
  onRefresh,
}: {
  apiPath: string;
  settings: RevisionLabSettings;
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}) {
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Partial<RevisionLabSettings> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const displayed = { ...settings, ...pending };

  async function update(patch: Partial<RevisionLabSettings>) {
    if (!canEdit || saving.current) return;
    const focused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    saving.current = true;
    setBusy(true);
    setPending(patch);
    setError("");
    setSaved(false);
    try {
      await apiRequest<RevisionLabSettings>(apiPath, "settings", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await onRefresh();
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save settings.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
      setPending(null);
      // Read-only radio groups temporarily disable their native inputs.
      requestAnimationFrame(() => {
        if (focused?.isConnected && document.activeElement === document.body)
          focused.focus({ preventScroll: true });
      });
    }
  }

  return (
    <Stack
      p={{ base: "5", md: "8" }}
      gap="6"
      w="full"
      maxW="3xl"
      aria-busy={busy}
    >
      <Flex align="center" justify="space-between" gap="3">
        <Heading as="h2" size="xl">
          Settings
        </Heading>
        {!canEdit && <Badge>Read only</Badge>}
      </Flex>
      <Separator />
      <Heading as="h3" size="md">
        Live comments
      </Heading>
      <Field.Root disabled={!canEdit}>
        <Switch.Root
          checked={displayed.showCommentBubbles}
          disabled={!canEdit}
          readOnly={busy}
          onCheckedChange={(event) =>
            void update({ showCommentBubbles: event.checked })
          }
          colorPalette="blue"
        >
          <Switch.HiddenInput />
          <Switch.Control
            borderWidth="1px"
            borderColor="gray.500"
            _checked={{ borderColor: "blue.700" }}
          >
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Show comment bubbles by default</Switch.Label>
        </Switch.Root>
      </Field.Root>
      <BubbleColorPicker
        value={displayed.commentBubbleColor}
        disabled={!canEdit}
        readOnly={busy}
        onChange={(color) => void update({ commentBubbleColor: color })}
      />
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      <Text role="status" fontSize="sm" color="gray.600" minH="5">
        {busy ? "Saving settings..." : saved ? "Settings saved." : ""}
      </Text>
    </Stack>
  );
}
