import { Flex, Grid, Stack } from "@chakra-ui/react";
import { SkeletonBlock } from "./SkeletonBlock.js";

export function FlowSkeleton({ screen = false }: { screen?: boolean }) {
  return (
    <Stack gap="0">
      <Flex
        px={{ base: "2", md: "6" }}
        py="3"
        gap="3"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <SkeletonBlock h="6" w="28" flexShrink="1" minW="0" />
        <SkeletonBlock h="6" w="36" flexShrink="1" minW="0" />
        <SkeletonBlock h="6" w="16" ml="auto" />
      </Flex>
      {screen ? (
        <Grid
          templateColumns={{
            base: "minmax(0, 1fr)",
            xl: "minmax(0, 1fr) 20rem",
          }}
          gap="6"
          p={{ base: "4", md: "6" }}
        >
          <Stack gap="4" minW="0">
            <Flex gap="3" overflow="hidden">
              {[0, 1, 2].map((item) => (
                <SkeletonBlock key={item} h="16" minW="40" flex="1" />
              ))}
            </Flex>
            <Stack position="relative">
              <SkeletonBlock h={{ base: "64", md: "96" }} w="full" />
              <SkeletonBlock position="absolute" bottom="4" right="4" h="10" w="48" maxW="calc(100% - 2rem)" />
            </Stack>
            <Flex gap="3" wrap="wrap">
              <SkeletonBlock h="3" w="16" />
              <SkeletonBlock h="3" w="28" />
              <SkeletonBlock h="3" w="48" />
            </Flex>
          </Stack>
          <Stack gap="4" minW="0">
            <Flex justify="space-between" gap="3">
              <SkeletonBlock h="11" w="36" />
              <SkeletonBlock h="8" w="8" />
            </Flex>
            <SkeletonBlock h="5" w="48" maxW="full" />
            <SkeletonBlock h="32" w="full" />
            <SkeletonBlock h="24" w="full" />
            <SkeletonBlock h="28" w="full" />
            <SkeletonBlock h="10" w="24" />
          </Stack>
        </Grid>
      ) : (
        <Stack
          bg="bg.subtle"
          minH="calc(100dvh - 9rem)"
          p={{ base: "4", md: "8" }}
          gap="8"
        >
          <Flex gap="3" justify="space-between">
            <SkeletonBlock h="9" w="28" />
            <SkeletonBlock h="9" w="32" />
          </Flex>
          <Grid
            templateColumns={{
              base: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            }}
            gap="8"
            alignItems="start"
          >
            {[0, 1, 2].map((item) => (
              <Stack
                key={item}
                bg="bg.panel"
                p="3"
                gap="3"
                borderWidth="1px"
                borderColor="border"
                rounded="md"
              >
                <SkeletonBlock h="5" w="75%" />
                <SkeletonBlock h="48" w="full" />
                <SkeletonBlock h="4" w="60%" />
              </Stack>
            ))}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}
