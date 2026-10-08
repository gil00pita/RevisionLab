import { CommentNotifications } from "../../CommentNotifications/index.js";
import { Box, Icon, Stack, Text } from "@chakra-ui/react";
import { Settings } from "lucide-react";
import { WorkspaceNavigationButton } from "./WorkspaceNavigationButton.js";
import { WorkspaceThemeSwitcher } from "./WorkspaceThemeSwitcher.js";
import type { RevisionLabState } from "../../../server/types.js";

export function WorkspaceSidebarFooter({
  actor,
  apiPath,
  basePath,
  settingsActive,
  onSettings,
  disabled,
}: {
  actor: RevisionLabState["actor"];
  apiPath: string;
  basePath: string;
  settingsActive: boolean;
  onSettings: () => void;
  disabled: boolean;
}) {
  return (
    <Stack
      gap="4"
      flexShrink="0"
      p="3"
      borderTopWidth="1px"
      borderColor="border.emphasized"
    >
      <Stack as="nav" aria-label="Workspace settings" gap="0">
        <WorkspaceNavigationButton
          active={settingsActive}
          onClick={onSettings}
          disabled={disabled}
        >
          <Icon>
            <Settings />
          </Icon>
          Settings
        </WorkspaceNavigationButton>
        <WorkspaceThemeSwitcher />
        <CommentNotifications
          key={actor.id}
          apiPath={apiPath}
          basePath={basePath}
        />
      </Stack>
      <Box px="3" pb="3" display={{ base: "none", lg: "block" }}>
        <Text fontWeight="semibold" fontSize="sm" overflowWrap="anywhere">
          {actor.name}
        </Text>
        <Text fontSize="xs" color="fg.muted" textTransform="capitalize">
          {actor.role}
        </Text>
      </Box>
    </Stack>
  );
}
