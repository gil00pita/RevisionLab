import {
  Alert,
  Box,
  Button,
  Code,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useReviewAccess } from "../hooks/useReviewAccess.js";

export function AccessForm({
  apiPath,
  basePath,
}: {
  apiPath: string;
  basePath: string;
}) {
  const access = useReviewAccess(apiPath, basePath);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (access.challenge) codeInput.current?.focus();
  }, [access.challenge]);

  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        void (access.challenge ? access.verifyCode() : access.requestCode());
      }}
    >
      <Stack gap="5">
        {access.challenge ? (
          <>
            <Stack gap="2">
              <Heading as="h2" size="md">
                Check your email
              </Heading>
              <Text fontSize="sm" color="gray.600" overflowWrap="anywhere">
                Enter the six-digit code for {access.email.trim()}.
              </Text>
            </Stack>
            <Field.Root required>
              <Field.Label>Verification code</Field.Label>
              <Input
                ref={codeInput}
                name="code"
                value={access.code}
                onChange={(event) =>
                  access.setCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                disabled={access.busy}
                fontSize="xl"
                letterSpacing="widest"
                h="12"
              />
              <Field.HelperText>
                Use the latest code sent to you.
              </Field.HelperText>
            </Field.Root>
            {access.challenge.devCode && (
              <Alert.Root status="info" variant="subtle">
                <Alert.Content>
                  <Alert.Title>Local development code</Alert.Title>
                  <Alert.Description>
                    Email is disabled on this local installation. Enter{" "}
                    <Code>{access.challenge.devCode}</Code> to test access.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}
          </>
        ) : (
          <>
            <Field.Root required>
              <Field.Label>Your name</Field.Label>
              <Input
                name="name"
                value={access.name}
                onChange={(event) => access.setName(event.target.value)}
                autoComplete="name"
                maxLength={100}
                disabled={access.busy}
              />
              <Field.HelperText>
                This name will appear beside your comments.
              </Field.HelperText>
            </Field.Root>
            <Field.Root required>
              <Field.Label>Email address</Field.Label>
              <Input
                type="email"
                name="email"
                value={access.email}
                onChange={(event) => access.setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                disabled={access.busy}
              />
              <Field.HelperText>
                Use the email address your invitation was sent to.
              </Field.HelperText>
            </Field.Root>
          </>
        )}
        {access.error && (
          <Alert.Root status="error" role="alert">
            <Alert.Content>
              <Alert.Description>{access.error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        {access.notice && (
          <Text role="status" fontSize="sm" color="blue.700">
            {access.notice}
          </Text>
        )}
        <Button
          type="submit"
          colorPalette="blue"
          loading={access.busy}
          loadingText={access.challenge ? "Verifying" : "Sending code"}
        >
          {access.challenge ? "Open review" : "Email me a code"}
        </Button>
        {access.challenge && (
          <Stack gap="1">
            <Button
              type="button"
              variant="ghost"
              disabled={access.busy}
              onClick={() => void access.requestCode()}
            >
              Send a new code
            </Button>
            <Button
              type="button"
              variant="plain"
              color="gray.600"
              disabled={access.busy}
              onClick={access.changeEmail}
            >
              Use a different email
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
