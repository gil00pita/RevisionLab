"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Link, Stack, Text } from "@chakra-ui/react";
import { useRevisionLab } from "../../client/useRevisionLab.js";
import { defaultSettings } from "../../comment-settings.js";
import { LiveCommentComposer } from "./components/LiveCommentComposer.js";
import { ElementPicker } from "./components/ElementPicker.js";
import { LiveCommentBalloons } from "./components/LiveCommentBalloons.js";
import { useLiveFeedback } from "./hooks/useLiveFeedback.js";
import { RevisionLabProvider } from "../RevisionLabProvider/index.js";
import { WidgetPanel } from "./components/WidgetPanel.js";
import { WidgetLauncher } from "./components/WidgetLauncher.js";
import { RecordingSetup } from "./components/RecordingSetup.js";
import { RecordingPopover } from "./components/RecordingPopover.js";
import { RecorderPanel } from "./components/RecorderPanel.js";
import { WidgetStatus } from "./components/WidgetStatus.js";
import { WidgetDialog } from "./components/WidgetDialog.js";
import { usePageAccessibility } from "./hooks/usePageAccessibility.js";
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
  const workspace = useRevisionLab(apiPath);
  const { data, refresh } = workspace;
  const settings = data?.settings ?? defaultSettings;
  const live = useLiveFeedback(route, settings.showCommentBubbles);
  const commentsHref = `${basePath}?${new URLSearchParams({ view: "comments", route })}`;
  const pageComments =
    data?.comments.filter(
      (comment) =>
        comment.route === route && !comment.stepId && !comment.edgeId,
    ) ?? [];
  const reviewRoute = route === basePath || route.startsWith(`${basePath}/`);
  const recorder = useRecording(
    apiPath,
    route,
    Boolean(data && data.actor.role !== "commenter" && !reviewRoute),
    open || live.commenting,
  );
  const accessibility = usePageAccessibility(
    route,
    Boolean(data && !reviewRoute),
    open || live.commenting,
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

  async function stopRecording() {
    if (await recorder.finish()) {
      setOpen(false);
      await refresh();
    }
  }
  function beginCommenting() {
    live.setCommenting(true);
    live.setPicking(true);
    live.setAnchor(null);
    setOpen(false);
  }
  function stopCommenting() {
    live.setCommenting(false);
    live.setPicking(false);
    live.setAnchor(null);
  }
  function resumeCommenting() {
    live.setAnchor(null);
    if (live.commenting) {
      setOpen(false);
      live.setPicking(true);
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
      {data && live.picking && (
        <ElementPicker
          commentsHref={commentsHref}
          showBalloons={live.showBalloons}
          onShowBalloonsChange={live.setShowBalloons}
          onCancel={() => {
            stopCommenting();
          }}
          onSelect={(anchor) => {
            live.setAnchor(anchor);
            live.setPicking(false);
          }}
        />
      )}
      {data && live.showBalloons && !live.anchor && !open && (
        <LiveCommentBalloons
          key={route}
          comments={pageComments}
          color={settings.commentBubbleColor}
          commentsHref={commentsHref}
        />
      )}
      {data && live.commenting && live.anchor && (
        <LiveCommentComposer
          key={route}
          anchor={live.anchor}
          route={route}
          apiPath={apiPath}
          onCancel={resumeCommenting}
          onEscape={stopCommenting}
          onSaved={() => {
            resumeCommenting();
            void refresh();
          }}
        />
      )}
      <WidgetLauncher
        recording={Boolean(recorder.recording)}
        canRecord={Boolean(data && data.actor.role !== "commenter")}
        authorized={Boolean(data)}
        commenting={live.commenting}
        commentCount={
          pageComments.filter(
            (comment) => !comment.parentId && comment.status === "open",
          ).length
        }
        busy={ending || recorder.operation === "start"}
        accessibility={accessibility.result}
        onRerun={accessibility.rerun}
        workspaceHref={basePath}
        onComment={live.commenting ? stopCommenting : beginCommenting}
        onRecord={() => {
          if (recorder.recording) {
            void stopRecording();
            return;
          }
          stopCommenting();
          setTab("record");
          setOpen(true);
          void refresh();
        }}
      />
      <RecordingPopover
        open={open && tab === "record"}
        busy={recorder.operation === "start"}
        onClose={() => setOpen(false)}
      >
        {data && (
          <Stack gap="3">
            {recorder.recording ? (
              <>
                <RecorderPanel
                  recorder={recorder}
                  personas={data.personas ?? []}
                  basePath={basePath}
                />
                <RecordingActions
                  recorder={recorder}
                  onStop={() => void stopRecording()}
                  onDiscard={navigation.requestDiscard}
                />
              </>
            ) : (
              <>
                <RecordingSetup
                  recorder={recorder}
                  personas={data.personas ?? []}
                  basePath={basePath}
                  onStarted={() => setOpen(false)}
                />
                {recorder.error && (
                  <Text role="alert" color="red.700">
                    {recorder.error}
                  </Text>
                )}
              </>
            )}
          </Stack>
        )}
      </RecordingPopover>
      <WidgetDialog
        open={open && tab === "comment"}
        picking={live.picking}
        title="RevisionLab"
        projectName={data?.project.name ?? "Prototype review"}
        route={route}
        basePath={basePath}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) live.setPicking(false);
          else if (live.commenting) live.setPicking(true);
        }}
        onEscape={() => {
          stopCommenting();
          setOpen(false);
        }}
        actions={
          recorder.recording && (
            <RecordingActions
              recorder={recorder}
              onStop={() => void stopRecording()}
              onDiscard={navigation.requestDiscard}
            />
          )
        }
      >
        <WidgetPanel
          workspace={workspace}
          recorder={recorder}
          basePath={basePath}
          tab={tab}
          onTabChange={setTab}
        >
          <Stack gap="3" align="start">
            <Button onClick={beginCommenting} size="sm">
              Comment on an element
            </Button>
            <Link href={commentsHref} color="blue.700" fontSize="sm">
              All comments on this page
            </Link>
          </Stack>
        </WidgetPanel>
      </WidgetDialog>
      {!open && !live.commenting && (
        <WidgetStatus recorder={recorder} basePath={basePath} />
      )}
      {leaveDialog}
    </>
  );
}
