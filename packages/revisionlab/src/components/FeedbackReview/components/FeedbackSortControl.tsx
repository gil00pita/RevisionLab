import {
  createListCollection,
  Portal,
  Select,
  VisuallyHidden,
} from "@chakra-ui/react";
import type { FeedbackSort } from "../timeline.js";

const options = [
  { value: "newest", label: "Date: newest first" },
  { value: "oldest", label: "Date: oldest first" },
  { value: "priority-high", label: "Priority: high to low" },
  { value: "priority-low", label: "Priority: low to high" },
] satisfies { value: FeedbackSort; label: string }[];
const collection = createListCollection({ items: options });

export function FeedbackSortControl({
  value,
  onChange,
}: {
  value: FeedbackSort;
  onChange: (value: FeedbackSort) => void;
}) {
  return (
    <Select.Root
      collection={collection}
      value={[value]}
      size="sm"
      w="52"
      flexShrink="0"
      onValueChange={(event) => {
        const choice = options.find(
          (option) => option.value === event.value[0],
        );
        if (choice) onChange(choice.value);
      }}
    >
      <Select.HiddenSelect />
      <VisuallyHidden asChild>
        <Select.Label>Sort feedback</Select.Label>
      </VisuallyHidden>
      <Select.Control>
        <Select.Trigger borderColor="gray.500">
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner data-revisionlab-ui>
          <Select.Content bg="white" color="gray.900" fontFamily="body">
            {options.map((option) => (
              <Select.Item key={option.value} item={option}>
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
