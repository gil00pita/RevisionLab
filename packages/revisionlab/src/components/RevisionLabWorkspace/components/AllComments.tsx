import { useState } from "react";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import type { RevisionLabState } from "../../../server/types.js";
import { FeedbackThread } from "../../FeedbackThread/index.js";
import { commentContextLabel, commentGroupKey } from "../comment-context.js";

export function AllComments({
  data,
  apiPath,
  onRefresh,
}: {
  data: RevisionLabState;
  apiPath: string;
  onRefresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const groups = [...new Set(data.comments.map(commentGroupKey))];
  const active = selected && groups.includes(selected) ? selected : groups[0];
  const comments = data.comments.filter(
    (comment) => commentGroupKey(comment) === active,
  );
  const first = comments[0];

  return (
    <Stack gap="6" p={{ base: "5", md: "8" }} w="full">
      <Heading as="h2" size="xl">
        All comments
      </Heading>
      {groups.length === 0 ? (
        <Text color="gray.600">
          No feedback yet. Open a prototype page or recorded screen to add your
          first comment.
        </Text>
      ) : (
        <Flex gap="8" direction={{ base: "column", md: "row" }}>
          <Stack gap="2" w={{ base: "full", md: "72" }} flexShrink="0">
            {groups.map((key) => {
              const comment = data.comments.find(
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
                  onClick={() => setSelected(key)}
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
                apiPath={apiPath}
                route={first.route}
                flowId={first.flowId ?? undefined}
                stepId={first.stepId ?? undefined}
                edgeId={first.edgeId ?? undefined}
                allowNewComments={!first.edge?.archived}
                comments={comments}
                canResolve={data.actor.role !== "commenter"}
                onRefresh={onRefresh}
              />
            </Box>
          )}
        </Flex>
      )}
    </Stack>
  );
}
