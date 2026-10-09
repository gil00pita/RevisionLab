import { Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import type { TestDetail } from "../../../test-sessions.js";
import { WorkspacePageSkeleton } from "../../WorkspacePageSkeleton/index.js";
import { SessionReplay } from "./SessionReplay.js";

export function SessionDetails({
  detail,
  error,
  basePath,
  onClose,
}: {
  detail: TestDetail | null;
  error: string;
  basePath: string;
  onClose: () => void;
}) {
  if (!detail && !error) return <WorkspacePageSkeleton page="session-detail" variant="content" />;

  const flowId = detail?.session.flowId;
  const flowHref = flowId
    ? `${basePath}?${new URLSearchParams({ view: "flows", flow: flowId, workspace: "local" })}`
    : undefined;

  return (
    <Stack gap="4" borderTopWidth="1px" borderColor="border" pt="6">
      <Flex gap="3" align="center" justify="space-between" flexWrap="wrap">
        <Heading as="h2" size="lg" overflowWrap="anywhere">
          {detail?.session.name ?? "Session details"}
        </Heading>
        <Button variant="ghost" onClick={onClose}>
          Close details
        </Button>
      </Flex>
      {detail && (
        <>
          <Text>{detail.session.participant ?? "No participant yet"}</Text>
          {flowHref && (
            <Link color="blue.fg" href={flowHref}>
              View recorded flow
            </Link>
          )}
          <SessionReplay key={detail.session.id} detail={detail} />
        </>
      )}
    </Stack>
  );
}
