import { Button, Flex, Icon } from "@chakra-ui/react";
import { Archive, Eye, KeyRound, Pencil, RotateCcw } from "lucide-react";
import type { RevisionLabPersona } from "../../../server/types.js";

export function PersonaActions({
  persona,
  disabled,
  loading,
  canManageCredentials,
  canEdit,
  onView,
  onEdit,
  onArchive,
  onRemoveAccount,
}: {
  persona: RevisionLabPersona;
  disabled: boolean;
  loading: boolean;
  canManageCredentials: boolean;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRemoveAccount: () => void;
}) {
  return (
    <Flex gap="2" flexWrap="wrap" minW="0">
      <Button size="sm" minH="11" variant="outline" disabled={disabled} onClick={onView} aria-label={`View profile for ${persona.name}`}><Icon><Eye /></Icon>Profile</Button>
      {canEdit && <>
      <Button
        size="sm"
        minH="11"
        variant="ghost"
        disabled={disabled}
        onClick={onEdit}
        aria-label={`Edit ${persona.name}`}
      >
        <Icon>
          <Pencil />
        </Icon>
        Edit
      </Button>
      </>}
      {canManageCredentials && persona.hasCredentials && (
        <Button
          size="sm"
          minH="11"
          variant="outline"
          colorPalette="red"
          disabled={disabled}
          onClick={onRemoveAccount}
        >
          <Icon>
            <KeyRound />
          </Icon>
          Remove account
        </Button>
      )}
      {canEdit && <Button
        size="sm"
        minH="11"
        variant="outline"
        disabled={disabled}
        loading={loading}
        onClick={onArchive}
      >
        <Icon>{persona.archivedAt ? <RotateCcw /> : <Archive />}</Icon>
        {persona.archivedAt ? "Restore" : "Archive"}
      </Button>}
    </Flex>
  );
}
