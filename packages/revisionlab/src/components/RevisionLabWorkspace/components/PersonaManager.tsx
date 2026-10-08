import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { useState } from "react";
import {
  Badge,
  Button,
  Flex,
  Heading,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PersonaActions } from "./PersonaActions.js";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { PersonaTable } from "./PersonaTable.js";
import { PersonaForm } from "./PersonaForm.js";

export interface PersonaEditorControl {
  form: { persona?: RevisionLabPersona } | null;
  disabled: boolean;
  onChange: (form: { persona?: RevisionLabPersona } | null) => void;
}

export function PersonaManager({
  onBusyChange,
  apiPath,
  personas,
  canEdit,
  canManageCredentials,
  onRefresh,
  editor,
}: {
  onBusyChange?: (busy: boolean) => void;
  apiPath: string;
  personas: RevisionLabPersona[];
  canEdit: boolean;
  canManageCredentials: boolean;
  onRefresh: () => Promise<void>;
  editor?: PersonaEditorControl;
}) {
  const [inlineForm, setInlineForm] = useState<{
    persona?: RevisionLabPersona;
  } | null>(null);
  const editing = editor ? editor.form?.persona : inlineForm?.persona;
  const formOpen = editor ? editor.form !== null : inlineForm !== null;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const actionsDisabled = Boolean(busy) || Boolean(editor?.disabled);
  function closeEditor() {
    if (editor) editor.onChange(null);
    else setInlineForm(null);
  }
  async function archive(persona: RevisionLabPersona) {
    if (busy) return;
    setBusy(persona.id);
    onBusyChange?.(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(apiPath, `personas/${persona.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: !persona.archivedAt }),
      });
      await onRefresh();
      setNotice(
        persona.archivedAt
          ? "Persona restored."
          : "Persona archived. Existing recordings are unchanged.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update the persona.",
      );
    } finally {
      setBusy(null);
      onBusyChange?.(false);
    }
  }
  async function removeAccount(id: string) {
    if (busy) return;
    setBusy(id);
    onBusyChange?.(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(apiPath, `personas/${id}/credentials`, {
        method: "DELETE",
        body: "{}",
      });
      await onRefresh();
      setNotice("Persona test account removed.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not remove the test account.",
      );
    } finally {
      setBusy(null);
      onBusyChange?.(false);
    }
  }
  return (
    <Stack
      p={editor ? { base: "5", md: "8" } : "0"}
      gap="6"
      w="full"
      minW="0"
      maxW={editor ? "full" : "5xl"}
    >
      <Flex
        align="center"
        justify="space-between"
        gap="3"
        flexWrap="wrap"
        minW="0"
      >
        {editor && (
          <Heading as="h2" size="xl">
            Personas
          </Heading>
        )}
        <Badge colorPalette="gray" whiteSpace="normal" overflowWrap="anywhere">
          {personas.filter((persona) => !persona.archivedAt).length} active
        </Badge>
      </Flex>
      {canEdit && !editor && !formOpen && (
        <Button
          alignSelf="start"
          variant="outline"
          disabled={actionsDisabled}
          onClick={() => setInlineForm({})}
        >
          Add persona
        </Button>
      )}
      {canEdit && formOpen && (
        <PersonaForm
          onBusyChange={onBusyChange}
          key={editing?.id ?? "new"}
          apiPath={apiPath}
          persona={editing}
          onCancel={closeEditor}
          cancelable
          canManageCredentials={canManageCredentials}
          onSaved={async () => {
            await onRefresh();
            closeEditor();
            setNotice("Persona saved.");
          }}
        />
      )}
      {canEdit && formOpen && <Separator />}
      {error && (
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      {notice && (
        <Text role="status" color="green.fg" fontSize="sm">
          {notice}
        </Text>
      )}
      <Stack as="section" gap="0" aria-label="Saved personas">
        {personas.length === 0 && (
          <IllustratedEmptyState
            illustration="documents"
            description="No personas yet."
          />
        )}
        {personas.length > 0 && (
          <PersonaTable
            personas={personas}
            actions={
              canEdit
                ? (persona) => (
                    <PersonaActions
                      persona={persona}
                      disabled={actionsDisabled}
                      loading={busy === persona.id}
                      canManageCredentials={canManageCredentials}
                      onEdit={() => {
                        if (editor) editor.onChange({ persona });
                        else setInlineForm({ persona });
                        setNotice("");
                      }}
                      onArchive={() => void archive(persona)}
                      onRemoveAccount={() => void removeAccount(persona.id)}
                    />
                  )
                : undefined
            }
          />
        )}
      </Stack>
    </Stack>
  );
}
