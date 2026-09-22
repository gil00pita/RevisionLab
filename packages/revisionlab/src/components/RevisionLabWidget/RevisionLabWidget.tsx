"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Button,
  CloseButton,
  Dialog,
  Flex,
  Icon,
  Link,
  Portal,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowUpRight, Camera, MessageSquare } from "lucide-react";
import { ApiError } from "../../client/api.js";
import { useRevisionLab } from "../../client/useRevisionLab.js";
import { FeedbackThread } from "../FeedbackThread/index.js";
import { RevisionLabProvider } from "../RevisionLabProvider/index.js";
import { RecorderPanel } from "./components/RecorderPanel.js";
import { RecordingActions } from "./components/RecordingActions.js";
import { RecordingControls } from "./components/RecordingControls.js";
import { RecordingLeaveDialog } from "./components/RecordingLeaveDialog.js";
import { useRecording } from "./hooks/useRecording.js";
import { useRecordingNavigation } from "./hooks/useRecordingNavigation.js";

export interface RevisionLabWidgetProps {
  apiPath?: string;
  basePath?: string;
}

export function RevisionLabWidget({
  apiPath = "/api/revisionlab",
  basePath = "/revisionlab",
}: RevisionLabWidgetProps) {
  const pathname = usePathname() ?? "/";
  return (
    <RevisionLabProvider>
      <Widget apiPath={apiPath} basePath={basePath} route={pathname} />
    </RevisionLabProvider>
  );
}

function Widget({
  apiPath,
  basePath,
  route,
}: Required<RevisionLabWidgetProps> & { route: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"comment" | "record">("comment");
  const { data, error, loading, refresh } = useRevisionLab(apiPath);
  const reviewRoute = route === basePath || route.startsWith(`${basePath}/`);
  const recorder = useRecording(
    apiPath,
    route,
    Boolean(data && data.actor.role !== "commenter" && !reviewRoute),
  );
  const ending =
    recorder.operation === "finish" || recorder.operation === "discard";
  const navigation = useRecordingNavigation({
    active: Boolean(recorder.recording),
    basePath,
    onDiscard: recorder.discard,
    busy: ending,
    capturing: recorder.operation === "capture",
    allowContinue:
      !recorder.recording?.discardRequested &&
      !recorder.recording?.finishRequested,
  });
  const unauthenticated = error instanceof ApiError && error.status === 401;

  async function stopRecording() {
    if (await recorder.finish()) {
      if (reviewRoute) await refresh();
      else {
        setTab("record");
        setOpen(true);
      }
    }
  }

  const leaveDialog = (
    <RecordingLeaveDialog
      open={Boolean(navigation.pending)}
      navigating={Boolean(navigation.pending?.href)}
      capturing={recorder.operation === "capture"}
      canContinue={
        Boolean(navigation.pending?.canContinue) &&
        !recorder.recording?.finishRequested
      }
      state={
        recorder.recording?.discardRequested
          ? "discard-pending"
          : recorder.recording?.finishRequested && recorder.recording.count > 0
            ? "save-pending"
            : "recording"
      }
      busy={ending}
      error={recorder.error}
      onCancel={navigation.cancel}
      onContinue={navigation.continueRecording}
      onDiscard={() => void navigation.discardAndLeave()}
    />
  );
  const recordingControls = (
    <RecordingControls
      recorder={recorder}
      onStop={() => void stopRecording()}
      onDiscard={navigation.requestDiscard}
    />
  );

  // The guard stays mounted if a host performs navigation outside our link guard.
  if (reviewRoute)
    return (
      <>
        {recordingControls}
        {leaveDialog}
      </>
    );

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(event) => setOpen(event.open)}
        placement="center"
        size="sm"
        scrollBehavior="inside"
      >
        <Dialog.Trigger asChild>
          <Button
            position="fixed"
            bottom="6"
            right="6"
            zIndex="docked"
            colorPalette="blue"
            size="lg"
            borderRadius="full"
            shadow="lg"
            aria-label={
              recorder.recording
                ? "Open RevisionLab recording"
                : "Open RevisionLab"
            }
          >
            <Icon>{recorder.recording ? <Camera /> : <MessageSquare />}</Icon>
            {recorder.recording
              ? `Recording · ${recorder.recording.count}`
              : "Review"}
          </Button>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop data-revisionlab-ui />
          <Dialog.Positioner data-revisionlab-ui colorPalette="blue">
            <Dialog.Content
              bg="white"
              color="gray.900"
              fontFamily="body"
              borderRadius="xl"
            >
              <Dialog.Header pb="3">
                <Dialog.Title>RevisionLab</Dialog.Title>
                <Dialog.Description color="gray.600" overflowWrap="anywhere">
                  {data?.project.name ?? "Prototype review"} · {route}
                </Dialog.Description>
              </Dialog.Header>
              <Dialog.Body>
                {loading ? (
                  <Flex py="10" gap="3" align="center">
                    <Spinner />
                    <Text>Connecting to the workspace…</Text>
                  </Flex>
                ) : data ? (
                  <Stack gap="5">
                    <Flex gap="2" role="group" aria-label="Review tools">
                      <Button
                        flex="1"
                        size="sm"
                        variant={tab === "comment" ? "solid" : "outline"}
                        aria-pressed={tab === "comment"}
                        onClick={() => setTab("comment")}
                      >
                        <Icon>
                          <MessageSquare />
                        </Icon>
                        Comment
                      </Button>
                      {data.actor.role !== "commenter" && (
                        <Button
                          flex="1"
                          size="sm"
                          variant={tab === "record" ? "solid" : "outline"}
                          aria-pressed={tab === "record"}
                          onClick={() => setTab("record")}
                        >
                          <Icon>
                            <Camera />
                          </Icon>
                          Record
                        </Button>
                      )}
                    </Flex>
                    {tab === "record" && data.actor.role !== "commenter" ? (
                      <RecorderPanel recorder={recorder} />
                    ) : (
                      <FeedbackThread
                        apiPath={apiPath}
                        route={route}
                        comments={data.comments.filter(
                          (comment) =>
                            comment.route === route &&
                            !comment.stepId &&
                            !comment.edgeId,
                        )}
                        canResolve={data.actor.role !== "commenter"}
                        onRefresh={refresh}
                      />
                    )}
                    <Separator />
                    <Text color="gray.600" fontSize="xs">
                      Reviewing as {data.actor.name} · {data.actor.role}
                    </Text>
                  </Stack>
                ) : (
                  <Stack gap="4" py="4">
                    <Text
                      role="alert"
                      color={unauthenticated ? "gray.600" : "red.700"}
                    >
                      {error?.message ?? "Unable to connect."}
                    </Text>
                    {unauthenticated ? (
                      <Link href={`${basePath}/access`} color="blue.700">
                        Verify your email to review
                      </Link>
                    ) : (
                      <Button onClick={() => void refresh()} variant="outline">
                        Try again
                      </Button>
                    )}
                  </Stack>
                )}
              </Dialog.Body>
              <Dialog.Footer borderTopWidth="1px" borderColor="gray.200">
                <Stack gap="3" w="full">
                  {recorder.recording && (
                    <RecordingActions
                      recorder={recorder}
                      onStop={() => void stopRecording()}
                      onDiscard={navigation.requestDiscard}
                    />
                  )}
                  <Link href={basePath} fontWeight="semibold" color="blue.700">
                    Open full workspace
                    <Icon>
                      <ArrowUpRight />
                    </Icon>
                  </Link>
                </Stack>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" aria-label="Close RevisionLab" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      {!open && recordingControls}
      {leaveDialog}
    </>
  );
}
