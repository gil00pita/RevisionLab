import { Accordion, Field, Input, Stack, Text } from "@chakra-ui/react";

import { GeneralSettings } from "./GeneralSettings.js";

export function SetupIdentity({
  name,
  workspaceName,
  apiPath,
  projectName,
  onWorkspaceName,
  onBusyChange,
  email,
  systemUrl,
  local,
  disabled,
  onName,
  onEmail,
  onUrl,
}: {
  name: string;
  workspaceName: string;
  apiPath: string;
  projectName: string;
  onWorkspaceName: (value: string) => void;
  onBusyChange: (busy: boolean) => void;
  email: string;
  systemUrl: string;
  local: boolean;
  disabled: boolean;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
  onUrl: (value: string) => void;
}) {
  return (
    <Stack gap="5">
      <Text color="fg.muted">
        Add your owner details and the URL where you use RevisionLab. Access
        uses email login links.
      </Text>
      <Field.Root required disabled={disabled}>
        <Field.Label>
          Workspace name
          <Field.RequiredIndicator />
        </Field.Label>
        <Input
          name="workspaceName"
          value={workspaceName}
          required
          maxLength={100}
          onChange={(event) => onWorkspaceName(event.target.value)}
        />
        <Field.HelperText>
          The name shown in your workspace selector.
        </Field.HelperText>
      </Field.Root>
      <Field.Root required disabled={disabled}>
        <Field.Label>
          Your name
          <Field.RequiredIndicator />
        </Field.Label>
        <Input
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          value={name}
          onChange={(event) => onName(event.target.value)}
        />
      </Field.Root>
      <Field.Root required disabled={disabled}>
        <Field.Label>
          Email address
          <Field.RequiredIndicator />
        </Field.Label>
        <Input
          name="email"
          autoComplete="email"
          type="email"
          required
          readOnly={!local}
          maxLength={254}
          value={email}
          onChange={(event) => onEmail(event.target.value)}
        />
        <Field.HelperText>
          {local
            ? "Your owner email for passwordless access. Email delivery must be configured before sharing a hosted workspace."
            : "Your verified owner email."}
        </Field.HelperText>
      </Field.Root>
      <Field.Root required disabled={disabled}>
        <Field.Label>
          Live URL
          <Field.RequiredIndicator />
        </Field.Label>
        <Input
          name="systemUrl"
          type="url"
          required
          value={systemUrl}
          maxLength={2048}
          placeholder="https://your-prototype.example"
          onChange={(event) => onUrl(event.target.value)}
        />
        <Field.HelperText>
          Detected automatically when available. Include the port for localhost;
          use HTTPS for a deployed site.
        </Field.HelperText>
      </Field.Root>
      <Accordion.Root collapsible defaultValue={[]}>
        <Accordion.Item value="advanced">
          <Accordion.ItemTrigger>
            <Text flex="1">Advanced options</Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody px="0" pt="4">
              <GeneralSettings
                apiPath={apiPath}
                projectName={projectName}
                embedded
                disabled={disabled}
                onBusyChange={onBusyChange}
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}
