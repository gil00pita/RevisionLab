import { Flex, Grid, Stack } from "@chakra-ui/react";
import { SkeletonBlock } from "./SkeletonBlock.js";

export function SessionDetailSkeleton() {
  return (
    <Stack gap="4" borderTopWidth="1px" borderColor="border" pt="6">
      <Flex gap="3" justify="space-between">
        <SkeletonBlock h="6" w="48" maxW="70%" />
        <SkeletonBlock h="10" w="24" />
      </Flex>
      <SkeletonBlock h="4" w="48" maxW="full" />
      <SkeletonBlock h="5" w="32" />
      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          md: "repeat(3, minmax(0, 1fr))",
        }}
        gap="4"
      >
        {[0, 1, 2].map((item) => (
          <Stack key={item} gap="3">
            <SkeletonBlock h="48" />
            <SkeletonBlock h="4" w="80%" />
            <SkeletonBlock h="3" w="60%" />
          </Stack>
        ))}
      </Grid>
    </Stack>
  );
}

export function SessionsSkeleton({ detail = false }: { detail?: boolean }) {
  return (
    <Stack gap="6">
      <SkeletonBlock h="4" w="80%" />
      {[0, 1, 2].map((item) => (
        <Flex
          key={item}
          p="5"
          gap="4"
          justify="space-between"
          borderWidth="1px"
          borderColor="border"
          rounded="md"
          flexWrap="wrap"
        >
          <Stack gap="3" flex="1" minW="0">
            <SkeletonBlock h="6" w="56" maxW="full" />
            <SkeletonBlock h="4" w="64" maxW="full" />
            <SkeletonBlock h="4" w="32" />
          </Stack>
          <SkeletonBlock h="10" w="24" />
        </Flex>
      ))}
      {detail && <SessionDetailSkeleton />}
    </Stack>
  );
}
