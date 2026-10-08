import { Box, Flex, Heading, Text, VisuallyHidden } from "@chakra-ui/react";
import { LoadingDashboard } from "./components/LoadingDashboard.js";
import { LoadingSidebar } from "./components/LoadingSidebar.js";

export function WorkspaceLoadingSkeleton({
  title = "Overview",
}: {
  title?: string;
}) {
  return (
    <>
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        Opening your workspace…
      </VisuallyHidden>
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
          >
            <Box flex="1" minW={{ base: "full", md: "48" }}>
              <Heading as="h1" size="lg" overflowWrap="anywhere">
                {title}
              </Heading>
              <Text fontSize="xs" color="fg.muted">
                Opening your workspace…
              </Text>
            </Box>
          </Flex>
          <LoadingDashboard />
        </Flex>
      </Flex>
    </>
  );
}
