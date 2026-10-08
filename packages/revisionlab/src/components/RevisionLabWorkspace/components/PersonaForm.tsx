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
  onBusyChange,
  apiPath,
  persona,
  onSaved,
  onCancel,
  canManageCredentials,
  cancelable = false,
}: {
  onBusyChange?: (busy: boolean) => void;
  apiPath: string;
  persona?: RevisionLabPersona;
  onSaved: () => Promise<void>;
  onCancel: () => void;
  canManageCredentials: boolean;
  cancelable?: boolean;
}) {
  const [name, setName] = useState(persona?.name ?? "");
  const [description, setDescription] = useState(persona?.description ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function save() {
    if (!name.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const result = await apiRequest<{ id: string }>(
        apiPath,
        persona ? `personas/${persona.id}` : "personas",
        {
          method: persona ? "PATCH" : "POST",
          body: JSON.stringify({ name, description }),
        },
      );
      const personaId = persona?.id ?? result.id;
      if (canManageCredentials && (username || password)) {
        if (!username || !password)
          throw new Error("Enter both a test username and password.");
        await apiRequest(apiPath, `personas/${personaId}/credentials`, {
          method: "PATCH",
          body: JSON.stringify({ username, password }),
        });
      }
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
      onBusyChange?.(false);
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
            autoFocus={cancelable}
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
        {canManageCredentials && (
          <Stack
            gap="3"
            borderWidth="1px"
            borderColor="border"
            rounded="md"
            p="4"
          >
            <Heading as="h4" size="sm">
              Synthetic test account
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Leave both fields blank to keep the existing account unchanged.
              These credentials are encrypted and excluded from captures and
              exports.
            </Text>
            <Field.Root disabled={busy}>
              <Field.Label>Prototype username</Field.Label>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="off"
                maxLength={254}
              />
            </Field.Root>
            <Field.Root disabled={busy}>
              <Field.Label>Prototype password</Field.Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                maxLength={1024}
              />
            </Field.Root>
          </Stack>
        )}
        {error && (
          <Text role="alert" color="red.fg">
            {error}
          </Text>
        )}
        <Flex gap="2" flexWrap="wrap">
          <Button
            type="submit"
            size="sm"
            minH="11"
            h="auto"
            py="2"
            maxW="full"
            whiteSpace="normal"
            colorPalette="blue"
            loading={busy}
            disabled={!name.trim() || busy}
          >
            <Icon>{persona ? <Save /> : <Plus />}</Icon>
            {persona ? "Save persona" : "Add persona"}
          </Button>
          {(persona || cancelable) && (
            <Button
              size="sm"
              minH="11"
              h="auto"
              py="2"
              maxW="full"
              whiteSpace="normal"
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
