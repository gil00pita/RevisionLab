import { Button, Flex, Icon, IconButton, Menu, Portal } from "@chakra-ui/react";
import {
  Archive,
  KeyRound,
  MoreHorizontal,
  Pencil,
  RotateCcw,
} from "lucide-react";
import type { PersonaActionsProps } from "../PersonaActions.js";
export function PersonaActionMenu({
  persona,
  disabled,
  loading,
  canEdit,
  canManageCredentials,
  onView,
  onEdit,
  onArchive,
  onRemoveAccount,
}: PersonaActionsProps) {
  return (
    <Flex gap="2" w="full" justify="space-between" minW="0">
      <Button
        size="sm"
        minH="11"
        variant="outline"
        colorPalette="gray"
        rounded="lg"
        disabled={disabled}
        onClick={onView}
        aria-label={`View profile for ${persona.name}`}
      >
        View profile
      </Button>
      {canEdit && (
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger asChild>
            <IconButton
              size="sm"
              minH="11"
              variant="ghost"
              colorPalette="gray"
              aria-label={`More actions for ${persona.name}`}
              disabled={disabled}
              loading={loading}
            >
              <Icon>
                <MoreHorizontal />
              </Icon>
            </IconButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner
              data-revisionlab-ui
              color="fg"
              fontFamily="body"
              fontSize="sm"
              lineHeight="1.6"
              colorPalette="gray"
            >
              <Menu.Content maxW="calc(100vw - 2rem)">
                <Menu.Item value="edit" onClick={onEdit}>
                  <Icon>
                    <Pencil />
                  </Icon>
                  Edit basic information
                </Menu.Item>
                {canManageCredentials && persona.hasCredentials && (
                  <Menu.Item
                    value="remove-account"
                    onClick={onRemoveAccount}
                    color="red.fg"
                  >
                    <Icon>
                      <KeyRound />
                    </Icon>
                    Remove test account
                  </Menu.Item>
                )}
                <Menu.Separator />
                <Menu.Item value="archive" onClick={onArchive}>
                  <Icon>
                    {persona.archivedAt ? <RotateCcw /> : <Archive />}
                  </Icon>
                  {persona.archivedAt ? "Restore persona" : "Archive persona"}
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      )}
    </Flex>
  );
}
