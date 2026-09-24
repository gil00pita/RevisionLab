import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Archive, Pencil, RotateCcw } from "lucide-react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { PersonaForm } from "./PersonaForm.js";

export function PersonaManager({
  apiPath,
  personas,
  canEdit,
  onRefresh,
}: {
  apiPath: string;
  personas: RevisionLabPersona[];
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<RevisionLabPersona | undefined>();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function archive(persona: RevisionLabPersona) {
    if (busy) return;
    setBusy(persona.id);
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
    }
  }
  return (
    <Stack p={{ base: "5", md: "8" }} gap="6" w="full" maxW="5xl">
      <Flex align="center" justify="space-between" gap="3">
        <Heading as="h2" size="xl">
          Personas
        </Heading>
        <Badge colorPalette="gray">
          {personas.filter((persona) => !persona.archivedAt).length} active
        </Badge>
      </Flex>
      {canEdit && (
        <PersonaForm
          key={editing?.id ?? "new"}
          apiPath={apiPath}
          persona={editing}
          onCancel={() => setEditing(undefined)}
          onSaved={async () => {
            await onRefresh();
            setEditing(undefined);
            setNotice("Persona saved.");
          }}
        />
      )}
      {canEdit && <Separator />}
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      {notice && (
        <Text role="status" color="green.700" fontSize="sm">
          {notice}
        </Text>
      )}
      <Stack gap="0" aria-label="Saved personas">
        {personas.length === 0 && (
          <Text color="gray.600" py="6">
            No personas yet.
          </Text>
        )}
        {personas.map((persona) => (
          <Flex
            key={persona.id}
            as="article"
            aria-label={`Persona ${persona.name}`}
            py="4"
            gap="4"
            align="start"
            borderBottomWidth="1px"
            borderColor="gray.200"
            direction={{ base: "column", md: "row" }}
          >
            <Box flex="1" minW="0">
              <Flex gap="2" align="center" flexWrap="wrap">
                <Heading as="h3" size="md" overflowWrap="anywhere">
                  {persona.name}
                </Heading>
                {persona.archivedAt && (
                  <Badge colorPalette="gray">Archived</Badge>
                )}
              </Flex>
              {persona.description && (
                <Text
                  mt="2"
                  color="gray.600"
                  whiteSpace="pre-wrap"
                  overflowWrap="anywhere"
                >
                  {persona.description}
                </Text>
              )}
            </Box>
            {canEdit && (
              <Flex gap="2" flexShrink="0">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    setEditing(persona);
                    setNotice("");
                  }}
                >
                  <Icon>
                    <Pencil />
                  </Icon>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={busy === persona.id}
                  disabled={Boolean(busy)}
                  onClick={() => void archive(persona)}
                >
                  <Icon>
                    {persona.archivedAt ? <RotateCcw /> : <Archive />}
                  </Icon>
                  {persona.archivedAt ? "Restore" : "Archive"}
                </Button>
              </Flex>
            )}
          </Flex>
        ))}
      </Stack>
    </Stack>
  );
}
