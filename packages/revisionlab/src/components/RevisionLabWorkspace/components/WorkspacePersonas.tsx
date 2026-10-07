import { Heading, Stack } from "@chakra-ui/react";
import {
  sourceApiPath,
  sourceCanEdit,
  type WorkspaceState,
} from "../../../workspace-instances.js";
import { PersonaManager } from "./PersonaManager.js";
import type { RevisionLabPersona } from "../../../server/types.js";

export interface WorkspacePersonaEditor {
  sourceId: string;
  persona?: RevisionLabPersona;
}

export function WorkspacePersonas({
  data,
  apiPath,
  onRefresh,
  editor,
  onEditorChange,
  onBusyChange,
  disabled,
}: {
  data: WorkspaceState;
  apiPath: string;
  onRefresh: () => Promise<void>;
  editor: WorkspacePersonaEditor | null;
  onEditorChange: (editor: WorkspacePersonaEditor | null) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}) {
  const sources = data.workspaces.filter(
    (source) =>
      (data.selection === "all" || data.selection === source.id) &&
      source.status !== "unavailable",
  );
  return (
    <Stack gap="4">
      {sources.map((source) => (
        <Stack key={source.id} gap="0">
          {sources.length > 1 && (
            <Heading as="h2" size="md" px={{ base: "5", md: "8" }} pt="5">
              {source.name}
            </Heading>
          )}
          <PersonaManager
            apiPath={sourceApiPath(apiPath, source)}
            personas={data.personas.filter(
              (persona) => persona.workspace?.id === source.id,
            )}
            canEdit={sourceCanEdit(data.actor.role, source)}
            canManageCredentials={
              data.actor.role === "owner" && source.id === "local"
            }
            onRefresh={onRefresh}
            onBusyChange={onBusyChange}
            editor={{
              form: editor?.sourceId === source.id ? { persona: editor.persona } : null,
              disabled: disabled || editor !== null,
              onChange: (form) => onEditorChange(form ? { sourceId: source.id, persona: form.persona } : null),
            }}
          />
        </Stack>
      ))}
    </Stack>
  );
}
