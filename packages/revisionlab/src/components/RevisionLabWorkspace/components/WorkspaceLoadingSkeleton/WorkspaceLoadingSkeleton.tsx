import { Box, Flex, Stack } from "@chakra-ui/react";
import type { WorkspaceSkeletonPage } from "../../../../workspace-view.js";
import { WorkspacePageSkeleton } from "../../../WorkspacePageSkeleton/index.js";
import { LoadingBar } from "./components/LoadingBar.js";
import { LoadingSidebar } from "./components/LoadingSidebar.js";

export function WorkspaceLoadingSkeleton({
  page = "dashboard",
}: {
  page?: WorkspaceSkeletonPage;
}) {
  const flows = page === "flows" || page === "flow-screen";
  const sessions = page === "sessions" || page === "session";
  const settings = page === "settings" || page === "settings-users";
  return (
    <Flex minH="100dvh" bg="bg.panel" direction={{ base: "column", lg: "row" }}>
      <LoadingSidebar />
      <Flex as="main" flex="1" minW="0" direction="column" aria-busy="true">
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
          borderColor="border"
          aria-hidden="true"
        >
          <Stack gap="2" flex="1" minW={{ base: "full", md: "48" }}>
            <LoadingBar h="6" w="56" maxW="full" />
            <LoadingBar h="3" w="80" maxW="full" />
          </Stack>
          <Flex gap="3" flexWrap="wrap" maxW="full">
            {(flows || sessions || page === "personas") && (
              <LoadingBar h="10" w={flows ? "32" : "36"} />
            )}
            {flows && <LoadingBar h="10" w="24" />}
            {page === "personas" && <LoadingBar h="10" w="40" />}
            <LoadingBar h="10" w="24" />
          </Flex>
          {settings && (
            <Flex w="full" gap={{ base: "2", md: "5" }} flexWrap="wrap" pt="2">
              {Array.from({ length: 8 }, (_, item) => (
                <LoadingBar
                  key={item}
                  h="6"
                  w={item === 7 ? "40" : "24"}
                  maxW="full"
                />
              ))}
            </Flex>
          )}
          {sessions && (
            <Flex w="full" gap="5" pt="2">
              <LoadingBar h="6" w="36" maxW="45%" />
              <LoadingBar h="6" w="36" maxW="45%" />
            </Flex>
          )}
        </Flex>
        <Box flex="1" minW="0">
          <WorkspacePageSkeleton page={page} />
        </Box>
      </Flex>
    </Flex>
  );
}
