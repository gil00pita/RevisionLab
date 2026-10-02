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

export function SessionList({
  sessions,
  actor,
  selected,
  loading,
  stopping,
  onSelect,
  onStop,
}: {
  sessions: TestSession[];
  actor: RevisionLabActor;
  selected: string | null;
  loading: boolean;
  stopping: boolean;
  onSelect: (id: string) => void;
  onStop: (session: TestSession) => void;
}) {
  const active = sessions.filter(
    (session) => session.status === "waiting" || session.status === "live",
  );
  const previous = sessions.filter(
    (session) => session.status === "completed" || session.status === "expired",
  );
  return (
    <>
      {[
        { title: "Current sessions", items: active },
        { title: "Previous sessions", items: previous },
      ].map((group) => (
        <Stack key={group.title} gap="3">
          <Heading as="h2" size="md">
            {group.title} ({group.items.length})
          </Heading>
          {!loading && !group.items.length && (
            <Text color="gray.600">
              {group.title === "Current sessions"
                ? "Create a test link to invite your first participant."
                : "Completed and expired tests will appear here."}
            </Text>
          )}
          {group.items.map((session) => (
            <Flex
              key={session.id}
              p="4"
              borderWidth="1px"
              borderColor={selected === session.id ? "blue.500" : "gray.200"}
              borderRadius="lg"
              align="center"
              justify="space-between"
              gap="4"
              flexWrap="wrap"
            >
              <Box>
                <Heading as="h3" size="sm">
                  {session.name}
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {session.participant ?? "Waiting for participant"} ·{" "}
                  {session.maxMinutes} min maximum
                </Text>
                <Text color="gray.600" fontSize="xs">
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
      ))}
    </>
  );
}
