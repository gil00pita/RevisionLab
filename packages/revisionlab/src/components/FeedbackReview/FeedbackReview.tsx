"use client";
import { useState } from "react";
import {
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { WorkspaceState } from "../../workspace-instances.js";
import { CommentDiscussionDialog } from "./components/CommentDiscussionDialog.js";
import { LocalFeedbackReview } from "./components/LocalFeedbackReview.js";

export function FeedbackReview({
  data,
  apiPath,
  basePath,
  onDirtyChange,
  onRefresh,
  commentId,
  route,
  onCloseComment,
  onClearRoute,
}: {
  data: WorkspaceState;
  apiPath: string;
  basePath: string;
  onDirtyChange: (dirty: boolean) => void;
  onRefresh: () => Promise<void>;
  commentId: string | null;
  route: string | null;
  onCloseComment: () => void;
  onClearRoute: () => void;
}) {
  const [discussionRevision, setDiscussionRevision] = useState(0);
  const content = data.selection !== "local" ? (
    <Stack gap="4" p={{ base: "5", md: "8" }}>
      <Heading as="h2" size="lg">
        Review feedback at its source
      </Heading>
      <Text color="fg.muted">
        Feedback Review keeps evidence and ticket drafts within each
        installation. Open the source workspace to review its feedback; Codex
        generation runs from that project on localhost.
      </Text>
      {data.workspaces
        .filter(
          (source) =>
            data.selection === "all" || source.id === data.selection,
        )
        .map((source) => (
          <Link
            key={source.id}
            color="blue.fg"
            href={
              source.id === "local"
                ? `${basePath}?view=feedback&workspace=local`
                : new URL(
                    `${source.basePath}?view=feedback&workspace=local`,
                    source.url,
                  ).toString()
            }
          >
            Open Feedback Review · {source.name}
          </Link>
        ))}
    </Stack>
  ) : (
    <LocalFeedbackReview
      apiPath={apiPath}
      basePath={basePath}
      discussionRevision={discussionRevision}
      route={route}
      onClearRoute={onClearRoute}
      canEdit={data.actor.role !== "commenter"}
      flowIds={data.flows.map((flow) => flow.id)}
      personas={data.personas}
      onDirtyChange={onDirtyChange}
      onRefresh={onRefresh}
    />
  );
  return (
    <>
      {content}
      <CommentDiscussionDialog
        key={commentId}
        data={data}
        commentId={commentId}
        apiPath={apiPath}
        onClose={onCloseComment}
        onRefresh={async () => {
          await onRefresh();
          setDiscussionRevision((revision) => revision + 1);
        }}
      />
    </>
  );
}
