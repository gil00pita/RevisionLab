"use client";

import { EmptyStateIllustration } from "../EmptyStateIllustration/index.js";

import { TestSessions } from "../TestSessions/index.js";
import { FeedbackReview } from "../FeedbackReview/index.js";
import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { apiRequest, ApiError } from "../../client/api.js";
import { useWorkspaceData } from "./hooks/useWorkspaceData.js";
import { sourceApiPath, sourceCanEdit } from "../../workspace-instances.js";
import { WorkspaceHeader } from "./components/WorkspaceHeader.js";
import { WorkspaceSyncToast } from "./components/WorkspaceSyncToast/index.js";
import { FlowHeaderActions } from "./components/FlowHeaderActions.js";
import { RecordFlowAction } from "./components/RecordFlowAction.js";
import { RevisionLabProvider } from "../RevisionLabProvider/index.js";
import type { WorkspaceView } from "./components/WorkspaceNavigation.js";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar.js";
import { WorkspacePersonas, type WorkspacePersonaEditor } from "./components/WorkspacePersonas.js";
import { FlowReview } from "./components/FlowReview.js";
import { EmptyWorkspace } from "./components/EmptyWorkspace.js";
import { WorkspaceSettings } from "./components/WorkspaceSettings.js";
import { SetupWizard } from "./components/SetupWizard.js";
import { defaultSettings } from "../../comment-settings.js";
import { useFlowDeletion } from "./hooks/useFlowDeletion.js";
import { workspaceViewTitles } from "./constants.js";
import { WorkspaceDashboard } from "./components/WorkspaceDashboard.js";
import { getWorkspaceView, getWorkspaceSkeletonPage } from "../../workspace-view.js";
import { WorkspaceLoadingSkeleton, WorkspaceLoadingFallback } from "./components/WorkspaceLoadingSkeleton/index.js";

export interface RevisionLabWorkspaceProps {
  apiPath?: string;
  basePath?: string;
  /** Supply the server route query so the first loading shell matches deep links. */
  initialSearch?: string;
}

export function RevisionLabWorkspace({
  apiPath = "/api/revisionlab",
  basePath = "/revisionlab",
  initialSearch,
}: RevisionLabWorkspaceProps) {
  return (
    <RevisionLabProvider>
      <Suspense fallback={<WorkspaceLoadingFallback initialSearch={initialSearch} />}>
        <Workspace apiPath={apiPath} basePath={basePath} />
      </Suspense>
    </RevisionLabProvider>
  );
}

function Workspace({ apiPath, basePath }: Required<Pick<RevisionLabWorkspaceProps, "apiPath" | "basePath">>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyPeopleView = searchParams.get("view") === "people";
  const commentRoute = searchParams.get("route");
  const selection = searchParams.get("workspace") ?? "local";
  const {
    data: loadedData,
    error,
    loading,
    refresh,
    syncedAt,
  } = useWorkspaceData(apiPath, selection);
  const view: WorkspaceView = getWorkspaceView(searchParams);
  const [flowId, setFlowId] = useState<string | null>(() =>
    searchParams.get("flow"),
  );
  const [createTest, setCreateTest] = useState(false);
  const [personaEditor, setPersonaEditor] = useState<WorkspacePersonaEditor | null>(null);
  const [personaBusy, setPersonaBusy] = useState(false);
  const creationTrigger = useRef<HTMLButtonElement>(null);
  const sessionTabsHeader = useRef<HTMLDivElement>(null);
  const settingsTabsHeader = useRef<HTMLDivElement>(null);
  const [setupFinished, setSetupFinished] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [startingRecording, setStartingRecording] = useState(false);
  const [actionError, setActionError] = useState("");
  const [boardNavigationError, setBoardNavigationError] = useState("");
  const [feedbackDirty, setFeedbackDirty] = useState(false);
  const feedbackDirtyChanged = useCallback((dirty: boolean) => {
    setFeedbackDirty(dirty);
    if (!dirty) setBoardNavigationError("");
  }, []);
  const [completingBoard, setCompletingBoard] = useState(false);
  const boardFlush = useRef<(() => Promise<boolean>) | null>(null);
  const checkingBoard = useRef(false);
  const boardDirtyChanged = useCallback((dirty: boolean) => {
    if (!dirty) setBoardNavigationError("");
  }, []);
  const deletion = useFlowDeletion({
    data: loadedData,
    apiPath,
    blocked: signingOut || startingRecording,
    beforeDelete: canLeaveBoard,
    onRefresh: refresh,
  });
  const data = deletion.data;
  const flow = data?.flows.find((item) => item.id === flowId) ?? data?.flows[0];
  const sourceUnavailable =
    data?.workspaces.some(
      (source) =>
        source.id === flow?.workspace?.id && source.status === "unavailable",
    ) ?? false;
  // Pin the initial choice: polling may reorder flows when another editor saves.
  if (flow && flowId !== flow.id) setFlowId(flow.id);

  async function canLeaveBoard(): Promise<boolean> {
    if (personaBusy) return false;
    if (feedbackDirty) {
      setBoardNavigationError(
        "Save or discard your Feedback Review edits, or finish/cancel Codex, before leaving this section.",
      );
      return false;
    }
    if (checkingBoard.current) return false;
    if (!boardFlush.current) return true;
    checkingBoard.current = true;
    setCompletingBoard(true);
    setBoardNavigationError("");
    try {
      const saved = await boardFlush.current();
      if (!saved)
        setBoardNavigationError(
          "Your board changes have not finished saving. Resolve the autosave error before leaving this flow.",
        );
      return saved;
    } catch {
      setBoardNavigationError(
        "Could not finish autosaving. Your changes are still on the board; retry before leaving.",
      );
      return false;
    } finally {
      checkingBoard.current = false;
      setCompletingBoard(false);
    }
  }

  async function selectFlow(id: string) {
    if (
      signingOut ||
      deletion.pending ||
      startingRecording ||
      id === flow?.id ||
      !(await canLeaveBoard())
    )
      return;
    setFlowId(id);
  }

  async function selectWorkspace(next: string) {
    if (
      signingOut ||
      startingRecording ||
      deletion.pending ||
      !(await canLeaveBoard())
    )
      return;
    setPersonaEditor(null);
    const query = new URLSearchParams(searchParams.toString());
    query.set("workspace", next);
    query.delete("flow");
    query.delete("route");
    query.delete("comment");
    router.replace(`${basePath}?${query}`, { scroll: false });
    setFlowId(null);
  }

  async function selectView(next: WorkspaceView) {
    if (
      signingOut ||
      startingRecording ||
      deletion.pending ||
      !(await canLeaveBoard())
    )
      return false;
    if (next !== view || searchParams.has("route") || searchParams.has("comment")) {
      setPersonaEditor(null);
      // Sections share this mounted workspace; sync search params without a
      // server navigation or replacing the sidebar and its local state.
      const query = new URLSearchParams(searchParams.toString());
      query.set("view", next);
      query.set("workspace", selection);
      query.delete("flow");
      query.delete("route");
      query.delete("comment");
      window.history.replaceState(null, "", `${basePath}?${query}`);
    }
    return true;
  }

  async function signOut() {
    if (signingOut || startingRecording || deletion.pending) return;
    setSigningOut(true);
    if (!(await canLeaveBoard())) {
      setSigningOut(false);
      return;
    }
    try {
      await apiRequest(apiPath, "auth/logout", { method: "POST" });
      router.push(`${basePath}/access`);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not sign out.",
      );
      setSigningOut(false);
    }
  }

  if (!data && loading)
    return <WorkspaceLoadingSkeleton page={getWorkspaceSkeletonPage(searchParams)} />;

  if (!data)
    return (
      <Flex minH="100dvh" align="center" justify="center" bg="bg.subtle" p="6">
        <Stack gap="5" maxW="md" w="full">
          <EmptyStateIllustration variant={error instanceof TypeError || (error instanceof ApiError && error.status === 503) ? "connection" : "error"} />
          <Heading as="h1" size="2xl">
            {workspaceViewTitles[view]}
          </Heading>
          <Text role="alert" color="fg.muted">
            {error?.message}
          </Text>
          {error instanceof ApiError && error.status === 401 ? (
            <Button asChild colorPalette="blue">
              <Link href={`${basePath}/access`}>Verify your email</Link>
            </Button>
          ) : (
            <Button onClick={() => void refresh()}>Try again</Button>
          )}
          {selection !== "local" && (
            <Link href={basePath} color="blue.fg">
              Open this workspace
            </Link>
          )}
          <Link href="/" color="blue.fg">
            <Icon>
              <ArrowLeft />
            </Icon>
            Back to prototype
          </Link>
        </Stack>
      </Flex>
    );

  if (!data.setup.completed && !setupFinished)
    return (
      <SetupWizard
        onComplete={() => setSetupFinished(true)}
        data={data}
        apiPath={apiPath}
        basePath={basePath}
        onRefresh={refresh}
      />
    );

  const navigationPending = completingBoard || signingOut || startingRecording || deletion.pending || personaBusy;
  const personaSource = data.workspaces.find((source) => source.id === (selection === "all" ? "local" : selection));

  return (
    <Flex minH="100dvh" bg="bg.panel" direction={{ base: "column", lg: "row" }}>
      <WorkspaceSyncToast key={selection} data={data} syncError={Boolean(error)} />
      <WorkspaceSidebar
        basePath={basePath}
        apiPath={apiPath}
        onRefresh={refresh}
        workspaces={data.workspaces}
        selection={selection}
        onWorkspaceChange={(next) => void selectWorkspace(next)}
        data={data}
        view={view}
        selectedFlow={flow}
        onViewChange={selectView}
        onFlowSelect={selectFlow}
        onDeleteFlows={deletion.remove}
        disabled={navigationPending}
        syncError={Boolean(error)}
      />
      <Flex as="main" direction="column" flex="1" minW="0">
        <WorkspaceHeader
          data={data}
          view={view}
          flow={view === "flows" ? flow : undefined}
          creationTriggerRef={creationTrigger}
          tabsRef={
            view === "sessions"
              ? sessionTabsHeader
              : view === "settings"
                ? settingsTabsHeader
                : undefined
          }
          creationAction={
            view === "personas" && personaSource && sourceCanEdit(data.actor.role, personaSource)
              ? {
                  kind: "persona",
                  apiPath: sourceApiPath(apiPath, personaSource),
                  disabled: navigationPending || personaEditor !== null || personaSource.status === "unavailable",
                  onClick: () => setPersonaEditor({ sourceId: personaSource.id }),
                  onSelectTemplate: (template) => setPersonaEditor({ sourceId: personaSource.id, template }),
                }
              : view === "sessions" && data.actor.role !== "commenter"
                ? { kind: "test", disabled: navigationPending || createTest, onClick: () => setCreateTest(true) }
                : undefined
          }
          onSignOut={signOut}
          signingOut={signingOut}
          actions={
            view === "flows" &&
            flow &&
            sourceCanEdit(data.actor.role, flow.workspace) ? (
              <FlowHeaderActions
                key={flow.id}
                flow={flow}
                versions={data.flows.filter(
                  (item) => item.familyId === flow.familyId,
                )}
                apiPath={apiPath}
                basePath={basePath}
                disabled={
                  sourceUnavailable ||
                  completingBoard ||
                  signingOut ||
                  startingRecording ||
                  deletion.pending
                }
                beforeLeave={canLeaveBoard}
                onRecordingTransitionChange={setStartingRecording}
                onDeleteFlows={deletion.remove}
              />
            ) : view === "flows" && !flow && personaSource && sourceCanEdit(data.actor.role, personaSource) ? (
              <RecordFlowAction prototypeUrl={personaSource.url} disabled={navigationPending || personaSource.status === "unavailable"} />
            ) : undefined
          }
        />
        {(actionError || boardNavigationError) && (
          <Text role="alert" px="6" py="3" color="red.fg" bg="red.subtle">
            {actionError || boardNavigationError}
          </Text>
        )}
        {data.workspaces
          .filter((source) => source.status === "unavailable")
          .map((source) => (
            <Text
              key={source.id}
              role="alert"
              px="6"
              py="3"
              bg="orange.subtle"
              color="orange.fg"
            >
              {source.name}: {source.error} Showing any last-loaded data; this
              workspace is unavailable. Automatic updates will retry.
            </Text>
          ))}
        {completingBoard && (
          <Text role="status" px="6" py="3" color="fg.muted">
            Finishing board autosave…
          </Text>
        )}
        {view === "dashboard" ? (
          <WorkspaceDashboard
            data={data}
            syncedAt={syncedAt}
            syncError={Boolean(error)}
            onReviewFeedback={() => void selectView("feedback")}
            navigationDisabled={
              completingBoard ||
              signingOut ||
              startingRecording ||
              deletion.pending
            }
          />
        ) : view === "feedback" ? (
          <FeedbackReview
            commentId={searchParams.get("comment")}
            route={commentRoute}
            onClearRoute={() => void selectView("feedback")}
            onCloseComment={() => {
              const query = new URLSearchParams(searchParams.toString());
              query.set("view", "feedback");
              query.delete("comment");
              window.history.replaceState(null, "", `${basePath}?${query}`);
            }}
            data={data}
            apiPath={apiPath}
            basePath={basePath}
            onDirtyChange={feedbackDirtyChanged}
            onRefresh={refresh}
          />
        ) : view === "sessions" ? (
          <TestSessions
            headerContainer={sessionTabsHeader}
            apiPath={apiPath}
            basePath={basePath}
            data={data}
            creating={createTest}
            onCreatingChange={(creating) => {
              setCreateTest(creating);
              if (!creating) requestAnimationFrame(() => creationTrigger.current?.focus());
            }}
          />
        ) : view === "settings" ? (
          <WorkspaceSettings
            headerContainer={settingsTabsHeader}
            key={selection}
            apiPath={sourceApiPath(apiPath, data.settingsWorkspace)}
            managementApiPath={apiPath}
            projectName={data.project.name}
            workspaces={data.workspaces}
            settingsWorkspace={data.settingsWorkspace}
            selection={selection}
            actorRole={data.actor.role}
            onInstanceRemoved={(id) => {
              if (selection === id) void selectWorkspace("local");
            }}
            settings={data.settings ?? defaultSettings}
            invitations={
              data.actor.role === "owner" ? data.invitations : undefined
            }
            memberships={data.memberships}
            accessSettings={data.accessSettings}
            basePath={basePath}
            initialTab={legacyPeopleView ? "users" : "system"}
            canEdit={
              sourceCanEdit(data.actor.role, data.settingsWorkspace) &&
              data.settingsWorkspace?.status !== "unavailable"
            }
            onRefresh={refresh}
          />
        ) : view === "personas" ? (
          <WorkspacePersonas
            key={selection}
            editor={personaEditor}
            onEditorChange={(editor) => {
              setPersonaEditor(editor);
              if (!editor) requestAnimationFrame(() => creationTrigger.current?.focus());
            }}
            onBusyChange={setPersonaBusy}
            disabled={navigationPending}
            data={data}
            apiPath={apiPath}
            onRefresh={refresh}
          />
        ) : (
          <Flex flex="1" minW="0" direction={{ base: "column", xl: "row" }}>
            {flow ? (
              <FlowReview
                key={flow.id}
                data={data}
                flow={flow}
                apiPath={sourceApiPath(apiPath, flow.workspace)}
                basePath={basePath}
                onFlowSelect={selectFlow}
                onRefresh={refresh}
                beforeLeaveRef={boardFlush}
                onDirtyChange={boardDirtyChanged}
                navigationPending={
                  sourceUnavailable ||
                  completingBoard ||
                  signingOut ||
                  startingRecording ||
                  deletion.pending
                }
              />
            ) : (
              <EmptyWorkspace
                unavailable={data.workspaces.some(
                  (source) => source.status === "unavailable",
                )}
                prototypeUrl={
                  data.workspaces.find((source) => source.id === selection)?.url
                }
                canRecord={
                  data.actor.role !== "commenter" && selection === "local"
                }
              />
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
