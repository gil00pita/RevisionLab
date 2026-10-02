import { Box, createListCollection, Portal, Select } from "@chakra-ui/react";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
export function WorkspaceSelector({
  workspaces,
  value,
  disabled,
  onChange,
}: {
  workspaces: WorkspaceInstance[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  if (workspaces.length < 2) return null;
  const collection = createListCollection({
    items: [
      ...workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
      })),
      { value: "all", label: "All workspaces" },
    ],
  });
  return (
    <Box px="3" pb="4" flexShrink="0">
      <Select.Root
        collection={collection}
        value={[value]}
        disabled={disabled}
        onValueChange={(event) => {
          if (event.value[0]) onChange(event.value[0]);
        }}
        size="sm"
      >
        <Select.Label fontSize="xs" color="gray.300">
          Workspace
        </Select.Label>
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger
            bg="whiteAlpha.100"
            color="white"
            borderColor="whiteAlpha.300"
          >
            <Select.ValueText truncate />
          </Select.Trigger>
          <Select.IndicatorGroup color="white">
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner data-revisionlab-ui zIndex="popover">
            <Select.Content maxW="calc(100vw - 2rem)">
              {collection.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText overflowWrap="anywhere">
                    {item.label}
                  </Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Box>
  );
}
