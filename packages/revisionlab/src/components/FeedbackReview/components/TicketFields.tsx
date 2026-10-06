import { Button, Field, Flex, Input, Stack, Textarea } from "@chakra-ui/react";
import type { ReviewTicketFields } from "../../../feedback-review.js";

export function TicketFields({
  fields,
  disabled,
  onChange,
}: {
  fields: ReviewTicketFields;
  disabled: boolean;
  onChange: (fields: ReviewTicketFields) => void;
}) {
  return (
    <Stack gap="4">
      <Field.Root required>
        <Field.Label>Ticket summary</Field.Label>
        <Input
          value={fields.summary}
          maxLength={255}
          readOnly={disabled}
          borderColor="gray.500"
          onChange={(event) =>
            onChange({ ...fields, summary: event.target.value })
          }
        />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Ticket description</Field.Label>
        <Textarea
          rows={6}
          value={fields.description}
          maxLength={20_000}
          readOnly={disabled}
          borderColor="gray.500"
          onChange={(event) =>
            onChange({ ...fields, description: event.target.value })
          }
        />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Acceptance criteria</Field.Label>
        <Textarea
          rows={4}
          value={fields.acceptanceCriteria}
          maxLength={10_000}
          readOnly={disabled}
          borderColor="gray.500"
          onChange={(event) =>
            onChange({ ...fields, acceptanceCriteria: event.target.value })
          }
        />
      </Field.Root>
      <Stack gap="2">
        <Flex
          role="group"
          aria-label="Suggested priority"
          gap="2"
          align="center"
          flexWrap="wrap"
        >
          {(["High", "Medium", "Low"] as const).map((priority) => (
            <Button
              key={priority}
              size="sm"
              variant={priority === fields.priority ? "solid" : "outline"}
              colorPalette="blue"
              aria-pressed={priority === fields.priority}
              disabled={disabled}
              onClick={() => onChange({ ...fields, priority })}
            >
              {priority} priority
            </Button>
          ))}
        </Flex>
        <Flex role="group" aria-label="Ticket status" gap="2" flexWrap="wrap">
          {(["draft", "ready", "fixed"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === fields.status ? "solid" : "outline"}
              colorPalette="blue"
              aria-pressed={status === fields.status}
              disabled={disabled}
              onClick={() => onChange({ ...fields, status })}
            >
              {status === "fixed"
                ? "Fixed"
                : status === "draft"
                  ? "Draft"
                  : "Ready for Jira"}
            </Button>
          ))}
        </Flex>
      </Stack>
    </Stack>
  );
}
