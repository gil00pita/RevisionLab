import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  createListCollection,
  Field,
  Icon,
  Input,
  Link,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Circle, UsersRound } from "lucide-react";
import type { RevisionLabPersona } from "../../../server/types.js";
import type { useRecording } from "../hooks/useRecording.js";
import type { FlowNameConflict } from "../../../client/flow-name-conflicts.js";
import { ReplaceFlowConfirmation } from "./ReplaceFlowConfirmation.js";
import { apiRequest } from "../../../client/api.js";

export function RecordingSetup({
  recorder,
  personas,
  basePath,
  onStarted,
  apiPath,
}: {
  recorder: ReturnType<typeof useRecording>;
  personas: RevisionLabPersona[];
  basePath: string;
  onStarted?: () => void;
  apiPath: string;
}) {
  const [name, setName] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [conflicts, setConflicts] = useState<FlowNameConflict[] | null>(null);
  const [credentials, setCredentials] = useState<{
    personaId: string;
    username: string;
    password: string;
  } | null>(null);
  const [credentialError, setCredentialError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copied, setCopied] = useState("");
  const portal = useRef<HTMLDivElement>(null);
  const active = personas.filter((persona) => !persona.archivedAt);
  const selected = active.find((persona) => persona.id === personaId);
  const collection = createListCollection({
    items: active.map((persona) => ({
      value: persona.id,
      label: persona.name,
    })),
  });
  useEffect(() => {
    if (!selected?.hasCredentials) return;
    let active = true;
    void apiRequest<{ username: string; password: string }>(
      apiPath,
      `personas/${selected.id}/credentials`,
      { method: "POST", body: "{}" },
    )
      .then((value) => {
        if (active) setCredentials({ personaId: selected.id, ...value });
      })
      .catch((cause) => {
        if (active)
          setCredentialError(
            cause instanceof Error
              ? cause.message
              : "Could not open the persona test account.",
          );
      });
    return () => {
      active = false;
    };
  }, [apiPath, selected?.id, selected?.hasCredentials]);
  async function copyCredential(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(`${label} copied.`);
    } catch {
      setCredentialError(`Could not copy the ${label.toLowerCase()}.`);
    }
  }
  async function start(replaceFlowId?: string) {
    if (!selected) return;
    const result = await recorder.start(
      name.trim(),
      selected.id,
      replaceFlowId,
    );
    if (result === true) onStarted?.();
    else if (result && typeof result === "object")
      setConflicts(result.conflicts);
  }
  if (conflicts)
    return (
      <ReplaceFlowConfirmation
        key={JSON.stringify(conflicts)}
        name={name.trim()}
        conflicts={conflicts}
        busy={recorder.busy}
        onCancel={() => setConflicts(null)}
        onConfirm={(id) => void start(id)}
      />
    );
  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        void start();
      }}
    >
      <Stack gap="4" ref={portal}>
        <Field.Root required disabled={recorder.busy}>
          <Field.Label>
            Recording name
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            placeholder="e.g. Submit an application"
            bg="bg.panel"
          />
        </Field.Root>
        <Field.Root
          required
          disabled={recorder.busy || active.length === 0}
          invalid={Boolean(personaId && !selected)}
        >
          <Field.Label>
            Persona
            <Field.RequiredIndicator />
          </Field.Label>
          <Select.Root
            collection={collection}
            value={selected ? [selected.id] : []}
            onValueChange={(event) => {
              setPersonaId(event.value[0] ?? "");
              setCredentials(null);
              setCredentialError("");
              setPasswordVisible(false);
              setCopied("");
            }}
            disabled={recorder.busy || active.length === 0}
            positioning={{ strategy: "fixed", hideWhenDetached: true }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger minW="0">
                <Select.ValueText placeholder="Choose a persona" truncate />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal container={portal}>
              <Select.Positioner data-revisionlab-ui color="fg" colorPalette="blue" zIndex="popover">
                <Select.Content>
                  {collection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Select.ItemText overflowWrap="anywhere">
                        {item.label}
                      </Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          {selected?.description && (
            <Field.HelperText overflowWrap="anywhere">
              {selected.description}
            </Field.HelperText>
          )}
          <Field.ErrorText>
            This persona is no longer available. Choose another.
          </Field.ErrorText>
        </Field.Root>
        {active.length === 0 && (
          <Text color="fg.muted" fontSize="sm">
            No active personas yet.
          </Text>
        )}
        {selected?.hasCredentials && credentials?.personaId === selected.id && (
          <Alert.Root status="info" data-revisionlab-ui="persona-credentials">
            <Alert.Content>
              <Alert.Title>Test account for {selected.name}</Alert.Title>
              <Alert.Description>
                <Stack gap="2" mt="2">
                  <Text fontSize="sm">
                    Username:{" "}
                    <Text as="span" fontWeight="semibold">
                      {credentials.username}
                    </Text>
                  </Text>
                  <Text fontSize="sm">
                    Password:{" "}
                    <Text as="span" fontWeight="semibold">
                      {passwordVisible ? credentials.password : "••••••••"}
                    </Text>
                  </Text>
                  <Box>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      mr="2"
                      onClick={() => setPasswordVisible((value) => !value)}
                    >
                      {passwordVisible ? "Hide password" : "Reveal password"}
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      mr="2"
                      onClick={() =>
                        void copyCredential("Username", credentials.username)
                      }
                    >
                      Copy username
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        void copyCredential("Password", credentials.password)
                      }
                    >
                      Copy password
                    </Button>
                  </Box>
                  {copied && (
                    <Text role="status" fontSize="xs">
                      {copied}
                    </Text>
                  )}
                </Stack>
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        {credentialError && (
          <Text role="alert" color="red.fg" fontSize="sm">
            {credentialError}
          </Text>
        )}
        <Link
          href={`${basePath}?view=personas`}
          target="_blank"
          rel="noopener noreferrer"
          color="blue.fg"
          fontSize="sm"
          alignSelf="start"
        >
          <Icon>
            <UsersRound />
          </Icon>
          Manage personas
        </Link>
        <Button
          type="submit"
          colorPalette="blue"
          loading={recorder.busy}
          disabled={!name.trim() || !selected || recorder.busy}
        >
          <Icon>
            <Circle />
          </Icon>
          Start recording
        </Button>
      </Stack>
    </Box>
  );
}
