import { Box, Flex, SimpleGrid, Stack } from "@chakra-ui/react";
import { LoadingBar } from "./LoadingBar.js";

export function LoadingSidebar() {
  return (
    <Flex
      as="aside"
      aria-label="Workspace sidebar"
      w={{ base: "full", lg: "60" }}
      h={{ base: "auto", lg: "100dvh" }}
      position={{ base: "relative", lg: "sticky" }}
      top="0"
      alignSelf="start"
      flexShrink="0"
      direction="column"
      borderRightWidth="1px"
      borderColor="border"
      aria-hidden="true"
      bg="bg.panel"
    >
      <Flex px="6" h="20" gap="3" align="center" flexShrink="0">
        <LoadingBar boxSize="8" />
        <LoadingBar h="5" w="32" maxW="full" />
      </Flex>
      <Stack px="3" pb="4" gap="4" aria-hidden="true">
        <LoadingBar h="11" w="full" />
        <LoadingBar h={{ base: "11", lg: "10" }} w="full" />
      </Stack>
      <SimpleGrid
        columns={{ base: 2, md: 3, lg: 1 }}
        h={{ base: "64", sm: "40", md: "28", lg: "auto" }}
        px="3"
        gap="2"
        alignContent="start"
        flex={{ base: "none", lg: "1" }}
        py="2"
        aria-hidden="true"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <LoadingBar key={index} h="10" w="full" />
        ))}
      </SimpleGrid>
      <Stack gap="4" p="3" borderTopWidth="1px" borderColor="border.emphasized">
        <Stack gap="0">
          <Box px="3" py="2" aria-hidden="true">
            <LoadingBar h="6" w="28" maxW="full" />
          </Box>
          <Box px="3" py="2">
            <LoadingBar h="6" w="28" maxW="full" />
          </Box>
        </Stack>
        <Stack px="3" pb="3" gap="2" hideBelow="lg" aria-hidden="true">
          <LoadingBar h="4" w="24" />
          <LoadingBar h="3" w="16" />
        </Stack>
      </Stack>
    </Flex>
  );
}
