import { NotificationSettings } from "../../NotificationSettings/index.js";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
import type {
  RevisionLabAccessSettings,
  RevisionLabInvitation,
  RevisionLabMembership,
  RevisionLabRole,
} from "../../../server/types.js";
import { GeneralSettings } from "./GeneralSettings.js";
import { WorkspaceInstancesSettings } from "./WorkspaceInstancesSettings.js";
import { WorkspaceHistory } from "./WorkspaceHistory.js";
import { useRef, useState, type RefObject } from "react";
import { Badge, Portal, Separator, Stack, Tabs, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabSettings } from "../../../comment-settings.js";
import { WidgetSettingsForm } from "./WidgetSettingsForm.js";
import { CommentSettings } from "./CommentSettings.js";
import { AuditSettings } from "./AuditSettings.js";
import { UsersRoleManager } from "../../UsersRoleManager/index.js";
import { AppearanceSettings } from "../../AppearanceSettings/index.js";
import { SystemUrlSettings } from "./SystemUrlSettings.js";
import { AiInstructionsSettings } from "./AiInstructionsSettings.js";
import { SettingsTabs } from "./SettingsTabs.js";

export function WorkspaceSettings({
  apiPath,
  managementApiPath,
  projectName,
  workspaces,
  settingsWorkspace,
  selection,
  actorRole,
  onInstanceRemoved,
  settings,
  canEdit,
  invitations,
  memberships,
  accessSettings,
  basePath,
  initialTab = "system",
  headerContainer,
  onRefresh,
}: {
  apiPath: string;
  managementApiPath: string;
  projectName: string;
  workspaces: WorkspaceInstance[];
  settingsWorkspace?: WorkspaceInstance;
  selection: string;
  actorRole: RevisionLabRole;
  onInstanceRemoved: (id: string) => void;
  settings: RevisionLabSettings;
  canEdit: boolean;
  invitations?: RevisionLabInvitation[];
  memberships: RevisionLabMembership[];
  accessSettings: RevisionLabAccessSettings | null;
  basePath: string;
  initialTab?: "system" | "users";
  headerContainer: RefObject<HTMLDivElement | null>;
  onRefresh: () => Promise<void>;
}) {
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);
  const canManageInstallation = actorRole === "owner" && Boolean(invitations);
  const activeTab =
    ["users", "general", "instances", "notifications"].includes(selectedTab) &&
    !canManageInstallation
      ? "system"
      : selectedTab;
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
      p={{ base: "4", md: "6" }}
      gap="6"
      w="full"
      minW="0"
      aria-busy={busy}
    >
      <Text fontSize="sm" color="fg.muted">
        Widget, Comments, and Audit settings apply to{" "}
        {settingsWorkspace?.name ?? "Local workspace"}. General, Users &amp;
        Roles, Notifications, and Workspace Instances manage this installation.
        History follows the selected workspace source, or every available source
        in All workspaces.
      </Text>
      {!canEdit && <Badge alignSelf="start">Read only</Badge>}
      <Tabs.Root
        value={activeTab}
        onValueChange={(event) => setSelectedTab(event.value)}
        colorPalette="blue"
        variant="line"
      >
        <Portal container={headerContainer}>
          <SettingsTabs
            canManageInstallation={canManageInstallation}
            canManageAccess={canManageInstallation && Boolean(accessSettings)}
          />
        </Portal>
        {invitations && (
          <Tabs.Content value="general" p="0">
            <Stack gap="7">
              {accessSettings && (
                <SystemUrlSettings
                  apiPath={managementApiPath}
                  settings={accessSettings}
                  onRefresh={onRefresh}
                />
              )}
              <Separator />
              <GeneralSettings
                apiPath={managementApiPath}
                projectName={projectName}
              />
            </Stack>
          </Tabs.Content>
        )}
        {invitations && (
          <Tabs.Content value="instances" p="0">
            <WorkspaceInstancesSettings
              apiPath={managementApiPath}
              workspaces={workspaces}
              onRefresh={onRefresh}
              onRemoved={onInstanceRemoved}
            />
          </Tabs.Content>
        )}
        {canManageInstallation && (
          <Tabs.Content value="notifications" p="0">
            <NotificationSettings apiPath={managementApiPath} />
          </Tabs.Content>
        )}
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
          <Stack gap="7">
            <AppearanceSettings
              section="accessibility"
              value={displayed}
              disabled={!canEdit || busy}
              onChange={(patch) => void update(patch)}
            />
            <Separator />
            <AuditSettings
              settings={settings}
              canEdit={canEdit}
              busy={busy}
              onSave={update}
            />
            <Separator />
            <AiInstructionsSettings
              key={apiPath}
              apiPath={apiPath}
              value={settings.ai}
              canEdit={canEdit}
              onRefresh={onRefresh}
            />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="history" p="0">
          <WorkspaceHistory
            apiPath={managementApiPath}
            sources={workspaces.filter((source) =>
              selection === "all"
                ? true
                : source.id === (settingsWorkspace?.id ?? "local"),
            )}
            actorRole={actorRole}
            onRefresh={onRefresh}
          />
        </Tabs.Content>
        {canManageInstallation && accessSettings && (
          <Tabs.Content value="users" p="0">
            <UsersRoleManager
              variant="embedded"
              apiPath={managementApiPath}
              basePath={basePath}
              memberships={memberships}
              settings={accessSettings}
              onRefresh={onRefresh}
            />
          </Tabs.Content>
        )}
      </Tabs.Root>
      {error && (
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      <Text role="status" fontSize="sm" color="fg.muted" minH="5">
        {busy ? "Saving settings..." : saved ? "Settings saved." : ""}
      </Text>
    </Stack>
  );
}
