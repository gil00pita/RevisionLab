import {
  Box,
  Button,
  Field,
  Input,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

interface InvitationValues {
  email: string | null;
  role: "commenter" | "editor";
  expiresInDays: number;
}

export function InvitationForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (values: InvitationValues) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"commenter" | "editor">("commenter");
  const [days, setDays] = useState("7");

  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          email: email.trim() || null,
          role,
          expiresInDays: Number(days),
        });
      }}
    >
      <Stack gap="5">
        <Field.Root>
          <Field.Label>
            Reviewer email{" "}
            <Text as="span" color="gray.600" fontWeight="normal">
              (optional)
            </Text>
          </Field.Label>
          <Input
            name="reviewerEmail"
            type="email"
            placeholder="reviewer@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            maxLength={254}
          />
          <Field.HelperText>
            Leave blank to create a link anyone can use after verifying their
            email.
          </Field.HelperText>
        </Field.Root>
        <RadioGroup.Root
          name="reviewerRole"
          value={role}
          onValueChange={(event) =>
            setRole(event.value === "editor" ? "editor" : "commenter")
          }
          disabled={busy}
          colorPalette="blue"
        >
          <RadioGroup.Label fontWeight="medium" fontSize="sm" mb="2">
            Review permissions
          </RadioGroup.Label>
          <Stack gap="3">
            <RadioGroup.Item value="commenter" alignItems="start">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator mt="0.5" />
              <Stack gap="0">
                <RadioGroup.ItemText fontWeight="medium">
                  Commenter
                </RadioGroup.ItemText>
                <Text color="gray.600" fontSize="sm">
                  View screens and add feedback.
                </Text>
              </Stack>
            </RadioGroup.Item>
            <RadioGroup.Item value="editor" alignItems="start">
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemIndicator mt="0.5" />
              <Stack gap="0">
                <RadioGroup.ItemText fontWeight="medium">
                  Editor
                </RadioGroup.ItemText>
                <Text color="gray.600" fontSize="sm">
                  Record flows, capture screens, and manage feedback.
                </Text>
              </Stack>
            </RadioGroup.Item>
          </Stack>
        </RadioGroup.Root>
        <Field.Root required maxW="48">
          <Field.Label>Expires after (days)</Field.Label>
          <Input
            name="expiresInDays"
            type="number"
            min={1}
            max={30}
            step={1}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            disabled={busy}
          />
          <Field.HelperText>Between 1 and 30 days.</Field.HelperText>
        </Field.Root>
        <Button
          type="submit"
          alignSelf="start"
          colorPalette="blue"
          loading={busy}
          loadingText="Creating invitation"
        >
          Create invitation link
        </Button>
      </Stack>
    </Box>
  );
}
