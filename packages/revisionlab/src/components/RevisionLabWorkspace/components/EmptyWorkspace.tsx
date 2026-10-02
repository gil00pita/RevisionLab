import { Button, Heading, Icon, Link, Stack, Text } from "@chakra-ui/react";
import { ArrowUpRight, Camera } from "lucide-react";

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
      bg="gray.50"
    >
      <Icon size="2xl" color="blue.700">
        <Camera />
      </Icon>
      <Heading as="h2" size="2xl" maxW="lg">
        {unavailable
          ? "Workspace data is currently unavailable."
          : "A review starts with a real journey."}
      </Heading>
      <Text color="gray.600" maxW="lg">
        {unavailable
          ? "The connection could not be loaded. Automatic updates will retry, or choose another workspace."
          : "Open your prototype, choose Record in the RevisionLab widget, and walk through a flow. Each captured screen keeps its persona, version, and feedback together."}
      </Text>
      <Button asChild colorPalette="blue">
        <Link href={prototypeUrl}>
          Open prototype
          <Icon>
            <ArrowUpRight />
          </Icon>
        </Link>
      </Button>
      <Text color="gray.600" fontSize="xs">
        {unavailable
          ? "Saved source data has not been deleted."
          : canRecord
            ? "Your workspace is ready. No flows have been recorded yet."
            : "An editor will need to record the first flow. You can already comment on prototype pages."}
      </Text>
    </Stack>
  );
}
