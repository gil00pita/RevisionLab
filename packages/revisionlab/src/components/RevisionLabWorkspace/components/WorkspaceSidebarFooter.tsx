import { Box, Icon, Stack, Text } from "@chakra-ui/react";
import { Settings } from "lucide-react";
import { WorkspaceNavigationButton } from "./WorkspaceNavigationButton.js";
import type { RevisionLabState } from "../../../server/types.js";

export function WorkspaceSidebarFooter({
  actor,
  settingsActive,
  onSettings,
  disabled,
}: {
  actor: RevisionLabState["actor"];
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
      borderColor="whiteAlpha.200"
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
      </Stack>
      <Box px="3" pb="3" display={{ base: "none", lg: "block" }}>
        <Text fontWeight="semibold" fontSize="sm" overflowWrap="anywhere">
          {actor.name}
        </Text>
        <Text fontSize="xs" color="gray.300" textTransform="capitalize">
          {actor.role}
        </Text>
      </Box>
    </Stack>
  );
}
