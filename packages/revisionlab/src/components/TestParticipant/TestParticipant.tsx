"use client";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../client/api.js";
import type { TestSession } from "../../test-sessions.js";
import { ParticipantEntry } from "./ParticipantEntry.js";
import { recordTest } from "./capture.js";

export function TestParticipant({
  apiPath,
  children,
}: {
  apiPath: string;
  children: ReactNode;
}) {
  const [session, setSession] = useState<TestSession | null>();
  const clockOffset = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const refresh = useCallback(async () => {
    const result = await apiRequest<{
      session: TestSession | null;
      serverNow: number;
    }>(apiPath, "test-participant");
    setSession((previous) =>
      JSON.stringify(previous) === JSON.stringify(result.session)
        ? previous
        : result.session,
    );
    clockOffset.current = result.serverNow - Date.now();
    return result.session;
  }, [apiPath]);
  useEffect(() => {
    void Promise.resolve()
      .then(refresh)
      .catch(() => setSession(null));
  }, [refresh]);
  useEffect(() => {
    if (!session || session.status !== "live") return;
    const timer = setInterval(() => {
      void refresh().catch(() =>
        setError(
          "Connection lost. Recording is queued locally; keep this tab open.",
        ),
      );
    }, 2000);
    return () => clearInterval(timer);
  }, [session, refresh]);
  useEffect(() => {
    if (session?.status !== "live" || paused) return;
    let cleanup: (() => void) | undefined,
      release: (() => void) | undefined,
      disposed = false;
    const start = () => {
      if (disposed) return;
      cleanup = recordTest(
        apiPath,
        session,
        Date.now() + clockOffset.current,
        setError,
        (endSession) => {
          setPaused(true);
          const stop = endSession
            ? apiRequest(apiPath, "test-participant/stop", { method: "POST" })
            : Promise.resolve();
          void stop.then(refresh).catch(() => undefined);
        },
      );
    };
    // Queue the lock so a remount can wait for its own previous cleanup.
    // A second tab waits without collecting duplicate input.
    const controller = new AbortController();
    const waitingMessage =
      "This test is recording in another tab. Return to that tab, or close it to resume here.";
    const waiting = setTimeout(() => {
      if (!disposed) setError(waitingMessage);
    }, 500);
    if (navigator.locks) {
      void navigator.locks
        .request(
          `revisionlab-test:${session.id}`,
          { signal: controller.signal },
          async () => {
            clearTimeout(waiting);
            if (disposed) return;
            setError((previous) =>
              previous === waitingMessage ? "" : previous,
            );
            start();
            await new Promise<void>((resolve) => {
              release = resolve;
            });
          },
        )
        .catch((cause) => {
          if (!disposed)
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not acquire the recording tab.",
            );
        });
    } else {
      clearTimeout(waiting);
      queueMicrotask(() => {
        if (!disposed)
          setError(
            "Use a current browser over HTTPS or localhost to record this test.",
          );
      });
    }
    return () => {
      disposed = true;
      clearTimeout(waiting);
      controller.abort();
      cleanup?.();
      release?.();
    };
  }, [apiPath, session, paused, refresh, attempt]);

  async function start() {
    if (busy || !name.trim()) return;
    if (!navigator.locks || !crypto.randomUUID) {
      setError(
        "Use a current browser over HTTPS or localhost to start this test.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, "test-participant/start", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not start the test.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (session === undefined) return null;
  if (!session) return children;
  if (session.status === "live" && !error) return null;
  if (session.status === "waiting")
    return (
      <ParticipantEntry
        session={session}
        name={name}
        busy={busy}
        error={error}
        onName={setName}
        onStart={() => void start()}
      />
    );
  return (
    <Box position="fixed" bottom="4" right="4" zIndex="modal" p="4" maxW="full">
      <Stack
        bg="bg.panel"
        borderRadius="xl"
        shadow="lg"
        p="6"
        gap="4"
        maxW="md"
        w="full"
        role="status"
      >
        <Heading as="h2" size="lg">
          {session.status === "live"
            ? "Recording needs attention"
            : "Test session ended"}
        </Heading>
        {session.status !== "live" && (
          <Text>
            Thank you. Received recordings are saved for the organizer to
            review.
          </Text>
        )}
        {error && (
          <Text role="alert" color="red.fg">
            {error}
          </Text>
        )}
        {session.status === "live" && (
          <Button
            variant="outline"
            onClick={() => {
              setError("");
              setPaused(false);
              setAttempt((value) => value + 1);
              void refresh();
            }}
          >
            Retry recording
          </Button>
        )}
      </Stack>
    </Box>
  );
}
