import { TicketSkeleton } from "./TicketSkeleton.js";
import { Badge, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import type { ReviewTicket } from "../../../feedback-review.js";
import { TicketEditor } from "./TicketEditor.js";

export function TicketDrafts({
  tickets,
  selected,
  editing,
  busy,
  apiPath,
  basePath,
  canEdit,
  onSelect,
  onSaved,
  onDirtyChange,
  onConflict,
  flowIds,
}: {
  tickets: ReviewTicket[];
  selected: string | null;
  editing: boolean;
  busy: boolean;
  apiPath: string;
  basePath: string;
  canEdit: boolean;
  onSelect: (id: string) => void;
  onSaved: (ticket: ReviewTicket) => void;
  onDirtyChange: (dirty: boolean) => void;
  onConflict: () => Promise<void>;
  flowIds: string[];
}) {
  const active = tickets.find((ticket) => ticket.id === selected) ?? tickets[0];
  const unavailableFlowIds = new Set(
    tickets.flatMap((ticket) =>
      ticket.evidence.flatMap((item) =>
        item.flowId && !flowIds.includes(item.flowId) ? [item.flowId] : [],
      ),
    ),
  );
  return (
    <Stack as="section" gap="4" minW="0">
      <Flex gap="3" align="center" justify="space-between">
        <Heading as="h2" size="lg">
          Ticket drafts
        </Heading>
        <Badge colorPalette="blue">{tickets.length}</Badge>
      </Flex>
      {busy && <TicketSkeleton />}
      {!tickets.length && !busy && (
        <Stack
          p="6"
          borderWidth="1px"
          borderColor="gray.300"
          rounded="lg"
          bg="gray.50"
          gap="2"
        >
          <Heading as="h3" size="md">
            Turn feedback into next steps
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Select feedback and ask Codex to consolidate related issues. Your
            editable drafts and linked evidence will live here.
          </Text>
        </Stack>
      )}
      <Stack gap="2" maxH="60" overflowY="auto" p="1">
        {tickets.map((ticket) => (
          <Button
            key={ticket.id}
            h="auto"
            p="3"
            justifyContent="start"
            whiteSpace="normal"
            textAlign="left"
            colorPalette="blue"
            variant={active?.id === ticket.id ? "subtle" : "outline"}
            aria-pressed={active?.id === ticket.id}
            disabled={busy || (editing && active?.id !== ticket.id)}
            onClick={() => onSelect(ticket.id)}
          >
            <Stack gap="1" align="start" minW="0">
              <Text overflowWrap="anywhere">{ticket.summary}</Text>
              <Text fontSize="xs" color="gray.600">
                {ticket.priority} ·{" "}
                {ticket.status === "fixed"
                  ? "Fixed"
                  : ticket.status === "ready"
                    ? "Ready for Jira"
                    : "Draft"}{" "}
                · {ticket.evidence.length} sources
              </Text>
            </Stack>
          </Button>
        ))}
      </Stack>
      {active && !busy && (
        <TicketEditor
          key={active.id}
          ticket={active}
          apiPath={apiPath}
          basePath={basePath}
          canEdit={canEdit && !busy}
          onSaved={onSaved}
          onDirtyChange={onDirtyChange}
          onConflict={onConflict}
          unavailableFlowIds={unavailableFlowIds}
        />
      )}
    </Stack>
  );
}
