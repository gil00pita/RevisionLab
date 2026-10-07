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
import { Archive, KeyRound, Pencil, RotateCcw } from "lucide-react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";
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
  const [inlineEditing, setInlineEditing] = useState<RevisionLabPersona | undefined>();
  const editing = editor ? editor.form?.persona : inlineEditing;
  const formOpen = editor ? editor.form !== null : true;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const actionsDisabled = Boolean(busy) || Boolean(editor?.disabled);
  function closeEditor() {
    if (editor) editor.onChange(null);
    else setInlineEditing(undefined);
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
  return (
    <Stack p={{ base: "5", md: "8" }} gap="6" w="full" maxW="5xl">
      <Flex align="center" justify="space-between" gap="3" flexWrap="wrap" minW="0">
        <Heading as="h2" size="xl">
          Personas
        </Heading>
        <Badge colorPalette="gray" whiteSpace="normal" overflowWrap="anywhere">
          {personas.filter((persona) => !persona.archivedAt).length} active
        </Badge>
      </Flex>
      {canEdit && formOpen && (
        <PersonaForm
          onBusyChange={onBusyChange}
          key={editing?.id ?? "new"}
          apiPath={apiPath}
          persona={editing}
          onCancel={closeEditor}
          cancelable={Boolean(editor)}
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
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      {notice && (
        <Text role="status" color="green.700" fontSize="sm">
          {notice}
        </Text>
      )}
      <Stack as="section" gap="0" aria-label="Saved personas">
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
                {persona.hasCredentials && (
                  <Badge colorPalette="blue">Test account configured</Badge>
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
              <Flex gap="2" flexShrink="0" flexWrap="wrap" maxW="full" minW="0">
                <Button
                  size="sm"
                  minH="11"
                  h="auto"
                  py="2"
                  maxW="full"
                  whiteSpace="normal"
                  variant="ghost"
                  disabled={actionsDisabled}
                  onClick={() => {
                    if (editor) editor.onChange({ persona });
                    else setInlineEditing(persona);
                    setNotice("");
                  }}
                >
                  <Icon>
                    <Pencil />
                  </Icon>
                  Edit
                </Button>
                {canManageCredentials && persona.hasCredentials && (
                  <Button
                    size="sm"
                    minH="11"
                    h="auto"
                    py="2"
                    maxW="full"
                    whiteSpace="normal"
                    variant="outline"
                    colorPalette="red"
                    disabled={actionsDisabled}
                    onClick={() =>
                      void (async () => {
                        setBusy(persona.id);
                        onBusyChange?.(true);
                        setError("");
                        setNotice("");
                        try {
                          await apiRequest(
                            apiPath,
                            `personas/${persona.id}/credentials`,
                            { method: "DELETE", body: "{}" },
                          );
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
                      })()
                    }
                  >
                    <Icon>
                      <KeyRound />
                    </Icon>
                    Remove account
                  </Button>
                )}
                <Button
                  size="sm"
                  minH="11"
                  h="auto"
                  py="2"
                  maxW="full"
                  whiteSpace="normal"
                  variant="outline"
                  loading={busy === persona.id}
                  disabled={actionsDisabled}
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
