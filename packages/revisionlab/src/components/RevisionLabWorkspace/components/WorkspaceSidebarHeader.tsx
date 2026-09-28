import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { RevisionLabLogo } from "../../RevisionLabLogo/index.js";

export function WorkspaceSidebarHeader({
  projectName,
}: {
  projectName: string;
}) {
  return (
    <Box flexShrink="0">
      <Flex px="6" h="20" gap="3" align="center">
        <RevisionLabLogo decorative />
        <Heading as="h1" size="lg" letterSpacing="0">
          RevisionLab
        </Heading>
      </Flex>
      <Box px="6" pb="6" display={{ base: "none", lg: "block" }}>
        <Text fontWeight="semibold" overflowWrap="anywhere">
          {projectName}
        </Text>
        <Text fontSize="xs" color="gray.300" mt="1">
          Prototype review workspace
        </Text>
      </Box>
    </Box>
  );
}
