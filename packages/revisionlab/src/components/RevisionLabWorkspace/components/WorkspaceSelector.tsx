import { Box, createListCollection, Flex, Portal, Select } from "@chakra-ui/react";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
import { WorkspaceConnectionStatus, workspaceConnectionStatus } from "./WorkspaceConnectionStatus.js";
export function WorkspaceSelector({
  workspaces,
  value,
  disabled,
  syncError,
  onChange,
}: {
  workspaces: WorkspaceInstance[];
  value: string;
  disabled: boolean;
  syncError: boolean;
  onChange: (value: string) => void;
}) {
  const collection = createListCollection<{
    value: string;
    label: string;
    status: ReturnType<typeof workspaceConnectionStatus>;
  }>({
    items: [
      ...workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
        status: workspaceConnectionStatus([workspace], syncError),
      })),
      { value: "all", label: "All workspaces", status: workspaceConnectionStatus(workspaces, syncError) },
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
        <Select.Label fontSize="xs" color="gray.600">
          Workspace
        </Select.Label>
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger
            minH="11"
            h="auto"
            py="2"
            minW="0"
            bg="white"
            color="gray.900"
            borderColor="gray.500"
            _hover={{ borderColor: "gray.600" }}
            focusRing="inside"
            focusRingColor="blue.700"
          >
            <WorkspaceConnectionStatus status={collection.items.find((item) => item.value === value)?.status ?? "Not connected"} />
            <Select.ValueText flex="1" minW="0" textAlign="start" whiteSpace="normal" overflowWrap="anywhere" />
          </Select.Trigger>
          <Select.IndicatorGroup color="gray.700">
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner data-revisionlab-ui zIndex="popover">
            <Select.Content maxW="calc(100vw - 2rem)">
              {collection.items.map((item) => (
                <Select.Item key={item.value} item={item} minH="11">
                  <Select.ItemText overflowWrap="anywhere">
                    <Flex as="span" align="center" gap="2">
                      <WorkspaceConnectionStatus status={item.status} />
                      {item.label}
                    </Flex>
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
