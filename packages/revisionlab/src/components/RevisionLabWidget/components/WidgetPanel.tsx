import type { ReactNode } from "react";
import {
  Button,
  Flex,
  Icon,
  Link,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Camera, MessageSquare } from "lucide-react";
import { ApiError } from "../../../client/api.js";
import type { useRevisionLab } from "../../../client/useRevisionLab.js";
import type { useRecording } from "../hooks/useRecording.js";
import { RecorderPanel } from "./RecorderPanel.js";

export function WidgetPanel({
  workspace,
  recorder,
  basePath,
  tab,
  onTabChange,
  children,
}: {
  workspace: ReturnType<typeof useRevisionLab>;
  recorder: ReturnType<typeof useRecording>;
  basePath: string;
  tab: "comment" | "record";
  onTabChange: (tab: "comment" | "record") => void;
  children: ReactNode;
}) {
  const { data, error, loading, refresh } = workspace;
  const unauthenticated = error instanceof ApiError && error.status === 401;
  if (loading)
    return (
      <Flex py="10" gap="3" align="center">
        <Spinner />
        <Text>Connecting to the workspace…</Text>
      </Flex>
    );
  if (!data)
    return (
      <Stack gap="4" py="4">
        <Text role="alert" color={unauthenticated ? "gray.600" : "red.700"}>
          {error?.message ?? "Unable to connect."}
        </Text>
        {unauthenticated ? (
          <Link href={`${basePath}/access`} color="blue.700">
            Verify your email to review
          </Link>
        ) : (
          <Button onClick={() => void refresh()} variant="outline">
            Try again
          </Button>
        )}
      </Stack>
    );
  return (
    <Stack gap="5">
      <Flex gap="2" role="group" aria-label="Review tools">
        <Button
          flex="1"
          size="sm"
          variant={tab === "comment" ? "solid" : "outline"}
          aria-pressed={tab === "comment"}
          onClick={() => onTabChange("comment")}
        >
          <Icon>
            <MessageSquare />
          </Icon>
          Comment
        </Button>
        {data.actor.role !== "commenter" && (
          <Button
            flex="1"
            size="sm"
            variant={tab === "record" ? "solid" : "outline"}
            aria-pressed={tab === "record"}
            onClick={() => onTabChange("record")}
          >
            <Icon>
              <Camera />
            </Icon>
            Record
          </Button>
        )}
      </Flex>
      {tab === "record" && data.actor.role !== "commenter" ? (
        <RecorderPanel
          recorder={recorder}
          personas={data.personas ?? []}
          basePath={basePath}
        />
      ) : (
        children
      )}
      <Separator />
      <Text color="gray.600" fontSize="xs">
        Reviewing as {data.actor.name} · {data.actor.role}
      </Text>
    </Stack>
  );
}
