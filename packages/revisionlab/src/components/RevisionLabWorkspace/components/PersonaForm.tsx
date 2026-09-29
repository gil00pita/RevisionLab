import { useRef, useState } from "react";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Plus, Save, X } from "lucide-react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";

export function PersonaForm({
  apiPath,
  persona,
  onSaved,
  onCancel,
}: {
  apiPath: string;
  persona?: RevisionLabPersona;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(persona?.name ?? "");
  const [description, setDescription] = useState(persona?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function save() {
    if (!name.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest(
        apiPath,
        persona ? `personas/${persona.id}` : "personas",
        {
          method: persona ? "PATCH" : "POST",
          body: JSON.stringify({ name, description }),
        },
      );
      await onSaved();
      setName("");
      setDescription("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the persona.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      maxW="2xl"
    >
      <Stack gap="4">
        <Heading as="h3" size="md">
          {persona ? "Edit persona" : "New persona"}
        </Heading>
        <Field.Root required disabled={busy}>
          <Field.Label>
            Persona name
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. First-time customer"
          />
        </Field.Root>
        <Field.Root disabled={busy}>
          <Field.Label>Description</Field.Label>
          <Textarea
            value={description}
            maxLength={1000}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Role, goals, or relevant context"
          />
        </Field.Root>
        {error && (
          <Text role="alert" color="red.700">
            {error}
          </Text>
        )}
        <Flex gap="2">
          <Button
            type="submit"
            size="sm"
            colorPalette="blue"
            loading={busy}
            disabled={!name.trim() || busy}
          >
            <Icon>{persona ? <Save /> : <Plus />}</Icon>
            {persona ? "Save persona" : "Add persona"}
          </Button>
          {persona && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
            >
              <Icon>
                <X />
              </Icon>
              Cancel
            </Button>
          )}
        </Flex>
      </Stack>
    </Box>
  );
}
