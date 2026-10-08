import { useState } from "react";
import { Button, Field, HStack, Input, Stack } from "@chakra-ui/react";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
export interface InstanceInput {
  name: string;
  url: string;
  apiKey: string;
  apiPath: string;
}
export function WorkspaceInstanceForm({
  instance,
  busy,
  onSave,
  onCancel,
}: {
  instance?: WorkspaceInstance;
  busy: boolean;
  onSave: (values: InstanceInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(instance?.name ?? "");
  const [url, setUrl] = useState(instance?.url ?? "");
  const [key, setKey] = useState("");
  const [path, setPath] = useState(instance?.apiPath ?? "/api/revisionlab");
  return (
    <Stack
      as="form"
      gap="4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({ name, url, apiKey: key, apiPath: path });
      }}
    >
      <Field.Root required>
        <Field.Label>Workspace name</Field.Label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          disabled={busy}
          placeholder="Staging prototype"
        />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Live URL</Field.Label>
        <Input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          maxLength={2000}
          disabled={busy}
          placeholder="https://prototype.example.com"
        />
        <Field.HelperText>
          Use the public HTTPS URL of another installation of this project.
        </Field.HelperText>
      </Field.Root>
      <Field.Root required>
        <Field.Label>API key</Field.Label>
        <Input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          autoComplete="new-password"
          maxLength={128}
          disabled={busy}
        />
        <Field.HelperText>
          Generate this in Settings → General on the source workspace.
        </Field.HelperText>
      </Field.Root>
      <Field.Root required>
        <Field.Label>API path</Field.Label>
        <Input
          value={path}
          onChange={(event) => setPath(event.target.value)}
          maxLength={200}
          disabled={busy}
        />
        <Field.HelperText>
          Keep the default unless the source installation uses a custom API
          path.
        </Field.HelperText>
      </Field.Root>
      <HStack flexWrap="wrap">
        <Button type="submit" colorPalette="blue" loading={busy} maxW="full" h="auto" minH="11" py="2" whiteSpace="normal">
          {instance ? "Update connection" : "Add workspace"}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel} minH="11">
          Cancel
        </Button>
      </HStack>
    </Stack>
  );
}
