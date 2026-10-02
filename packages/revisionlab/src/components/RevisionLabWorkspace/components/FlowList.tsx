import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Check, ListChecks, Trash2 } from "lucide-react";
import type { RevisionLabFlow } from "../../../server/types.js";
import { FlowListItem } from "./FlowListItem.js";
import { DeleteFlowsDialog } from "./DeleteFlowsDialog.js";
import { useFlowList } from "../hooks/useFlowList.js";

export function FlowList({
  flows,
  selected,
  onSelect,
  canDelete,
  disabled,
  onDelete,
}: {
  flows: RevisionLabFlow[];
  selected?: RevisionLabFlow;
  onSelect: (id: string) => void;
  canDelete: boolean;
  disabled: boolean;
  onDelete: (familyIds: string[]) => Promise<void>;
}) {
  const {
    search,
    setSearch,
    setChecked,
    selecting,
    toggleSelection,
    targets,
    setTargets,
    busy,
    error,
    notice,
    searchInput,
    trigger,
    latest,
    active,
    filtered,
    eligible,
    selection,
    allChecked,
    someChecked,
    confirm,
    remove,
  } = useFlowList({ flows, disabled, onDelete });
  const selectedFamilies = new Set(selection);
  return (
    <Box
      as="section"
      aria-label="Recorded flows"
      w="full"
      flexShrink="0"
      bg="white"
      borderColor="gray.200"
    >
      <Stack gap="4" p="4">
        <Flex align="center" justify="space-between" gap="2" flexWrap="wrap">
          <Heading as="h2" size="md">
            Your flows
          </Heading>
          {canDelete && latest.size > 0 && (
            <Button
              size="xs"
              variant="ghost"
              aria-pressed={selecting}
              disabled={busy || disabled}
              onClick={toggleSelection}
            >
              <Icon>{selecting ? <Check /> : <ListChecks />}</Icon>
              {selecting ? "Done" : "Select"}
            </Button>
          )}
        </Flex>
        <Field.Root>
          <Field.Label srOnly>Find a flow or persona</Field.Label>
          <Input
            ref={searchInput}
            placeholder="Find a flow or persona…"
            size="sm"
            value={search}
            disabled={busy || disabled}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field.Root>
        {canDelete && selecting && latest.size > 0 && (
          <Stack gap="2">
            <Flex
              align="center"
              justify="space-between"
              gap="2"
              flexWrap="wrap"
            >
              <Checkbox.Root
                size="sm"
                colorPalette="blue"
                checked={
                  allChecked ? true : someChecked ? "indeterminate" : false
                }
                disabled={disabled || busy || !eligible.length}
                onCheckedChange={(event) =>
                  setChecked(
                    event.checked === true
                      ? [
                          ...new Set([
                            ...selection,
                            ...eligible.map((flow) => flow.familyId),
                          ]),
                        ]
                      : selection.filter(
                          (id) =>
                            !eligible.some((flow) => flow.familyId === id),
                        ),
                  )
                }
              >
                <Checkbox.HiddenInput aria-label="Select all filtered flows" />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>Select all</Checkbox.Label>
              </Checkbox.Root>
              <Button
                size="xs"
                variant="plain"
                disabled={busy || disabled || !selection.length}
                onClick={() => setChecked([])}
              >
                Select none
              </Button>
            </Flex>
            {selection.length > 0 && (
              <>
                <Text fontSize="sm" role="status">
                  {selection.length} selected
                </Text>
                <Button
                  size="sm"
                  colorPalette="red"
                  variant="outline"
                  disabled={disabled || busy || selection.length > 100}
                  onClick={() => confirm(selection)}
                >
                  <Icon>
                    <Trash2 />
                  </Icon>
                  Delete selected
                </Button>
                {selection.length > 100 && (
                  <Text fontSize="sm" color="red.700" role="alert">
                    Delete up to 100 flows at a time.
                  </Text>
                )}
              </>
            )}
          </Stack>
        )}
        {notice && (
          <Text role="status" fontSize="sm" color="green.700">
            {notice}
          </Text>
        )}
      </Stack>
      <Stack gap="1" p="2">
        {filtered.map((flow) => (
          <FlowListItem
            key={flow.familyId}
            flow={flow}
            current={selected?.familyId === flow.familyId}
            checked={selectedFamilies.has(flow.familyId)}
            selecting={canDelete && selecting}
            active={active.has(flow.familyId)}
            disabled={disabled || busy}
            onCheck={(value) =>
              setChecked(
                value
                  ? [...selection, flow.familyId]
                  : selection.filter((id) => id !== flow.familyId),
              )
            }
            onSelect={() => onSelect(flow.id)}
          />
        ))}
        {filtered.length === 0 && (
          <Text color="gray.600" p="3">
            {flows.length
              ? "No flows match your search."
              : "Your first recording will appear here."}
          </Text>
        )}
      </Stack>
      {targets.length > 0 && (
        <DeleteFlowsDialog
          targets={targets}
          busy={busy}
          error={error}
          onCancel={() => setTargets([])}
          onConfirm={() => void remove()}
          finalFocus={() =>
            trigger.current?.isConnected ? trigger.current : searchInput.current
          }
        />
      )}
    </Box>
  );
}
