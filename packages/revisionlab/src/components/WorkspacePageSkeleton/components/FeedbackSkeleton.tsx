import { Flex, Grid, Stack } from "@chakra-ui/react";
import { SkeletonBlock } from "./SkeletonBlock.js";

export function FeedbackSkeleton({ sources = false }: { sources?: boolean }) {
  if (sources)
    return (
      <Stack gap="4">
        <SkeletonBlock h="6" w="64" maxW="full" />
        <SkeletonBlock h="4" w="full" />
        <SkeletonBlock h="4" w="80%" />
        <SkeletonBlock h="5" w="56" maxW="full" />
      </Stack>
    );
  return (
    <Stack gap="5">
      <Flex gap="3" justify="space-between" flexWrap="wrap">
        <SkeletonBlock h="4" w="70%" />
        <SkeletonBlock h="10" w="32" />
      </Flex>
      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          xl: "minmax(0, 1fr) minmax(0, 1fr)",
        }}
        gap="8"
        alignItems="start"
      >
        <Stack gap="4" minW="0">
          <Flex justify="space-between" gap="3">
            <SkeletonBlock h="6" w="36" />
            <SkeletonBlock h="4" w="20" />
          </Flex>
          <SkeletonBlock h="4" w="full" />
          <SkeletonBlock h="4" w="80%" />
          <Flex gap="2" flexWrap="wrap">
            <SkeletonBlock h="10" flex="1" minW="24" />
            <SkeletonBlock h="10" w="32" />
          </Flex>
          <SkeletonBlock h="10" w="48" maxW="full" />
          {[0, 1, 2].map((item) => (
            <Stack
              key={item}
              gap="4"
              borderWidth="1px"
              borderColor="border"
              rounded="md"
              p="4"
            >
              <SkeletonBlock h="5" w="80%" />
              <SkeletonBlock h="3" w="32" />
              <SkeletonBlock h="32" w="full" />
              <SkeletonBlock h="4" w="28" />
            </Stack>
          ))}
        </Stack>
        <Stack gap="4" minW="0">
          <SkeletonBlock h="6" w="36" />
          <SkeletonBlock h="12" w="full" />
          <Stack
            gap="4"
            borderWidth="1px"
            borderColor="border"
            rounded="md"
            p="5"
          >
            <SkeletonBlock h="6" w="80%" />
            <SkeletonBlock h="32" w="full" />
            <SkeletonBlock h="4" w="50%" />
            <SkeletonBlock h="20" w="full" />
            <SkeletonBlock h="10" w="32" />
          </Stack>
        </Stack>
      </Grid>
    </Stack>
  );
}
