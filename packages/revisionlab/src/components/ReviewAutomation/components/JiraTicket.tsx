import { useState } from "react";
import {
  Button,
  Field,
  Flex,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { jiraDraft, type FeedbackContext } from "../../../review-automation.js";

export function JiraTicket({
  context,
  reviewUrl,
}: {
  context: FeedbackContext;
  reviewUrl: string;
}) {
  const [draft, setDraft] = useState(() => jiraDraft(context, reviewUrl));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function copy(value: string) {
    setStatus("");
    setError("");
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied. Paste into Jira.");
    } catch {
      setError(
        "Clipboard access is unavailable. Select and copy the text from the fields below.",
      );
    }
  }
  return (
    <Stack gap="4">
      <Text color="gray.600" fontSize="sm">
        Review and edit this draft, then copy it into Jira. No ticket has been
        created.
      </Text>
      <Field.Root>
        <Field.Label>Ticket summary</Field.Label>
        <Input
          value={draft.summary}
          maxLength={255}
          onChange={(event) => {
            setDraft({ ...draft, summary: event.target.value });
            setStatus("");
          }}
          borderColor="gray.500"
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Ticket description</Field.Label>
        <Textarea
          rows={15}
          value={draft.description}
          onChange={(event) => {
            setDraft({ ...draft, description: event.target.value });
            setStatus("");
          }}
          resize="vertical"
          borderColor="gray.500"
        />
      </Field.Root>
      <Flex gap="2" flexWrap="wrap">
        <Button
          colorPalette="blue"
          onClick={() => void copy(`${draft.summary}\n\n${draft.description}`)}
        >
          Copy ticket
        </Button>
        <Button variant="outline" onClick={() => void copy(draft.summary)}>
          Copy summary
        </Button>
        <Button variant="outline" onClick={() => void copy(draft.description)}>
          Copy description
        </Button>
      </Flex>
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      <Text role="status" color="gray.600" fontSize="sm">
        {status}
      </Text>
    </Stack>
  );
}
