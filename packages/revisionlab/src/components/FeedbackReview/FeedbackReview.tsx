"use client";
import { EvidencePreviewProvider } from "./components/EvidencePreviewProvider.js";
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Flex,
  Grid,
  Heading,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { WorkspaceState } from "../../workspace-instances.js";
import { useFeedbackReview } from "./hooks/useFeedbackReview.js";
import { FeedbackInbox } from "./components/FeedbackInbox.js";
import { TicketDrafts } from "./components/TicketDrafts.js";

export function FeedbackReview({
  data,
  apiPath,
  basePath,
  onDirtyChange,
  onRefresh,
}: {
  data: WorkspaceState;
  apiPath: string;
  basePath: string;
  onDirtyChange: (dirty: boolean) => void;
  onRefresh: () => Promise<void>;
}) {
  if (data.selection !== "local") {
    return (
      <Stack gap="4" p={{ base: "5", md: "8" }}>
        <Heading as="h2" size="lg">
          Review feedback at its source
        </Heading>
        <Text color="gray.600">
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
              color="blue.700"
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
    );
  }
  return (
    <LocalFeedbackReview
      apiPath={apiPath}
      basePath={basePath}
      canEdit={data.actor.role !== "commenter"}
      flowIds={data.flows.map((flow) => flow.id)}
      onDirtyChange={onDirtyChange}
      onRefresh={onRefresh}
    />
  );
}

function LocalFeedbackReview({
  apiPath,
  basePath,
  canEdit,
  flowIds,
  onDirtyChange,
  onRefresh,
}: {
  apiPath: string;
  basePath: string;
  canEdit: boolean;
  flowIds: string[];
  onDirtyChange: (dirty: boolean) => void;
  onRefresh: () => Promise<void>;
}) {
  const review = useFeedbackReview(apiPath);
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
  return (
    <EvidencePreviewProvider>
      <Stack p={{ base: "5", md: "8" }} pb="40" gap="5" w="full">
        <Flex justify="space-between" gap="3" flexWrap="wrap" align="center">
          <Text maxW="3xl" color="gray.600">
            One place to review recurring feedback, connect test evidence, and
            prepare the work that matters.
          </Text>
          <Button
            size="sm"
            variant="outline"
            disabled={editing || review.busy}
            onClick={() => void review.reload()}
          >
            Reload feedback
          </Button>
        </Flex>
        {review.error && (
          <Text role="alert" color="red.700">
            {review.error}
          </Text>
        )}
        {review.status && (
          <Text role="status" color="green.800">
            {review.status}
          </Text>
        )}
        {review.loading && (
          <Flex gap="3" align="center" role="status">
            <Spinner size="sm" />
            <Text>Loading feedback and saved drafts…</Text>
          </Flex>
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
