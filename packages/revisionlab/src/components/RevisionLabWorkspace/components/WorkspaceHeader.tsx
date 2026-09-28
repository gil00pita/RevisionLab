import type { ReactNode } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Text,
} from "@chakra-ui/react";
import { Download, LogOut, RefreshCw } from "lucide-react";
import type {
  RevisionLabFlow,
  RevisionLabState,
} from "../../../server/types.js";
import { downloadReport } from "../utils.js";

export function WorkspaceHeader({
  data,
  flow,
  actions,
  onRefresh,
  onSignOut,
  signingOut,
}: {
  data: RevisionLabState;
  flow?: RevisionLabFlow;
  actions?: ReactNode;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
  signingOut: boolean;
}) {
  return (
    <Flex
      as="header"
      minH="20"
      px={{ base: "4", md: "6" }}
      py="4"
      justify="space-between"
      align="center"
      gap="4"
      flexWrap="wrap"
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Box flex="1" minW={{ base: "full", md: "48" }}>
        <Heading as="h1" size="lg" overflowWrap="anywhere">
          {flow?.name ?? data.project.name}
        </Heading>
        {flow ? (
          <Flex gap="2" mt="2" align="center" flexWrap="wrap">
            <Badge
              colorPalette="blue"
              maxW="full"
              whiteSpace="normal"
              overflowWrap="anywhere"
            >
              {flow.persona}
            </Badge>
            <Badge
              colorPalette={flow.status === "complete" ? "green" : "orange"}
            >
              {flow.status === "complete" ? "Recorded" : "Recording"}
            </Badge>
            <Text color="gray.600" fontSize="xs">
              {flow.steps.length}{" "}
              {flow.steps.length === 1 ? "screen" : "screens"}
            </Text>
          </Flex>
        ) : (
          <Text fontSize="xs" color="gray.600">
            Screens, versions, and feedback in one place
          </Text>
        )}
      </Box>
      <Flex gap="3" align="center" flexWrap="wrap" maxW="full">
        {actions}
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
          <Button size="sm" variant="ghost" onClick={() => void onRefresh()}>
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
              onClick={() => void onSignOut()}
            >
              <Icon>
                <LogOut />
              </Icon>
              Sign out
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
