"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  CloseButton,
  Dialog,
  Icon,
  Link,
  Portal,
  Stack,
} from "@chakra-ui/react";
import { ArrowUpRight } from "lucide-react";
import { useRevisionLab } from "../../client/useRevisionLab.js";
import { LiveFeedback } from "./components/LiveFeedback.js";
import { LiveElementPins } from "./components/LiveElementPins.js";
import { ElementPicker } from "./components/ElementPicker.js";
import { useLiveFeedback } from "./hooks/useLiveFeedback.js";
import { RevisionLabProvider } from "../RevisionLabProvider/index.js";
import { WidgetPanel } from "./components/WidgetPanel.js";
import { WidgetLauncher } from "./components/WidgetLauncher.js";
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
  const live = useLiveFeedback(route);
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
    live.setPicking(false);
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
      {data && live.picking && (
        <ElementPicker
          onCancel={() => {
            live.setPicking(false);
            setOpen(true);
          }}
          onSelect={(anchor) => {
            live.setAnchor(anchor);
            live.setSelected(null);
            live.setPicking(false);
            setTab("comment");
            setOpen(true);
          }}
        >
          {recorder.recording && (
            <RecordingActions
              recorder={recorder}
              onStop={() => void stopRecording()}
              onDiscard={() => {
                live.setPicking(false);
                navigation.requestDiscard();
              }}
            />
          )}
        </ElementPicker>
      )}
      {data && !open && !live.picking && live.showPins && (
        <LiveElementPins
          comments={pageComments}
          onSelect={(id) => {
            live.setSelected(id);
            live.setAnchor(null);
            setTab("comment");
            setOpen(true);
          }}
        />
      )}
      <Dialog.Root
        open={open}
        onOpenChange={(event) => {
          setOpen(event.open);
          if (event.open) live.setPicking(false);
        }}
        restoreFocus={!live.picking}
        motionPreset={live.picking ? "none" : "scale"}
        placement="center"
        size="sm"
        scrollBehavior="inside"
      >
        <WidgetLauncher
          recording={Boolean(recorder.recording)}
          count={recorder.recording?.count ?? 0}
          canRecord={Boolean(data && data.actor.role !== "commenter")}
          onRecord={() => {
            live.setPicking(false);
            setTab("record");
            setOpen(true);
            void refresh();
          }}
        />
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
                <WidgetPanel
                  workspace={workspace}
                  recorder={recorder}
                  basePath={basePath}
                  tab={tab}
                  onTabChange={setTab}
                >
                  <LiveFeedback
                    key={route}
                    apiPath={apiPath}
                    route={route}
                    comments={pageComments}
                    live={live}
                    onPick={() => {
                      live.setPicking(true);
                      setOpen(false);
                    }}
                    canResolve={Boolean(
                      data && data.actor.role !== "commenter",
                    )}
                    onRefresh={refresh}
                  />
                </WidgetPanel>
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
      {!open && !live.picking && recordingControls}
      {leaveDialog}
    </>
  );
}
