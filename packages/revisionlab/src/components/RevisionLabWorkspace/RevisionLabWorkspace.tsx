"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft, Download, LogOut, RefreshCw } from "lucide-react";
import { apiRequest, ApiError } from "../../client/api.js";
import { useRevisionLab } from "../../client/useRevisionLab.js";
import { downloadReport } from "./utils.js";
import { InvitationManager } from "../InvitationManager/index.js";
import { RevisionLabProvider } from "../RevisionLabProvider/index.js";
import type { WorkspaceView } from "./components/WorkspaceNavigation.js";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar.js";
import { PersonaManager } from "./components/PersonaManager.js";
import { AllComments } from "./components/AllComments.js";
import { FlowReview } from "./components/FlowReview.js";
import { EmptyWorkspace } from "./components/EmptyWorkspace.js";

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
  const requestedView = useSearchParams().get("view");
  const view: WorkspaceView =
    requestedView === "comments" ||
    requestedView === "personas" ||
    requestedView === "people"
      ? requestedView
      : "flows";
  const { data, error, loading, refresh } = useRevisionLab(apiPath);
  const [flowId, setFlowId] = useState<string | null>(null);
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
  const flow = data?.flows.find((item) => item.id === flowId) ?? data?.flows[0];
  // Pin the initial choice: polling may reorder flows when another editor saves.
  if (flow && flowId === null) setFlowId(flow.id);

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
      startingRecording ||
      id === flow?.id ||
      !(await canLeaveBoard())
    )
      return;
    setFlowId(id);
  }

  async function selectView(next: WorkspaceView) {
    if (signingOut || startingRecording || !(await canLeaveBoard()))
      return false;
    if (next !== view)
      router.replace(`${basePath}?view=${next}`, { scroll: false });
    return true;
  }

  async function signOut() {
    if (signingOut || startingRecording) return;
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
            RevisionLab
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
      />
      <Flex as="main" direction="column" flex="1" minW="0">
        <Flex
          as="header"
          minH="20"
          px={{ base: "4", md: "6" }}
          py="4"
          justify="space-between"
          align="center"
          gap="3"
          flexWrap="wrap"
          borderBottomWidth="1px"
          borderColor="gray.200"
        >
          <Box>
            <Text fontWeight="semibold">{data.project.name}</Text>
            <Text fontSize="xs" color="gray.600">
              Screens, versions, and feedback in one place
            </Text>
          </Box>
          <Flex gap="2" flexWrap="wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadReport(data)}
            >
              <Icon>
                <Download />
              </Icon>
              Export report
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void refresh()}>
              <Icon>
                <RefreshCw />
              </Icon>
              Refresh
            </Button>
            {!data.actor.local && (
              <Button
                size="sm"
                variant="ghost"
                loading={signingOut}
                onClick={() => void signOut()}
              >
                <Icon>
                  <LogOut />
                </Icon>
                Sign out
              </Button>
            )}
          </Flex>
        </Flex>
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
        {view === "personas" ? (
          <PersonaManager
            apiPath={apiPath}
            personas={data.personas ?? []}
            canEdit={data.actor.role !== "commenter"}
            onRefresh={refresh}
          />
        ) : view === "people" && data.actor.role === "owner" ? (
          <Box p={{ base: "5", md: "8" }} maxW="5xl">
            <InvitationManager
              apiPath={apiPath}
              invitations={data.invitations}
              onRefresh={refresh}
            />
          </Box>
        ) : view === "comments" ? (
          <AllComments data={data} apiPath={apiPath} onRefresh={refresh} />
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
                  completingBoard || signingOut || startingRecording
                }
                onRecordingTransitionChange={setStartingRecording}
                beforeLeave={canLeaveBoard}
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
