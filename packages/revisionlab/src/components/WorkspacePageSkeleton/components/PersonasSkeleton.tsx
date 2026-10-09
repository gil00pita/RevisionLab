import { Flex, SimpleGrid, Stack } from "@chakra-ui/react";
import { usePersonaView } from "../../../client/persona-view.js";
import { SkeletonBlock } from "./SkeletonBlock.js";
export function PersonasSkeleton() {
  const { view } = usePersonaView();
  return (
    <Stack gap="5">
      <Flex gap="3" flexWrap="wrap">
        <SkeletonBlock h="11" flex="1" minW={{ base: "full", sm: "56" }} />
        <SkeletonBlock h="11" w="28" />
        <SkeletonBlock h="11" w="48" />
        <SkeletonBlock h="11" w="24" />
      </Flex>
      {view === "list" ? (
        <Stack
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border"
          rounded="xl"
          overflow="hidden"
        >
          {[0, 1, 2].map((item) => (
            <Flex key={item} p="4" gap="4" align="start">
              <SkeletonBlock boxSize="10" rounded="full" flexShrink="0" />
              <Stack flex="1" minW="0">
                <SkeletonBlock h="5" w="48" maxW="full" />
                <SkeletonBlock h="4" w="85%" />
              </Stack>
              <SkeletonBlock h="11" w="32" hideBelow="md" />
            </Flex>
          ))}
        </Stack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="5">
          {[0, 1, 2].map((item) => (
            <Stack
              key={item}
              p="5"
              gap="5"
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border"
              rounded="xl"
              minW="0"
            >
              <Flex gap="3">
                <SkeletonBlock boxSize="12" rounded="full" />
                <SkeletonBlock h="6" w="40" maxW="full" />
              </Flex>
              <Stack gap="2">
                <SkeletonBlock h="4" w="full" />
                <SkeletonBlock h="4" w="85%" />
              </Stack>
              <SkeletonBlock h="5" w="40" maxW="full" />
              <Flex gap="4">
                <SkeletonBlock h="10" flex="1" />
                <SkeletonBlock h="10" flex="1" />
              </Flex>
              <SkeletonBlock h="11" w="32" />
            </Stack>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
