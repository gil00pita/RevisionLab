import { useState } from "react";
import {
  Box,
  Button,
  Field,
  Flex,
  Icon,
  IconButton,
  Input,
  List,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, Trash2 } from "lucide-react";
import type { RevisionLabStep } from "../../../server/types.js";
import type { BoardEdge } from "../types.js";
import { ScreenSelect } from "./ScreenSelect.js";

export function BoardConnections({
  steps,
  edges,
  canEdit,
  disabled,
  onAdd,
  onRemove,
}: {
  steps: RevisionLabStep[];
  edges: BoardEdge[];
  canEdit: boolean;
  disabled: boolean;
  onAdd: (source: string, target: string, label: string) => boolean;
  onRemove: (id: string) => void;
}) {
  const [source, setSource] = useState(steps[0]?.id ?? "");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const names = new Map(
    steps.map((step, index) => [step.id, `${index + 1}. ${step.title}`]),
  );
  return (
    <Stack
      p="4"
      gap="4"
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg="white"
    >
      {canEdit && steps.length > 1 && (
        <Box
          as="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              source &&
              target &&
              label.trim() &&
              onAdd(source, target, label)
            ) {
              setTarget("");
              setLabel("");
            }
          }}
        >
          <Stack gap="3">
            <Flex gap="3" direction={{ base: "column", md: "row" }}>
              <ScreenSelect
                label="From screen"
                value={source}
                onChange={setSource}
                steps={steps}
                disabled={disabled}
              />
              <ScreenSelect
                label="To screen"
                value={target}
                onChange={setTarget}
                steps={steps}
                disabled={disabled}
              />
            </Flex>
            <Flex gap="3" align="end" direction={{ base: "column", md: "row" }}>
              <Field.Root required flex="1">
                <Field.Label>Path label</Field.Label>
                <Input
                  size="sm"
                  placeholder="For example: Continue as an admin"
                  maxLength={120}
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  disabled={disabled}
                />
                <Field.HelperText>
                  Manual paths describe a branch; they do not claim it was
                  recorded.
                </Field.HelperText>
              </Field.Root>
              <Button
                type="submit"
                size="sm"
                colorPalette="blue"
                disabled={
                  disabled ||
                  !source ||
                  !target ||
                  !label.trim() ||
                  source === target
                }
                alignSelf={{ base: "start", md: "center" }}
              >
                Add path
              </Button>
            </Flex>
          </Stack>
        </Box>
      )}
      {edges.length > 0 ? (
        <List.Root listStyle="none" gap="2" aria-label="Screen connections">
          {edges.map((edge) => (
            <List.Item key={edge.id}>
              <Flex gap="3" align="center" justify="space-between">
                <Box minW="0">
                  <Flex gap="2" align="center" fontSize="sm" flexWrap="wrap">
                    <Text overflowWrap="anywhere">
                      {names.get(edge.sourceStepId)}
                    </Text>
                    <Icon size="sm" aria-label="to">
                      <ArrowRight />
                    </Icon>
                    <Text overflowWrap="anywhere">
                      {names.get(edge.targetStepId)}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" color="gray.600" overflowWrap="anywhere">
                    {edge.kind === "recorded"
                      ? "Recorded sequence"
                      : `Manual path: ${edge.label}`}
                  </Text>
                </Box>
                {canEdit && edge.kind === "manual" && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    aria-label={`Remove path: ${edge.label}`}
                    disabled={disabled}
                    onClick={() => onRemove(edge.id)}
                    flexShrink="0"
                  >
                    <Icon>
                      <Trash2 />
                    </Icon>
                  </IconButton>
                )}
              </Flex>
            </List.Item>
          ))}
        </List.Root>
      ) : (
        <Text color="gray.600" fontSize="sm">
          No connections yet. Recording another screen creates the next path
          automatically.
        </Text>
      )}
    </Stack>
  );
}
