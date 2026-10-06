import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Flex,
  Heading,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { ApiError, apiRequest } from "../../../client/api.js";
import {
  ticketText,
  type ReviewTicket,
  type ReviewTicketFields,
} from "../../../feedback-review.js";
import { EvidenceSources } from "./EvidenceSources.js";
import { TicketFields } from "./TicketFields.js";

function editable(ticket: ReviewTicket): ReviewTicketFields {
  const { summary, description, acceptanceCriteria, priority, status } = ticket;
  return { summary, description, acceptanceCriteria, priority, status };
}

export function TicketEditor({
  ticket,
  apiPath,
  basePath,
  canEdit,
  onSaved,
  onDirtyChange,
  onConflict,
  unavailableFlowIds,
}: {
  ticket: ReviewTicket;
  apiPath: string;
  basePath: string;
  canEdit: boolean;
  onSaved: (ticket: ReviewTicket) => void;
  onDirtyChange: (dirty: boolean) => void;
  onConflict: () => Promise<void>;
  unavailableFlowIds: Set<string>;
}) {
  const [baseline, setBaseline] = useState(ticket);
  const [fields, setFields] = useState(() => editable(ticket));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [copyFallback, setCopyFallback] = useState(false);
  const dirty = JSON.stringify(fields) !== JSON.stringify(editable(baseline));
  const latestChanged = ticket.revision !== baseline.revision;
  useEffect(() => {
    onDirtyChange(dirty || saving);
    const preventLeave = (event: BeforeUnloadEvent) => {
      if (dirty || saving) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", preventLeave);
    return () => {
      window.removeEventListener("beforeunload", preventLeave);
      onDirtyChange(false);
    };
  }, [dirty, saving, onDirtyChange]);

  const value = { ...baseline, ...fields };
  const formatted = ticketText(
    value,
    typeof window === "undefined"
      ? basePath
      : new URL(basePath, window.location.origin).toString(),
  );

  async function save() {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const result = await apiRequest<ReviewTicket>(
        apiPath,
        `feedback-review/${ticket.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ ...fields, revision: baseline.revision }),
        },
      );
      setBaseline(result);
      setFields(editable(result));
      onSaved(result);
      setStatus("Ticket draft saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Your edits are retained.",
      );
      if (cause instanceof ApiError && cause.status === 409) await onConflict();
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    setError("");
    setStatus("");
    try {
      await navigator.clipboard.writeText(formatted);
      setStatus(
        dirty
          ? "Copied with unsaved edits. Paste into Jira; save your changes here when ready."
          : "Copied. Paste into Jira.",
      );
    } catch {
      setCopyFallback(true);
      setError(
        "Clipboard access is unavailable. Select and copy the Jira-ready text below.",
      );
    }
  }

  function discard() {
    setBaseline(ticket);
    setFields(editable(ticket));
    setError("");
    setStatus("Saved draft reloaded.");
  }

  return (
    <Stack
      gap="4"
      p="5"
      borderWidth="1px"
      borderColor="gray.300"
      rounded="lg"
      minW="0"
    >
      <Text fontSize="sm" color="gray.600">
        Review the suggested priority and criteria, then copy into Jira. No
        external ticket has been created.
      </Text>
      <TicketFields
        fields={fields}
        disabled={!canEdit || saving}
        onChange={(next) => {
          setFields(next);
          setStatus("");
        }}
      />
      <Text fontSize="sm" color="gray.600">
        {fields.status === "fixed"
          ? "Saving Fixed hides linked comments from active review. Their screenshots and discussion stay attached here."
          : "Choose Fixed after verifying the work. Reopening a fixed ticket restores eligible comments."}
      </Text>
      {ticket.template && (
        <Text fontSize="xs" color="gray.600">
          Generated with template: {ticket.template.name}
        </Text>
      )}
      {latestChanged && (
        <Text color="orange.800" fontSize="sm">
          A newer saved draft is available. Copy your edits before reloading it.
        </Text>
      )}
      <Flex gap="2" flexWrap="wrap">
        {canEdit && (
          <Button
            colorPalette="blue"
            disabled={
              !dirty ||
              !fields.summary.trim() ||
              !fields.description.trim() ||
              !fields.acceptanceCriteria.trim()
            }
            loading={saving}
            onClick={() => void save()}
          >
            Save draft
          </Button>
        )}
        <Button variant="outline" onClick={() => void copy()}>
          Copy ticket for Jira
        </Button>
        {(dirty || latestChanged) && (
          <Button variant="ghost" disabled={saving} onClick={discard}>
            {latestChanged ? "Reload saved draft" : "Discard edits"}
          </Button>
        )}
      </Flex>
      <Text role="status" fontSize="sm" color="gray.600">
        {dirty ? "Unsaved edits. " : ""}
        {status}
      </Text>
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      {copyFallback && (
        <Field.Root>
          <Field.Label>Jira-ready text (manual copy)</Field.Label>
          <Textarea
            rows={12}
            readOnly
            value={formatted}
            borderColor="gray.500"
            onFocus={(event) => event.target.select()}
          />
        </Field.Root>
      )}
      <Heading as="h3" size="md">
        Linked evidence · {ticket.evidence.length} sources
      </Heading>
      {ticket.notes && (
        <Text whiteSpace="pre-wrap" fontSize="sm" overflowWrap="anywhere">
          Reviewer notes: {ticket.notes}
        </Text>
      )}
      <Stack maxH="sm" overflowY="auto" p="1">
        <EvidenceSources
          evidence={ticket.evidence}
          basePath={basePath}
          unavailableFlowIds={unavailableFlowIds}
        />
      </Stack>
    </Stack>
  );
}
