import { useEffect, useRef, useState } from "react";
import { Box, Icon, Portal, Select, Text, createListCollection } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { WorkspaceConnectionStatus, workspaceConnectionStatus } from "./WorkspaceConnectionStatus.js";
import { WorkspaceConnectionDialog } from "./WorkspaceConnectionDialog/index.js";
import type { WorkspaceInstance } from "../../../workspace-instances.js";

const addWorkspaceValue = "add-workspace";
interface WorkspaceOption {
  value: string;
  label: string;
  status?: ReturnType<typeof workspaceConnectionStatus>;
}

export function WorkspaceSelector({
  workspaces,
  value,
  disabled,
  syncError,
  onChange,
  canAdd,
  apiPath,
  onRefresh,
}: {
  workspaces: WorkspaceInstance[];
  value: string;
  disabled: boolean;
  syncError: boolean;
  onChange: (value: string) => void;
  canAdd: boolean;
  apiPath: string;
  onRefresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const addFrame = useRef<number | null>(null);
  useEffect(() => () => {
    if (addFrame.current !== null) cancelAnimationFrame(addFrame.current);
  }, []);
  const selectedValue = workspaces.length === 1 && value === "all" ? workspaces[0].id : value;
  const items: WorkspaceOption[] = workspaces.map((workspace) => ({
    value: workspace.id,
    label: workspace.name,
    status: workspaceConnectionStatus([workspace], syncError),
  }));
  if (workspaces.length > 1) {
    items.push({ value: "all", label: "All workspaces", status: workspaceConnectionStatus(workspaces, syncError) });
  }
  if (canAdd) items.push({ value: addWorkspaceValue, label: "Add workspace" });
  const collection = createListCollection({ items });
  const selected = items.find((item) => item.value === selectedValue);

  return (
    <Box px="3" pb="4" flexShrink="0">
      <Select.Root
        collection={collection}
        positioning={{ sameWidth: true, fitViewport: true }}
        value={[selectedValue]}
        open={open}
        onOpenChange={(event) => setOpen(event.open)}
        disabled={disabled}
        onValueChange={(event) => {
          const next = event.value[0];
          if (next === addWorkspaceValue) {
            setOpen(false);
            // The select restores focus on the next frame, including with reduced motion.
            addFrame.current = requestAnimationFrame(() => {
              addFrame.current = requestAnimationFrame(() => {
                addFrame.current = null;
                setAdding(true);
              });
            });
          } else if (next) onChange(next);
        }}
        size="sm"
      >
        <Select.Label srOnly>Workspace</Select.Label>
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger
            ref={trigger}
            minH="11"
            h="auto"
            py="2"
            minW="0"
            bg="bg.panel"
            focusRing="inside"
            gap="2"
          >
            <WorkspaceConnectionStatus status={selected?.status ?? "Not connected"} />
            <Select.ValueText flex="1" minW="0" textAlign="start" whiteSpace="normal" overflowWrap="anywhere" />
          </Select.Trigger>
          <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner data-revisionlab-ui color="fg" colorPalette="blue" zIndex="popover">
            <Select.Content maxW="calc(100vw - 2rem)" maxH="60dvh" bg="bg.panel" color="fg" fontFamily="body" _motionReduce={{ animation: "none" }}>
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  item={item}
                  minH="11"
                  flex="none"
                  gap="2"
                  borderTopWidth={item.status ? undefined : "1px"}
                  borderColor="border"
                  mt={item.status ? undefined : "1"}
                  color={item.status ? "fg" : "blue.fg"}
                >
                  <Select.ItemText display="flex" alignItems="center" gap="2" minW="0" flex="1">
                    {item.status ? (
                      <WorkspaceConnectionStatus status={item.status} />
                    ) : (
                      <Icon boxSize="4" flexShrink="0" aria-hidden="true"><Plus /></Icon>
                    )}
                    <Text as="span" minW="0" overflowWrap="anywhere">{item.label}</Text>
                  </Select.ItemText>
                  {item.status && <Select.ItemIndicator />}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      {adding && canAdd && (
        <WorkspaceConnectionDialog
          apiPath={apiPath}
          onRefresh={onRefresh}
          onClose={() => setAdding(false)}
          finalFocus={() => trigger.current}
        />
      )}
    </Box>
  );
}
