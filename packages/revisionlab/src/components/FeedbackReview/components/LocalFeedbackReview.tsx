import { useCallback, useEffect, useState } from "react";
import { Button, Flex, Grid, Stack, Text } from "@chakra-ui/react";
import type { RevisionLabPersona } from "../../../server/types.js";
import { WorkspacePageSkeleton } from "../../WorkspacePageSkeleton/index.js";
import { useFeedbackReview } from "../hooks/useFeedbackReview.js";
import { EvidencePreviewProvider } from "./EvidencePreviewProvider.js";
import { FeedbackInbox } from "./FeedbackInbox.js";
import { TicketDrafts } from "./TicketDrafts.js";

export function LocalFeedbackReview({
  discussionRevision,
  route,
  onClearRoute,
  apiPath,
  basePath,
  canEdit,
  flowIds,
  personas,
  onDirtyChange,
  onRefresh,
}: {
  apiPath: string;
  basePath: string;
  canEdit: boolean;
  flowIds: string[];
  personas: RevisionLabPersona[];
  onDirtyChange: (dirty: boolean) => void;
  onRefresh: () => Promise<void>;
  route: string | null;
  onClearRoute: () => void;
  discussionRevision: number;
}) {
  const review = useFeedbackReview(apiPath);
  const reloadDiscussionFeedback = review.reload;
  useEffect(() => {
    if (discussionRevision > 0) void reloadDiscussionFeedback();
  }, [discussionRevision, reloadDiscussionFeedback]);
  const [ticketEditing, setTicketEditing] = useState(false);
  const [templateEditing, setTemplateEditing] = useState(false);
  const editing = ticketEditing || templateEditing;
  const dirtyChanged = useCallback(
    (dirty: boolean) => setTicketEditing(dirty),
    [],
  );
  const templateDirtyChanged = useCallback(
    (dirty: boolean) => setTemplateEditing(dirty),
    [],
  );
  useEffect(() => {
    onDirtyChange(editing || review.busy);
    const preventLeave = (event: BeforeUnloadEvent) => {
      if (editing || review.busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", preventLeave);
    return () => {
      onDirtyChange(false);
      window.removeEventListener("beforeunload", preventLeave);
    };
  }, [editing, review.busy, onDirtyChange]);
  if (review.loading && !review.data) return <WorkspacePageSkeleton page="feedback" />;

  return (
    <EvidencePreviewProvider>
      <Stack p={{ base: "5", md: "8" }} pb="40" gap="5" w="full">
        <Flex justify="space-between" gap="3" flexWrap="wrap" align="center">
          <Text maxW="3xl" color="fg.muted">
            One place to review recurring feedback, connect test evidence, and
            prepare the work that matters.
          </Text>
          <Button
            size="sm"
            variant="outline"
            maxW="full"
            h="auto"
            minH="10"
            py="2"
            whiteSpace="normal"
            disabled={editing || review.busy}
            onClick={() => void review.reload()}
          >
            Reload feedback
          </Button>
        </Flex>
        {review.error && (
          <Text role="alert" color="red.fg">
            {review.error}
          </Text>
        )}
        {review.status && (
          <Text role="status" color="green.fg">
            {review.status}
          </Text>
        )}
        {!review.data && !review.loading && (
          <Button alignSelf="start" onClick={() => void review.reload()}>
            Try again
          </Button>
        )}
        {review.data && (
          <Grid
            templateColumns={{
              base: "minmax(0, 1fr)",
              xl: "minmax(0, 1fr) minmax(0, 1fr)",
            }}
            gap="8"
            alignItems="start"
          >
            <FeedbackInbox
              route={route}
              onClearRoute={onClearRoute}
              apiPath={apiPath}
              personas={personas}
              evidence={review.data.evidence}
              tickets={review.data.tickets}
              basePath={basePath}
              canGenerate={review.data.canGenerate}
              busy={review.busy}
              editing={editing}
              onGenerate={review.generate}
              onCancel={review.cancel}
              templates={review.data.templates}
              canEdit={canEdit}
              onAddTemplate={review.addTemplate}
              onTemplateDirtyChange={templateDirtyChanged}
              templateError={review.data.templateError}
            />
            <TicketDrafts
              tickets={review.data.tickets}
              selected={review.selectedTicket}
              editing={editing}
              busy={review.busy}
              apiPath={apiPath}
              basePath={basePath}
              canEdit={canEdit}
              onSelect={review.setSelectedTicket}
              onSaved={(ticket) => {
                review.saved(ticket);
                void review.reload();
                void onRefresh();
              }}
              onDirtyChange={dirtyChanged}
              onConflict={review.reload}
              flowIds={flowIds}
            />
          </Grid>
        )}
      </Stack>
    </EvidencePreviewProvider>
  );
}
