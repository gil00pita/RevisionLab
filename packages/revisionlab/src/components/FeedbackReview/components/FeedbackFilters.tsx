import {
  Field,
  Flex,
  Icon,
  Input,
  Portal,
  SegmentGroup,
  Tooltip,
  VisuallyHidden,
} from "@chakra-ui/react";
import type { EvidenceKind } from "../../../feedback-review.js";
import { feedbackTypes } from "../constants.js";

export function FeedbackFilters({
  search,
  onSearch,
  filter,
  onFilter,
}: {
  search: string;
  onSearch: (value: string) => void;
  filter: "all" | EvidenceKind;
  onFilter: (value: "all" | EvidenceKind) => void;
}) {
  return (
    <Flex gap="2" align="center" minW="0">
      <Field.Root flex="1" minW="0">
        <VisuallyHidden asChild>
          <Field.Label>Search feedback</Field.Label>
        </VisuallyHidden>
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search feedback"
          borderColor="gray.500"
          size="sm"
          minW="0"
        />
      </Field.Root>
      <SegmentGroup.Root
        value={filter}
        onValueChange={(event) => {
          if (
            event.value === "all" ||
            feedbackTypes.some((type) => type.value === event.value)
          )
            onFilter(event.value as "all" | EvidenceKind);
        }}
        aria-label="Feedback type"
        size="sm"
        bg="gray.100"
        flexShrink="0"
      >
        <SegmentGroup.Indicator
          bg="blue.100"
          shadow="none"
          _motionReduce={{ transition: "none" }}
        />
        <SegmentGroup.Item
          value="all"
          px="3"
          color="gray.700"
          _checked={{ color: "blue.800" }}
        >
          <SegmentGroup.ItemText>All</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput aria-label="All" />
        </SegmentGroup.Item>
        {feedbackTypes.map((type) => (
          <Tooltip.Root key={type.value} openDelay={200} closeDelay={100}>
            <Tooltip.Trigger asChild>
              <SegmentGroup.Item
                value={type.value}
                px="2.5"
                color="gray.700"
                _checked={{ color: "blue.800" }}
              >
                <SegmentGroup.ItemText display="flex" alignItems="center">
                  <Icon size="sm" aria-hidden="true">
                    <type.icon />
                  </Icon>
                  <VisuallyHidden>{type.label}</VisuallyHidden>
                </SegmentGroup.ItemText>
                <SegmentGroup.ItemHiddenInput aria-label={type.label} />
              </SegmentGroup.Item>
            </Tooltip.Trigger>
            <Portal>
              <Tooltip.Positioner data-revisionlab-ui>
                <Tooltip.Content bg="gray.900" color="white" fontFamily="body">
                  {type.label}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Portal>
          </Tooltip.Root>
        ))}
      </SegmentGroup.Root>
    </Flex>
  );
}
