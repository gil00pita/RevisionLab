import { useRef, useState } from "react";
import { Badge, Stack, Tabs, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabSettings } from "../../../comment-settings.js";
import { WidgetSettingsForm } from "./WidgetSettingsForm.js";
import { CommentSettings } from "./CommentSettings.js";
import { AuditSettings } from "./AuditSettings.js";
import { InvitationManager } from "../../InvitationManager/index.js";
import type { RevisionLabInvitation } from "../../../server/types.js";

export function WorkspaceSettings({
  apiPath,
  settings,
  canEdit,
  invitations,
  initialTab = "system",
  onRefresh,
}: {
  apiPath: string;
  settings: RevisionLabSettings;
  canEdit: boolean;
  invitations?: RevisionLabInvitation[];
  initialTab?: "system" | "users";
  onRefresh: () => Promise<void>;
}) {
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);
  const activeTab =
    selectedTab === "users" && !invitations ? "system" : selectedTab;
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
      {!canEdit && <Badge alignSelf="start">Read only</Badge>}
      <Tabs.Root
        value={activeTab}
        onValueChange={(event) => setSelectedTab(event.value)}
        colorPalette="blue"
        variant="line"
      >
        <Tabs.List aria-label="Settings sections" mb="6" flexWrap="wrap">
          <Tabs.Trigger value="system" px={{ base: "3", md: "4" }}>
            Widget
          </Tabs.Trigger>
          <Tabs.Trigger value="comments" px={{ base: "3", md: "4" }}>
            Comments
          </Tabs.Trigger>
          <Tabs.Trigger value="audit" px={{ base: "3", md: "4" }}>
            Audit
          </Tabs.Trigger>
          {invitations && (
            <Tabs.Trigger value="users" px={{ base: "3", md: "4" }}>
              Users &amp; Roles
            </Tabs.Trigger>
          )}
        </Tabs.List>
        <Tabs.Content value="system" p="0">
          <WidgetSettingsForm
            settings={settings}
            canEdit={canEdit}
            busy={busy}
            onSave={update}
          />
        </Tabs.Content>
        <Tabs.Content value="comments" p="0">
          <CommentSettings
            settings={displayed}
            canEdit={canEdit}
            busy={busy}
            onChange={update}
          />
        </Tabs.Content>
        <Tabs.Content value="audit" p="0">
          <AuditSettings />
        </Tabs.Content>
        {invitations && (
          <Tabs.Content value="users" p="0">
            <InvitationManager
              apiPath={apiPath}
              invitations={invitations}
              onRefresh={onRefresh}
            />
          </Tabs.Content>
        )}
      </Tabs.Root>
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
