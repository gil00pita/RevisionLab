import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { sourceApiPath, sourceCanEdit } from "../../../workspace-instances.js";
import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { WorkspaceState } from "../../../workspace-instances.js";
import { FeedbackThread } from "../../FeedbackThread/index.js";
import { commentContextLabel, commentGroupKey } from "../comment-context.js";

export function AllComments({
  data,
  commentId,
  apiPath,
  onRefresh,
  route,
  basePath,
}: {
  data: WorkspaceState;
  commentId?: string | null;
  apiPath: string;
  onRefresh: () => Promise<void>;
  route: string | null;
  basePath: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const visibleComments =
    route === null
      ? data.comments
      : data.comments.filter(
          (comment) =>
            comment.route === route && !comment.stepId && !comment.edgeId,
        );
  const mentioned = visibleComments.find((comment) => comment.id === commentId);
  const targetGroup = mentioned ? commentGroupKey(mentioned) : undefined;
  const [threadSelection, setThreadSelection] = useState<
    string | null | undefined
  >(undefined);
  const groups = [...new Set(visibleComments.map(commentGroupKey))];
  const active =
    selected && groups.includes(selected)
      ? selected
      : (targetGroup ?? groups[0]);
  const comments = visibleComments.filter(
    (comment) => commentGroupKey(comment) === active,
  );
  const first = comments[0];

  return (
    <Stack gap="6" p={{ base: "5", md: "8" }} w="full">
      <Heading as="h2" size="xl">
        {route === null ? "All comments" : "Page comments"}
      </Heading>
      {route !== null && (
        <Stack gap="1">
          <Text fontSize="sm" overflowWrap="anywhere">
            {route}
          </Text>
          <Link
            href={`${basePath}?${new URLSearchParams({ view: "comments", workspace: data.selection })}`}
            color="blue.fg"
            fontSize="sm"
          >
            All workspace comments
          </Link>
        </Stack>
      )}
      {groups.length === 0 ? (
        <IllustratedEmptyState
          illustration="messages"
          description="No feedback yet. Open a prototype page or recorded screen to add your first comment."
        />
      ) : (
        <Flex gap="8" direction={{ base: "column", md: "row" }}>
          <Stack gap="2" w={{ base: "full", md: "72" }} flexShrink="0">
            {groups.map((key) => {
              const comment = visibleComments.find(
                (item) => commentGroupKey(item) === key,
              )!;
              return (
                <Button
                  key={key}
                  h="auto"
                  p="4"
                  whiteSpace="normal"
                  justifyContent="start"
                  textAlign="left"
                  variant={key === active ? "subtle" : "ghost"}
                  colorPalette={key === active ? "blue" : "gray"}
                  onClick={() => {
                    setSelected(key);
                    setThreadSelection(undefined);
                  }}
                  aria-pressed={key === active}
                >
                  {commentContextLabel(comment, data)}
                </Button>
              );
            })}
          </Stack>
          {first && (
            <Box maxW="2xl" minW="0" flex="1">
              <Heading as="h3" size="lg" mb="5">
                {commentContextLabel(first, data)}
              </Heading>
              <FeedbackThread
                key={active}
                selectedCommentId={
                  threadSelection === undefined
                    ? (mentioned?.parentId ?? mentioned?.id)
                    : threadSelection
                }
                onSelectComment={setThreadSelection}
                apiPath={sourceApiPath(apiPath, first.workspace)}
                route={first.route}
                flowId={first.flowId ?? undefined}
                stepId={first.stepId ?? undefined}
                edgeId={first.edgeId ?? undefined}
                allowNewComments={!first.edge?.archived}
                comments={comments}
                canResolve={sourceCanEdit(data.actor.role, first.workspace)}
                onRefresh={onRefresh}
              />
            </Box>
          )}
        </Flex>
      )}
    </Stack>
  );
}
