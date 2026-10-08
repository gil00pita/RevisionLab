"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { Portal, Stack, Tabs, Text } from "@chakra-ui/react";
import type {
  RevisionLabState,
  RevisionLabPersona,
} from "../../server/types.js";
import type { TestDetail, TestSession } from "../../test-sessions.js";
import { apiRequest } from "../../client/api.js";
import { SessionList } from "./components/SessionList.js";
import { NewTestSession } from "./components/NewTestSession.js";
import { SessionDetails } from "./components/SessionDetails.js";
import { SessionTabs } from "./components/SessionTabs.js";
import type { SessionGroup } from "./types.js";

export function TestSessions({
  apiPath,
  headerContainer,
  basePath,
  data,
  creating,
  onCreatingChange,
}: {
  apiPath: string;
  headerContainer: RefObject<HTMLDivElement | null>;
  basePath: string;
  data: RevisionLabState;
  creating: boolean;
  onCreatingChange: (creating: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const initialSession = useRef(searchParams.get("session"));
  const tabChosen = useRef(false);
  const [group, setGroup] = useState<SessionGroup>("current");
  const [personas, setPersonas] = useState<RevisionLabPersona[]>([]);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [selected, setSelected] = useState<string | null>(() =>
    searchParams.get("session"),
  );
  const [detail, setDetail] = useState<TestDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const result = await apiRequest<{
        sessions: TestSession[];
        personas: RevisionLabPersona[];
      }>(apiPath, "test-sessions");
      setSessions(result.sessions);
      setPersonas(result.personas);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load sessions.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiPath]);
  useEffect(() => {
    void Promise.resolve().then(refresh);
    const timer = setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const load = async () => {
      try {
        const result = await apiRequest<TestDetail>(
          apiPath,
          `test-sessions/${selected}`,
        );
        if (!cancelled) {
          setDetail(result);
          if (!tabChosen.current && result.session.id === initialSession.current) {
            tabChosen.current = true;
            setGroup(
              result.session.status === "completed" || result.session.status === "expired"
                ? "previous"
                : "current",
            );
          }
        }
      } catch (cause) {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the replay.",
          );
      }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [apiPath, selected]);
  async function stop(session: TestSession) {
    setStopping(true);
    try {
      await apiRequest(apiPath, `test-sessions/${session.id}/stop`, {
        method: "POST",
      });
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not stop the session.",
      );
    } finally {
      setStopping(false);
    }
  }
  const current = sessions.filter(
    (session) => session.status === "waiting" || session.status === "live",
  );
  const previous = sessions.filter(
    (session) => session.status === "completed" || session.status === "expired",
  );

  function selectSession(id: string) {
    if (selected !== id) {
      setSelected(id);
      setDetail(null);
    }
  }

  return (
    <Tabs.Root
      value={group}
      onValueChange={(event) => {
        tabChosen.current = true;
        if (event.value === "current" || event.value === "previous")
          setGroup(event.value);
      }}
      colorPalette="blue"
      variant="line"
      w="full"
    >
      <Portal container={headerContainer}>
        <SessionTabs current={current.length} previous={previous.length} />
      </Portal>
      <Stack p={{ base: "4", md: "6" }} gap="6" maxW="7xl" w="full">
        <Text color="fg.muted">
          Tests for this installation · links, live activity, and saved replays.
        </Text>
        {creating && data.actor.role !== "commenter" && (
          <NewTestSession
            apiPath={apiPath}
            personas={personas}
            onCreated={() => void refresh()}
            onCancel={() => onCreatingChange(false)}
          />
        )}
        {error && (
          <Text role="alert" color="red.fg">{error}</Text>
        )}
        {loading && <Text role="status">Loading test sessions…</Text>}
        {[
          { value: "current" as const, sessions: current },
          { value: "previous" as const, sessions: previous },
        ].map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value} p="0">
            <SessionList
              group={tab.value}
              sessions={tab.sessions}
              actor={data.actor}
              selected={selected}
              loading={loading}
              stopping={stopping}
              onSelect={selectSession}
              onStop={(session) => void stop(session)}
            />
          </Tabs.Content>
        ))}
        {selected && (
          <SessionDetails
            detail={detail}
            basePath={basePath}
            onClose={() => {
              setSelected(null);
              setDetail(null);
            }}
          />
        )}
      </Stack>
    </Tabs.Root>
  );
}
