import { Flex, SimpleGrid, Stack } from "@chakra-ui/react";
import { SkeletonBlock } from "./SkeletonBlock.js";

export function SettingsSkeleton({ users = false }: { users?: boolean }) {
  return (
    <Stack gap="6">
      <SkeletonBlock h="4" w="full" />
      <SkeletonBlock h="4" w="80%" />
      {users ? (
        <Stack gap="4">
          <SkeletonBlock h="6" w="40" />
          <SkeletonBlock h="10" w="full" />
          <SkeletonBlock h="10" w="32" />
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} h="16" w="full" />
          ))}
        </Stack>
      ) : (
        <Stack gap="5">
          <SkeletonBlock h="6" w="24" />
          <Flex gap="3" align="center">
            <SkeletonBlock h="6" w="10" rounded="full" />
            <SkeletonBlock h="4" w="36" />
          </Flex>
          <SkeletonBlock h="4" w="32" />
          <Flex gap="3" flexWrap="wrap">
            {Array.from({ length: 8 }, (_, item) => (
              <SkeletonBlock key={item} boxSize="9" rounded="full" />
            ))}
          </Flex>
          <SkeletonBlock h="4" w="32" />
          <SkeletonBlock h="10" w="56" maxW="full" />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            {[0, 1].map((item) => (
              <Stack key={item} minW="0" gap="3">
                <SkeletonBlock h="4" w="full" />
                <SkeletonBlock h="10" w="full" />
              </Stack>
            ))}
          </SimpleGrid>
          <SkeletonBlock h="10" w="40" maxW="full" />
        </Stack>
      )}
    </Stack>
  );
}

export function SettingsContentSkeleton({
  page,
}: {
  page: "notifications" | "instructions" | "history";
}) {
  if (page === "history")
    return (
      <Stack gap="4">
        <Flex justify="space-between" gap="3">
          <SkeletonBlock h="6" w="40" />
          <SkeletonBlock h="10" w="32" />
        </Flex>
        {[0, 1, 2].map((item) => (
          <Stack
            key={item}
            gap="3"
            borderWidth="1px"
            borderColor="border"
            p="4"
            rounded="md"
          >
            <SkeletonBlock h="5" w="70%" />
            <SkeletonBlock h="3" w="40" />
            <SkeletonBlock h="4" w="full" />
            <SkeletonBlock h="9" w="28" />
          </Stack>
        ))}
      </Stack>
    );
  return (
    <Stack gap="5">
      <SkeletonBlock h="6" w="40" />
      <SkeletonBlock h="4" w="full" />
      <SkeletonBlock h="4" w="75%" />
      {page === "notifications" && (
        <Flex gap="3" flexWrap="wrap">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock key={item} h="10" w="24" />
          ))}
        </Flex>
      )}
      {[0, 1].map((item) => (
        <Stack key={item} gap="3">
          <SkeletonBlock h="4" w="32" />
          <SkeletonBlock
            h={page === "instructions" && item === 0 ? "64" : "10"}
            w="full"
          />
        </Stack>
      ))}
      <Flex gap="3" flexWrap="wrap">
        <SkeletonBlock h="10" w="36" />
        <SkeletonBlock h="10" w="24" />
      </Flex>
    </Stack>
  );
}
