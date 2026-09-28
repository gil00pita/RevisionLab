import { Box, Icon, Link, Stack, Text } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import type { RevisionLabState } from "../../../server/types.js";

export function WorkspaceSidebarFooter({
  actor,
}: {
  actor: RevisionLabState["actor"];
}) {
  return (
    <Stack
      gap="4"
      flexShrink="0"
      p="6"
      borderTopWidth="1px"
      borderColor="whiteAlpha.200"
      display={{ base: "none", lg: "flex" }}
    >
      <Link href="/" color="gray.200" fontSize="sm">
        <Icon>
          <ArrowLeft />
        </Icon>
        Back to prototype
      </Link>
      <Box>
        <Text fontWeight="semibold" fontSize="sm" overflowWrap="anywhere">
          {actor.name}
        </Text>
        <Text fontSize="xs" color="gray.300" textTransform="capitalize">
          {actor.role}
        </Text>
      </Box>
    </Stack>
  );
}
