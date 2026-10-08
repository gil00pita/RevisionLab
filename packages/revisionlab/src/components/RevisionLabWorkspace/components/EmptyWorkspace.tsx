import { EmptyStateIllustration } from "../../EmptyStateIllustration/index.js";
import { Button, Heading, Icon, Link, Stack, Text } from "@chakra-ui/react";
import { ArrowUpRight } from "lucide-react";

export function EmptyWorkspace({
  canRecord,
  unavailable = false,
  prototypeUrl = "/",
}: {
  canRecord: boolean;
  unavailable?: boolean;
  prototypeUrl?: string;
}) {
  return (
    <Stack
      gap="5"
      align="start"
      justify="center"
      p={{ base: "8", md: "16" }}
      flex="1"
      minW="0"
      bg="bg.subtle"
    >
      <EmptyStateIllustration variant={unavailable ? "connection" : "journey"} size="lg" />
      <Heading as="h2" size="2xl" maxW="lg" overflowWrap="anywhere">
        {unavailable
          ? "Workspace data is currently unavailable."
          : "A review starts with a real journey."}
      </Heading>
      <Text color="fg.muted" maxW="lg">
        {unavailable
          ? "The connection could not be loaded. Automatic updates will retry, or choose another workspace."
          : "Open your prototype, choose Record in the RevisionLab widget, and walk through a flow. Each captured screen keeps its persona, version, and feedback together."}
      </Text>
      <Button asChild colorPalette="blue" maxW="full" h="auto" minH="11" py="2" whiteSpace="normal">
        <Link href={prototypeUrl}>
          <Text as="span" minW="0" overflowWrap="anywhere">Open prototype</Text>
          <Icon>
            <ArrowUpRight />
          </Icon>
        </Link>
      </Button>
      <Text color="fg.muted" fontSize="xs">
        {unavailable
          ? "Saved source data has not been deleted."
          : canRecord
            ? "Your workspace is ready. No flows have been recorded yet."
            : "An editor will need to record the first flow. You can already comment on prototype pages."}
      </Text>
    </Stack>
  );
}
