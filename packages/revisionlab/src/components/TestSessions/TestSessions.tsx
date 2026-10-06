"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import type {
  RevisionLabState,
  RevisionLabPersona,
} from "../../server/types.js";
import type { TestDetail, TestSession } from "../../test-sessions.js";
import { apiRequest } from "../../client/api.js";
import { SessionList } from "./components/SessionList.js";
import { NewTestSession } from "./components/NewTestSession.js";
import { SessionReplay } from "./components/SessionReplay.js";

export function TestSessions({
  apiPath,
  basePath,
  data,
  initialCreate,
}: {
  apiPath: string;
  basePath: string;
  data: RevisionLabState;
  initialCreate: boolean;
}) {
  const searchParams = useSearchParams();
  const [personas, setPersonas] = useState<RevisionLabPersona[]>([]);
  const [creating, setCreating] = useState(initialCreate);
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
        if (!cancelled) setDetail(result);
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
  return (
    <Stack p={{ base: "4", md: "6" }} gap="6" maxW="7xl" w="full">
      <Flex align="center" justify="space-between" gap="3" flexWrap="wrap">
        <Text color="gray.600">
          Tests for this installation · links, live activity, and saved replays.
        </Text>
        {data.actor.role !== "commenter" && !creating && (
          <Button onClick={() => setCreating(true)}>New test session</Button>
        )}
      </Flex>
      {creating && (
        <NewTestSession
          apiPath={apiPath}
          personas={personas}
          onCreated={() => void refresh()}
          onCancel={() => setCreating(false)}
        />
      )}
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      {loading && <Text role="status">Loading test sessions…</Text>}
      <SessionList
        sessions={sessions}
        actor={data.actor}
        selected={selected}
        loading={loading}
        stopping={stopping}
        onSelect={(id) => {
          if (selected !== id) {
            setSelected(id);
            setDetail(null);
          }
        }}
        onStop={(session) => void stop(session)}
      />
      {selected && (
        <Stack gap="4" borderTopWidth="1px" borderColor="gray.200" pt="6">
          <Flex gap="3" align="center" justify="space-between">
            <Heading as="h2" size="lg">
              {detail?.session.name ?? "Loading session…"}
            </Heading>
            <Button
              variant="ghost"
              onClick={() => {
                setSelected(null);
                setDetail(null);
              }}
            >
              Close details
            </Button>
          </Flex>
          {detail && (
            <>
              <Text>{detail.session.participant ?? "No participant yet"}</Text>
              {detail.session.flowId && (
                <Link
                  color="blue.700"
                  href={`${basePath}?${new URLSearchParams({ view: "flows", flow: detail.session.flowId, workspace: "local" })}`}
                >
                  View recorded flow
                </Link>
              )}
              <SessionReplay key={detail.session.id} detail={detail} />
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}
