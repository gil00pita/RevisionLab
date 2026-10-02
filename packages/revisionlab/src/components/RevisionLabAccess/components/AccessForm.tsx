import {
  Alert,
  Box,
  Button,
  Field,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useReviewAccess } from "../hooks/useReviewAccess.js";

export function AccessForm({
  apiPath,
  basePath,
}: {
  apiPath: string;
  basePath: string;
}) {
  const access = useReviewAccess(apiPath, basePath);
  const consuming = Boolean(access.loginToken);
  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        void (consuming ? access.consumeLink() : access.requestLink());
      }}
    >
      <Stack gap="5">
        {!consuming && (
          <Field.Root required disabled={access.busy}>
            <Field.Label>
              Your name
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              name="name"
              value={access.name}
              onChange={(event) => access.setName(event.target.value)}
              autoComplete="name"
              maxLength={120}
            />
            <Field.HelperText>
              This name appears beside your comments.
            </Field.HelperText>
          </Field.Root>
        )}
        {!consuming && !access.requested && (
          <>
            <Field.Root required disabled={access.busy}>
              <Field.Label>
                Email address
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="email"
                name="email"
                value={access.email}
                onChange={(event) => access.setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
              />
            </Field.Root>
            <Field.Root disabled={access.busy}>
              <Field.Label>Workspace code</Field.Label>
              <Input
                name="joinCode"
                value={access.joinCode}
                onChange={(event) => access.setJoinCode(event.target.value)}
                autoComplete="off"
                maxLength={128}
              />
              <Field.HelperText>
                Required when joining; existing and manually added members can
                leave it blank.
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
        {access.devLoginUrl && (
          <Link href={access.devLoginUrl} color="blue.700" fontWeight="medium">
            Open local login link
          </Link>
        )}
        {consuming && !access.error && (
          <Text role="status" color="gray.600">
            Signing you in…
          </Text>
        )}
        {!access.requested && !consuming && (
          <Button
            type="submit"
            colorPalette="blue"
            loading={access.busy}
            disabled={!access.name.trim() || !access.email.trim()}
          >
            Email me a login link
          </Button>
        )}
      </Stack>
    </Box>
  );
}
