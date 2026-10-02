import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Link,
  NativeSelect,
  Stack,
} from "@chakra-ui/react";
import type { RevisionLabRole } from "../../../server/types.js";

export function AddMemberForm({
  email,
  role,
  busy,
  devLoginUrl,
  onEmailChange,
  onRoleChange,
  onSubmit,
}: {
  email: string;
  role: RevisionLabRole;
  busy: string;
  devLoginUrl: string;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: RevisionLabRole) => void;
  onSubmit: () => void;
}) {
  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Stack gap="4">
        <Heading as="h3" size="md">
          Add a member
        </Heading>
        <Flex gap="3" align="end" direction={{ base: "column", md: "row" }}>
          <Field.Root required disabled={Boolean(busy)} flex="1">
            <Field.Label>
              Email address
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </Field.Root>
          <Field.Root
            required
            disabled={Boolean(busy)}
            maxW={{ base: "full", md: "52" }}
          >
            <Field.Label>Role</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={role}
                onChange={(event) =>
                  onRoleChange(event.target.value as RevisionLabRole)
                }
              >
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <Button
            type="submit"
            colorPalette="blue"
            loading={busy === "add"}
            disabled={!email.trim()}
          >
            Add member
          </Button>
        </Flex>
        {devLoginUrl && (
          <Link href={devLoginUrl} color="blue.700">
            Open local login link
          </Link>
        )}
      </Stack>
    </Box>
  );
}
