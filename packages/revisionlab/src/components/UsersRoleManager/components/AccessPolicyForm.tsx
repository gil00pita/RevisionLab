import {
  Alert,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

export function AccessPolicyForm({
  rules,
  joinUrl,
  joinCode,
  busy,
  onRulesChange,
  onSave,
  onRotateCode,
}: {
  rules: string;
  joinUrl: string;
  joinCode: string;
  busy: string;
  onRulesChange: (value: string) => void;
  onSave: () => void;
  onRotateCode: () => void;
}) {
  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <Stack gap="4">
        <Heading as="h3" size="md">
          Access settings
        </Heading>
        <Field.Root disabled={Boolean(busy)}>
          <Field.Label>Allowed self-join emails</Field.Label>
          <Textarea
            rows={4}
            value={rules}
            onChange={(event) => onRulesChange(event.target.value)}
            placeholder={"@company.com\nperson@partner.com"}
          />
          <Field.HelperText>
            One domain beginning with @ or one complete email per line. An empty
            list denies self-join.
          </Field.HelperText>
        </Field.Root>
        <Flex gap="3" flexWrap="wrap">
          <Button
            type="submit"
            colorPalette="blue"
            loading={busy === "settings"}
          >
            Save access settings
          </Button>
          <Button
            type="button"
            variant="outline"
            loading={busy === "code"}
            onClick={onRotateCode}
          >
            Rotate workspace code
          </Button>
        </Flex>
        {joinUrl && (
          <Text fontSize="sm" color="gray.600">
            Join link: {" "}
            <Link href={joinUrl} color="blue.700">
              {joinUrl}
            </Link>
          </Text>
        )}
        {joinCode && (
          <Alert.Root status="warning">
            <Alert.Content>
              <Alert.Title>Copy this code now</Alert.Title>
              <Alert.Description overflowWrap="anywhere">
                {joinCode}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
      </Stack>
    </Box>
  );
}
