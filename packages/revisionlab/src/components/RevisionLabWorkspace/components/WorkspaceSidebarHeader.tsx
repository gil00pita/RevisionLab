import { Flex, Heading } from "@chakra-ui/react";
import { RevisionLabLogo } from "../../RevisionLabLogo/index.js";

export function WorkspaceSidebarHeader() {
  return (
    <Flex px="6" h="20" gap="3" align="center" flexShrink="0">
      <RevisionLabLogo decorative />
      <Heading as="h1" size="lg" letterSpacing="0">
        RevisionLab
      </Heading>
    </Flex>
  );
}
