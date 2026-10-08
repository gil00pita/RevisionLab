import { Field, Input, Stack, Text } from "@chakra-ui/react";

export function SetupIdentity({
  name,
  email,
  systemUrl,
  local,
  disabled,
  onName,
  onEmail,
  onUrl,
}: {
  name: string;
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
    </Stack>
  );
}
