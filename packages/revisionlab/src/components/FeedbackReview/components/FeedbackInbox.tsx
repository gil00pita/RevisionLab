import { useRef, useState } from "react";
import { Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import {
  groupEvidence,
  type EvidenceKind,
  type ReviewEvidence,
  type ReviewTicket,
  type TicketTemplate,
} from "../../../feedback-review.js";
import { FeedbackFilters } from "./FeedbackFilters.js";
import { FeedbackSortControl } from "./FeedbackSortControl.js";
import { FeedbackTimeline } from "./FeedbackTimeline.js";
import { sortFeedbackTimeline, type FeedbackSort } from "../timeline.js";
import { TicketGeneration } from "./TicketGeneration.js";
import type { RevisionLabPersona } from "../../../server/types.js";

export function FeedbackInbox({
  evidence,
  tickets,
  basePath,
  apiPath,
  personas,
  canGenerate,
  busy,
  editing,
  onGenerate,
  onCancel,
  templates,
  canEdit,
  onAddTemplate,
  onTemplateDirtyChange,
  templateError,
}: {
  evidence: ReviewEvidence[];
  tickets: ReviewTicket[];
  basePath: string;
  apiPath: string;
  personas: RevisionLabPersona[];
  canGenerate: boolean;
  busy: boolean;
  editing: boolean;
  onGenerate: (
    ids: string[],
    notes: string,
    templateId: string,
  ) => Promise<boolean>;
  onCancel: () => void;
  templates: TicketTemplate[];
  canEdit: boolean;
  onAddTemplate: (
    name: string,
    markdown: string,
  ) => Promise<TicketTemplate | null>;
  onTemplateDirtyChange: (dirty: boolean) => void;
  templateError?: string;
}) {
  const [filter, setFilter] = useState<"all" | EvidenceKind>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<FeedbackSort>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const inbox = useRef<HTMLDivElement>(null);
  const groups = groupEvidence(evidence);
  const entries = sortFeedbackTimeline(
    groups.filter(
      (group) =>
        (filter === "all" || group.kind === filter) &&
        `${group.title} ${group.evidence.map((item) => `${item.route} ${item.flowName ?? ""} ${item.body}`).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
    tickets,
    sort,
  );
  const visible = entries.map((entry) => entry.group);
  const ids = evidence
    .filter((item) => selected.has(item.id))
    .map((item) => item.id);
  const covered = new Set(
    tickets.flatMap((ticket) => ticket.evidence.map((item) => item.id)),
  );
  const duplicates = ids.filter((id) => covered.has(id)).length;
  const disabled = busy || !canEdit;

  function clearSelection() {
    setSelected(new Set());
    requestAnimationFrame(() => {
      const next =
        inbox.current?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        ) ?? inbox.current?.querySelector<HTMLInputElement>("input");
      next?.focus({ preventScroll: true });
    });
  }

  return (
    <Stack
      ref={inbox}
      as="section"
      gap="4"
      minW="0"
      minH={{ base: "auto", lg: "calc(100dvh - 12rem)" }}
    >
      <Flex justify="space-between" align="center" gap="3" flexWrap="wrap">
        <Heading as="h2" size="lg">
          Feedback inbox
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          {visible.length} of {groups.length} group
          {groups.length === 1 ? "" : "s"}
        </Text>
      </Flex>
      <Text color="fg.muted" fontSize="sm">
        Repeated comments stay together. Select related feedback to turn it into
        shared tickets. Fixed tickets hide their linked feedback; their evidence
        stays in the ticket.
      </Text>
      <FeedbackFilters
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
      />
      <Flex gap="2" align="center" flexWrap="wrap" justify="space-between">
        <FeedbackSortControl value={sort} onChange={setSort} />
        <Flex gap="2" align="center" flexWrap="wrap">
          <Text fontSize="sm" fontWeight="medium">
            {ids.length} source{ids.length === 1 ? "" : "s"} selected
          </Text>
          <Button
            size="xs"
            variant="ghost"
            disabled={disabled || visible.length === 0}
            onClick={() =>
              setSelected(
                new Set([
                  ...selected,
                  ...visible.flatMap((group) =>
                    group.evidence.map((item) => item.id),
                  ),
                ]),
              )
            }
          >
            Select visible
          </Button>
          {visible.reduce((count, group) => count + group.evidence.length, 0) >
            50 && (
            <Button
              size="xs"
              variant="ghost"
              disabled={disabled}
              onClick={() =>
                setSelected(
                  new Set(
                    visible
                      .flatMap((group) => group.evidence.map((item) => item.id))
                      .slice(0, 50),
                  ),
                )
              }
            >
              Select first 50 visible
            </Button>
          )}
        </Flex>
      </Flex>
      <FeedbackTimeline
        apiPath={apiPath}
        personas={personas}
        entries={entries}
        hasEvidence={Boolean(evidence.length)}
        basePath={basePath}
        selected={selected}
        covered={covered}
        disabled={disabled}
        onSourceCheck={(id, checked) =>
          setSelected((current) => {
            const next = new Set(current);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          })
        }
        onGroupCheck={(ids, checked) =>
          setSelected((current) => {
            const next = new Set(current);
            for (const id of ids) {
              if (checked) next.add(id);
              else next.delete(id);
            }
            return next;
          })
        }
      />
      <TicketGeneration
        ids={ids}
        duplicates={duplicates}
        canGenerate={canGenerate}
        busy={busy}
        editing={editing}
        onGenerate={onGenerate}
        onCancel={onCancel}
        onGenerated={clearSelection}
        onClear={clearSelection}
        templates={templates}
        canEdit={canEdit}
        onAddTemplate={onAddTemplate}
        onTemplateDirtyChange={onTemplateDirtyChange}
        templateError={templateError}
      />
    </Stack>
  );
}
