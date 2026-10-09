import { useState } from "react";
import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";
import { commentContextLabel, commentGroupKey } from "../../../comment-context.js";
import { sourceApiPath, sourceCanEdit, type WorkspaceState } from "../../../workspace-instances.js";
import { FeedbackThread } from "../../FeedbackThread/index.js";

export function CommentDiscussionDialog({
  data,
  commentId,
  apiPath,
  onClose,
  onRefresh,
}: {
  data: WorkspaceState;
  commentId: string | null;
  apiPath: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const comment = data.comments.find((item) => item.id === commentId);
  const [selected, setSelected] = useState<string | null | undefined>(undefined);
  const comments = comment
    ? data.comments.filter((item) => commentGroupKey(item) === commentGroupKey(comment))
    : [];
  const unavailable = data.workspaces.some(
    (source) => source.id === comment?.workspace?.id && source.status === "unavailable",
  );

  return (
    <Dialog.Root
      open={Boolean(commentId)}
      onOpenChange={(event) => { if (!event.open) onClose(); }}
      size="lg"
      scrollBehavior="inside"
      finalFocusEl={() => document.querySelector<HTMLElement>('[aria-current="page"]')}
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner data-revisionlab-ui color="fg" colorPalette="blue" p="2">
          <Dialog.Content
            bg="bg.panel"
            color="fg"
            fontFamily="body"
            colorPalette="blue"
            w="full"
            maxW={{ base: "calc(100vw - 1rem)", md: "2xl" }}
          >
            <Dialog.Header flexDirection="column" gap="2" pe="12">
              <Dialog.Title>Comment discussion</Dialog.Title>
              <Dialog.Description overflowWrap="anywhere">
                {comment ? commentContextLabel(comment, data) : "This comment is no longer available in this workspace."}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              {comment ? (
                <FeedbackThread
                  apiPath={sourceApiPath(apiPath, comment.workspace)}
                  route={comment.route}
                  flowId={comment.flowId ?? undefined}
                  stepId={comment.stepId ?? undefined}
                  edgeId={comment.edgeId ?? undefined}
                  selectedCommentId={selected === undefined ? (comment.parentId ?? comment.id) : selected}
                  onSelectComment={setSelected}
                  comments={comments}
                  allowNewComments={!unavailable && !comment.edge?.archived}
                  canResolve={!unavailable && sourceCanEdit(data.actor.role, comment.workspace)}
                  onRefresh={onRefresh}
                />
              ) : (
                <Text color="fg.muted">Return to Feedback Review to see the available feedback.</Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Back to feedback</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Close comment discussion" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
