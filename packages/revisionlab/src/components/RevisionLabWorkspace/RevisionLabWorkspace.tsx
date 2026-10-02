"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { apiRequest, ApiError } from "../../client/api.js";
import { useRevisionLab } from "../../client/useRevisionLab.js";
import { WorkspaceHeader } from "./components/WorkspaceHeader.js";
import { FlowHeaderActions } from "./components/FlowHeaderActions.js";
import { UsersRoleManager } from "../UsersRoleManager/index.js";
import { RevisionLabProvider } from "../RevisionLabProvider/index.js";
import type { WorkspaceView } from "./components/WorkspaceNavigation.js";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar.js";
import { PersonaManager } from "./components/PersonaManager.js";
import { AllComments } from "./components/AllComments.js";
import { FlowReview } from "./components/FlowReview.js";
import { EmptyWorkspace } from "./components/EmptyWorkspace.js";
import { WorkspaceSettings } from "./components/WorkspaceSettings.js";
import { defaultSettings } from "../../comment-settings.js";
import { useFlowDeletion } from "./hooks/useFlowDeletion.js";
import { workspaceViewTitles } from "./constants.js";

export interface RevisionLabWorkspaceProps {
  apiPath?: string;
  basePath?: string;
}

export function RevisionLabWorkspace({
  apiPath = "/api/revisionlab",
  basePath = "/revisionlab",
}: RevisionLabWorkspaceProps) {
  return (
    <RevisionLabProvider>
      <Suspense
        fallback={
          <Flex minH="100dvh" align="center" justify="center">
            <Spinner />
          </Flex>
        }
      >
        <Workspace apiPath={apiPath} basePath={basePath} />
      </Suspense>
    </RevisionLabProvider>
  );
}

function Workspace({ apiPath, basePath }: Required<RevisionLabWorkspaceProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const commentRoute = searchParams.get("route");
  const { data: loadedData, error, loading, refresh } = useRevisionLab(apiPath);
  const view: WorkspaceView =
    requestedView === "comments" ||
    requestedView === "personas" ||
    requestedView === "settings" ||
    (requestedView === "people" &&
      (!loadedData || loadedData.actor.role === "owner"))
      ? requestedView
      : "flows";
  const [flowId, setFlowId] = useState<string | null>(() =>
    searchParams.get("flow"),
  );
  const [signingOut, setSigningOut] = useState(false);
  const [startingRecording, setStartingRecording] = useState(false);
  const [actionError, setActionError] = useState("");
  const [boardNavigationError, setBoardNavigationError] = useState("");
  const [completingBoard, setCompletingBoard] = useState(false);
  const boardFlush = useRef<(() => Promise<boolean>) | null>(null);
  const checkingBoard = useRef(false);
  const registerBoardFlush = useCallback(
    (handler: (() => Promise<boolean>) | null) => {
      boardFlush.current = handler;
    },
    [],
  );
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
  // Pin the initial choice: polling may reorder flows when another editor saves.
  if (flow && flowId !== flow.id) setFlowId(flow.id);

  async function canLeaveBoard(): Promise<boolean> {
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

  async function selectView(next: WorkspaceView) {
    if (
      signingOut ||
      startingRecording ||
      deletion.pending ||
      !(await canLeaveBoard())
    )
      return false;
    if (next !== view)
      router.replace(`${basePath}?view=${next}`, { scroll: false });
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

  if (!data)
    return (
      <Flex minH="100dvh" align="center" justify="center" bg="gray.50" p="6">
        <Stack gap="5" maxW="md" w="full">
          <Heading as="h1" size="2xl">
            {workspaceViewTitles[view]}
          </Heading>
          {loading ? (
            <Flex gap="3" align="center">
              <Spinner />
              <Text>Opening your workspace…</Text>
            </Flex>
          ) : (
            <>
              <Text role="alert" color="gray.600">
                {error?.message}
              </Text>
              {error instanceof ApiError && error.status === 401 ? (
                <Button asChild colorPalette="blue">
                  <Link href={`${basePath}/access`}>Verify your email</Link>
                </Button>
              ) : (
                <Button onClick={() => void refresh()}>Try again</Button>
              )}
              <Link href="/" color="blue.700">
                <Icon>
                  <ArrowLeft />
                </Icon>
                Back to prototype
              </Link>
            </>
          )}
        </Stack>
      </Flex>
    );

  return (
    <Flex minH="100dvh" bg="white" direction={{ base: "column", lg: "row" }}>
      <WorkspaceSidebar
        data={data}
        view={view}
        selectedFlow={flow}
        onViewChange={selectView}
        onFlowSelect={selectFlow}
        onDeleteFlows={deletion.remove}
        disabled={
          completingBoard || signingOut || startingRecording || deletion.pending
        }
      />
      <Flex as="main" direction="column" flex="1" minW="0">
        <WorkspaceHeader
          data={data}
          view={view}
          flow={view === "flows" ? flow : undefined}
          onRefresh={refresh}
          onSignOut={signOut}
          signingOut={signingOut}
          actions={
            view === "flows" && flow && data.actor.role !== "commenter" ? (
              <FlowHeaderActions
                key={flow.id}
                flow={flow}
                versions={data.flows.filter(
                  (item) => item.familyId === flow.familyId,
                )}
                apiPath={apiPath}
                basePath={basePath}
                disabled={
                  completingBoard ||
                  signingOut ||
                  startingRecording ||
                  deletion.pending
                }
                beforeLeave={canLeaveBoard}
                onRecordingTransitionChange={setStartingRecording}
                onDeleteFlows={deletion.remove}
              />
            ) : undefined
          }
        />
        {(error || actionError || boardNavigationError) && (
          <Text role="alert" px="6" py="3" color="red.700" bg="red.50">
            {error?.message || actionError || boardNavigationError}
          </Text>
        )}
        {completingBoard && (
          <Text role="status" px="6" py="3" color="gray.600">
            Finishing board autosave…
          </Text>
        )}
        {view === "settings" ? (
          <WorkspaceSettings
            apiPath={apiPath}
            settings={data.settings ?? defaultSettings}
            canEdit={data.actor.role !== "commenter"}
            onRefresh={refresh}
          />
        ) : view === "personas" ? (
          <PersonaManager
            apiPath={apiPath}
            personas={data.personas ?? []}
            canEdit={data.actor.role !== "commenter"}
            canManageCredentials={data.actor.role === "owner"}
            onRefresh={refresh}
          />
        ) : view === "people" &&
          data.actor.role === "owner" &&
          data.accessSettings ? (
          <UsersRoleManager
            apiPath={apiPath}
            basePath={basePath}
            memberships={data.memberships}
            settings={data.accessSettings}
            onRefresh={refresh}
          />
        ) : view === "comments" ? (
          <AllComments
            key={commentRoute}
            data={data}
            apiPath={apiPath}
            onRefresh={refresh}
            route={commentRoute}
            basePath={basePath}
          />
        ) : (
          <Flex flex="1" minW="0" direction={{ base: "column", xl: "row" }}>
            {flow ? (
              <FlowReview
                key={flow.id}
                data={data}
                flow={flow}
                apiPath={apiPath}
                basePath={basePath}
                onFlowSelect={selectFlow}
                onRefresh={refresh}
                onBeforeLeaveChange={registerBoardFlush}
                onDirtyChange={boardDirtyChanged}
                navigationPending={
                  completingBoard ||
                  signingOut ||
                  startingRecording ||
                  deletion.pending
                }
              />
            ) : (
              <EmptyWorkspace canRecord={data.actor.role !== "commenter"} />
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
