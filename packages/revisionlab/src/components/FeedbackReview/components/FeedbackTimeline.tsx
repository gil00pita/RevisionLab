import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { Badge, Box, Flex, Icon, Text, Timeline } from "@chakra-ui/react";
import type { FeedbackTimelineEntry } from "../timeline.js";
import { feedbackTypes } from "../constants.js";
import { EvidenceCard } from "./EvidenceCard.js";

export function FeedbackTimeline({
  entries,
  hasEvidence,
  basePath,
  selected,
  covered,
  disabled,
  onSourceCheck,
  onGroupCheck,
}: {
  entries: FeedbackTimelineEntry[];
  hasEvidence: boolean;
  basePath: string;
  selected: Set<string>;
  covered: Set<string>;
  disabled: boolean;
  onSourceCheck: (id: string, checked: boolean) => void;
  onGroupCheck: (ids: string[], checked: boolean) => void;
}) {
  return (
    <Box
      flex="1"
      minH="0"
      p="1"
      tabIndex={0}
      aria-label="Feedback timeline viewport"
      focusRing="outside"
    >
      {entries.length ? (
        <Timeline.Root
          as="ol"
          aria-label="Feedback timeline"
          listStyle="none"
          size="lg"
          colorPalette="blue"
        >
          {entries.map(({ group, capturedAt, priority }) => {
            const TypeIcon = feedbackTypes.find(
              (type) => type.value === group.kind,
            )!.icon;
            const checked = group.evidence.every((item) =>
              selected.has(item.id),
            )
              ? true
              : group.evidence.some((item) => selected.has(item.id))
                ? "indeterminate"
                : false;
            return (
              <Timeline.Item
                as="li"
                key={group.id}
                gap={{ base: "2", md: "3" }}
              >
                <Timeline.Connector>
                  <Timeline.Separator borderColor="blue.border" />
                  <Timeline.Indicator bg="blue.subtle" color="blue.fg">
                    <Icon size="xs" aria-hidden="true">
                      <TypeIcon />
                    </Icon>
                  </Timeline.Indicator>
                </Timeline.Connector>
                <Timeline.Content minW="0">
                  <Flex gap="2" align="center" flexWrap="wrap" minH="6">
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      title={capturedAt ?? undefined}
                    >
                      {capturedAt
                        ? new Date(capturedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Date unavailable"}
                      {group.evidence.length > 1 && " · Latest occurrence"}
                    </Text>
                    <Badge
                      colorPalette={
                        priority === "High"
                          ? "red"
                          : priority === "Medium"
                            ? "orange"
                            : "gray"
                      }
                    >
                      {priority
                        ? `${priority} · ticket priority`
                        : "Unprioritized"}
                    </Badge>
                  </Flex>
                  <EvidenceCard
                    group={group}
                    basePath={basePath}
                    checked={checked}
                    selectedIds={selected}
                    disabled={disabled}
                    drafted={
                      group.evidence.filter((item) => covered.has(item.id))
                        .length
                    }
                    onSourceCheck={onSourceCheck}
                    onCheck={(checked) =>
                      onGroupCheck(
                        group.evidence.map((item) => item.id),
                        checked,
                      )
                    }
                  />
                </Timeline.Content>
              </Timeline.Item>
            );
          })}
        </Timeline.Root>
      ) : (
        <IllustratedEmptyState
          illustration="inbox"
          description={hasEvidence
            ? "No feedback matches this filter."
            : "No feedback yet. Add comments, save an accessibility scan, or complete a test session to start reviewing."}
        />
      )}
    </Box>
  );
}
