import { Heading, Stack } from "@chakra-ui/react";
import {
  sourceApiPath,
  sourceCanEdit,
  type WorkspaceState,
} from "../../../workspace-instances.js";
import { PersonaManager } from "./PersonaManager.js";
export function WorkspacePersonas({
  data,
  apiPath,
  onRefresh,
}: {
  data: WorkspaceState;
  apiPath: string;
  onRefresh: () => Promise<void>;
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
            onRefresh={onRefresh}
          />
        </Stack>
      ))}
    </Stack>
  );
}
