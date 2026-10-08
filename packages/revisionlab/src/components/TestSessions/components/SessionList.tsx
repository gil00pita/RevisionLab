import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { RevisionLabActor } from "../../../server/types.js";
import type { TestSession } from "../../../test-sessions.js";
import type { SessionGroup } from "../types.js";

export function SessionList({
  sessions,
  group,
  actor,
  selected,
  loading,
  stopping,
  onSelect,
  onStop,
}: {
  sessions: TestSession[];
  group: SessionGroup;
  actor: RevisionLabActor;
  selected: string | null;
  loading: boolean;
  stopping: boolean;
  onSelect: (id: string) => void;
  onStop: (session: TestSession) => void;
}) {
  return (
    <Stack gap="3">
      {!loading && !sessions.length && (
        <IllustratedEmptyState
          illustration="inbox"
          description={group === "current"
            ? "Create a test link to invite your first participant."
            : "Completed and expired tests will appear here."}
        />
      )}
      {sessions.map((session) => (
        <Flex
          key={session.id}
          p="4"
          borderWidth="1px"
          borderColor={selected === session.id ? "blue.border" : "border"}
          borderRadius="lg"
          align="center"
          justify="space-between"
          gap="4"
          flexWrap="wrap"
        >
          <Box>
            <Heading as="h2" size="sm" overflowWrap="anywhere">
              {session.name}
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              {session.participant ?? "Waiting for participant"} ·{" "}
              {session.maxMinutes} min maximum
            </Text>
            <Text color="fg.muted" fontSize="xs">
              Created {new Date(session.createdAt).toLocaleString()}
              {session.status === "live"
                ? ` · Ends ${new Date(session.expiresAt).toLocaleTimeString()}`
                : ""}
            </Text>
          </Box>
          <Flex gap="2" align="center" flexWrap="wrap">
            <Badge
              colorPalette={session.status === "live" ? "green" : "gray"}
            >
              {session.status === "live" ? "Live" : session.status}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onSelect(session.id);
              }}
            >
              View session
            </Button>
            {["waiting", "live"].includes(session.status) &&
              actor.role !== "commenter" &&
              (session.createdBy === actor.id ||
                actor.role === "owner") && (
                <Button
                  size="sm"
                  colorPalette="red"
                  variant="outline"
                  loading={stopping}
                  onClick={() => onStop(session)}
                >
                  {session.status === "waiting"
                    ? "Revoke link"
                    : "Stop session"}
                </Button>
              )}
          </Flex>
        </Flex>
      ))}
    </Stack>
  );
}
