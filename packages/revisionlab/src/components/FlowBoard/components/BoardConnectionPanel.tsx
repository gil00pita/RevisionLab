import { useEffect, useRef } from "react";
import {
  Box,
  Button,
  CloseButton,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import type {
  RevisionLabComment,
  RevisionLabFlow,
} from "../../../server/types.js";
import { FeedbackThread } from "../../FeedbackThread/index.js";
import type { BoardEdge, FlowBoardData } from "../types.js";

export function BoardConnectionPanel({
  edge,
  flow,
  savedBoard,
  comments,
  apiPath,
  editing,
  canResolve,
  disabled,
  onLabel,
  onRemove,
  onClose,
  onRefresh,
}: {
  edge: BoardEdge;
  flow: RevisionLabFlow;
  savedBoard: FlowBoardData;
  comments: RevisionLabComment[];
  apiPath: string;
  editing: boolean;
  canResolve: boolean;
  disabled: boolean;
  onLabel: (label: string) => void;
  onRemove: () => void;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const source = flow.steps.find((step) => step.id === edge.sourceStepId);
  const target = flow.steps.find((step) => step.id === edge.targetStepId);
  const saved = savedBoard.edges.some(
    (item) =>
      item.id === edge.id &&
      item.sourceStepId === edge.sourceStepId &&
      item.targetStepId === edge.targetStepId,
  );
  return (
    <Stack
      as="section"
      aria-label="Selected connection"
      gap="4"
      p="4"
      borderWidth="1px"
      borderColor="gray.200"
      bg="white"
      minW="0"
    >
      <Flex justify="space-between" align="start" gap="3">
        <Box minW="0">
          <Heading ref={heading} as="h3" size="md" tabIndex={-1}>
            Connection
          </Heading>
          <Text mt="1" fontSize="sm" overflowWrap="anywhere">
            {source?.title} → {target?.title}
          </Text>
          <Text fontSize="xs" color="gray.600">
            {edge.kind === "recorded" ? "Recorded sequence" : "Manual path"}
          </Text>
        </Box>
        <CloseButton
          size="sm"
          aria-label="Close connection"
          onClick={onClose}
        />
      </Flex>
      {editing && (
        <Stack gap="3">
          <Field.Root>
            <Field.Label>Path label</Field.Label>
            <Input
              value={edge.label}
              maxLength={120}
              disabled={disabled}
              onChange={(event) => onLabel(event.target.value)}
            />
            <Field.HelperText>Changes save automatically.</Field.HelperText>
          </Field.Root>
          <Button
            alignSelf="start"
            size="sm"
            colorPalette="red"
            variant="outline"
            disabled={disabled}
            onClick={onRemove}
          >
            Remove connection
          </Button>
          <Text color="gray.600" fontSize="xs">
            Removing a connection keeps its discussion history in All comments.
          </Text>
        </Stack>
      )}
      {saved ? (
        <FeedbackThread
          apiPath={apiPath}
          flowId={flow.id}
          edgeId={edge.id}
          route={flow.route}
          comments={comments.filter(
            (comment) =>
              comment.flowId === flow.id && comment.edgeId === edge.id,
          )}
          canResolve={canResolve}
          onRefresh={onRefresh}
        />
      ) : (
        <Text color="gray.600" role="status">
          This connection must finish autosaving before you can add comments.
        </Text>
      )}
    </Stack>
  );
}
