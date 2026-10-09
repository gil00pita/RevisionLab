import { useRef } from "react";
import { Flex, Icon, IconButton, Menu, Portal, SegmentGroup } from "@chakra-ui/react";
import { Accessibility, Check, Layers, MessageSquare, MoreHorizontal } from "lucide-react";
import type { ScreenDisplayOptions } from "../../PinnedScreen/index.js";
import { ReviewItemActions } from "../../ReviewAutomation/index.js";

export type ScreenFeedbackFilter = "all" | "comments" | "accessibility";
const filters = [
  { value: "all", label: "All feedback", icon: Layers },
  { value: "comments", label: "Comments", icon: MessageSquare },
  { value: "accessibility", label: "Accessibility", icon: Accessibility },
] as const;

export function ScreenFeedbackControls({
  value,
  onChange,
  displayOptions,
  onDisplayOptionsChange,
  hasCapture,
  hasCursor,
}: {
  value: ScreenFeedbackFilter;
  onChange: (filter: ScreenFeedbackFilter) => void;
  displayOptions: ScreenDisplayOptions;
  onDisplayOptionsChange: (options: ScreenDisplayOptions) => void;
  hasCapture: boolean;
  hasCursor: boolean;
}) {
  const optionsTrigger = useRef<HTMLButtonElement>(null);
  const options = [
    { key: "showBubbles", label: "Comment bubbles", disabled: !hasCapture },
    { key: "showResolved", label: "Resolved pins", disabled: !hasCapture },
    { key: "showCursor", label: "Cursor path", disabled: !hasCursor },
  ] as const;
  return (
    <Flex align="center" justify="space-between" gap="3">
      <SegmentGroup.Root
        value={value}
        onValueChange={(event) => onChange(event.value as ScreenFeedbackFilter)}
        aria-label="Filter screen feedback"
        size="sm"
        flex="1"
        minW="0"
        maxW="44"
      >
        <SegmentGroup.Indicator _motionReduce={{ transition: "none" }} />
        {filters.map((filter) => (
          <SegmentGroup.Item key={filter.value} value={filter.value} aria-label={filter.label} title={filter.label} minW="0" w="11" flex="1" p="0" minH="11" cursor="pointer">
            <SegmentGroup.ItemText display="flex" alignItems="center">
              <Icon size="sm"><filter.icon /></Icon>
            </SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput aria-label={filter.label} />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
      <Menu.Root positioning={{ placement: "bottom-end" }}>
        <Menu.Trigger asChild>
          <IconButton ref={optionsTrigger} aria-label="Screen feedback options" title="Screen feedback options" variant="ghost" size="sm" flexShrink="0">
            <Icon><MoreHorizontal /></Icon>
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner data-revisionlab-ui color="fg" colorPalette="blue" fontFamily="body" fontSize="sm">
            <Menu.Content aria-label="Screen feedback options">
              {options.map((option) => (
                <Menu.CheckboxItem
                  key={option.key}
                  value={option.key}
                  checked={displayOptions[option.key]}
                  disabled={option.disabled}
                  closeOnSelect={false}
                  onCheckedChange={(checked) => onDisplayOptionsChange({ ...displayOptions, [option.key]: checked })}
                >
                  <Menu.ItemText>{option.label}</Menu.ItemText>
                  <Menu.ItemIndicator><Icon><Check /></Icon></Menu.ItemIndicator>
                </Menu.CheckboxItem>
              ))}
              <ReviewItemActions target={{ kind: "screen" }} presentation="menu" returnFocusRef={optionsTrigger} />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Flex>
  );
}
