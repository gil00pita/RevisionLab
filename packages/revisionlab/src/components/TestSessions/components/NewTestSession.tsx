import { useState } from "react";
import {
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Link,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { RevisionLabPersona } from "../../../server/types.js";
import { apiRequest } from "../../../client/api.js";

export function NewTestSession({
  apiPath,
  personas,
  onCreated,
  onCancel,
}: {
  apiPath: string;
  personas: RevisionLabPersona[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("Prototype test");
  const [route, setRoute] = useState("/");
  const [personaId, setPersonaId] = useState("");
  const [minutes, setMinutes] = useState("15");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ url: string }>(
        apiPath,
        "test-sessions",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            route,
            personaId,
            maxMinutes: Number(minutes),
          }),
        },
      );
      setUrl(result.url);
      onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create the test.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage("Select the link above and copy it manually.");
    }
  }
  return (
    <Stack
      gap="4"
      p="5"
      borderWidth="1px"
      borderColor="blue.200"
      bg="blue.50"
      borderRadius="lg"
      maxW="2xl"
    >
      <Heading as="h2" size="md">
        {url ? "Your test link is ready" : "New test session"}
      </Heading>
      {url ? (
        <>
          <Field.Root>
            <Field.Label>Participant URL</Field.Label>
            <Input
              readOnly
              value={url}
              onFocus={(event) => event.target.select()}
              bg="white"
            />
            <Field.HelperText>
              Share this single-use link with your participant. Unused links
              expire in 24 hours. Keep this URL: it is only shown here.
            </Field.HelperText>
          </Field.Root>
          <Flex gap="2" flexWrap="wrap">
            <Button onClick={() => void copy()}>Copy link</Button>
            <Button asChild variant="outline">
              <Link href={url} target="_blank" rel="noreferrer">
                Open test
              </Link>
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Done
            </Button>
          </Flex>
          {message && <Text role="status">{message}</Text>}
        </>
      ) : (
        <>
          <Field.Root required>
            <Field.Label>Session name</Field.Label>
            <Input
              autoFocus
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              bg="white"
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>Prototype start path</Field.Label>
            <Input
              value={route}
              onChange={(event) => setRoute(event.target.value)}
              placeholder="/"
              bg="white"
            />
            <Field.HelperText>
              A path on this prototype, such as /checkout.
            </Field.HelperText>
          </Field.Root>
          <Field.Root required>
            <Field.Label>Persona</Field.Label>
            <NativeSelect.Root bg="white">
              <NativeSelect.Field
                value={personaId}
                onChange={(event) => setPersonaId(event.target.value)}
              >
                <option value="">Choose a persona</option>
                {personas
                  .filter(
                    (persona) =>
                      !persona.archivedAt &&
                      (!persona.workspace || persona.workspace.id === "local"),
                  )
                  .map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Field.HelperText>
              Add a persona in Personas if this list is empty.
            </Field.HelperText>
          </Field.Root>
          <Field.Root required>
            <Field.Label>Maximum test time (minutes)</Field.Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              bg="white"
            />
            <Field.HelperText>
              1–120 minutes, starting when the participant clicks Start. The
              test ends automatically.
            </Field.HelperText>
          </Field.Root>
          <Flex gap="2" flexWrap="wrap">
            <Button
              minH="11"
              h="auto"
              py="2"
              maxW="full"
              whiteSpace="normal"
              onClick={() => void create()}
              loading={busy}
              disabled={
                !name.trim() ||
                !personaId ||
                Number(minutes) < 1 ||
                Number(minutes) > 120
              }
            >
              Create test link
            </Button>
            <Button minH="11" h="auto" py="2" maxW="full" whiteSpace="normal" variant="ghost" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
          </Flex>
        </>
      )}
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
    </Stack>
  );
}
