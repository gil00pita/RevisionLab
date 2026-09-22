import { Button, Heading, Icon, Link, Stack, Text } from "@chakra-ui/react";
import { ArrowUpRight, Camera } from "lucide-react";

export function EmptyWorkspace({ canRecord }: { canRecord: boolean }) {
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
        A review starts with a real journey.
      </Heading>
      <Text color="gray.600" maxW="lg">
        Open your prototype, choose Record in the RevisionLab widget, and walk
        through a flow. Each captured screen keeps its persona, version, and
        feedback together.
      </Text>
      <Button asChild colorPalette="blue">
        <Link href="/">
          Open prototype
          <Icon>
            <ArrowUpRight />
          </Icon>
        </Link>
      </Button>
      <Text color="gray.600" fontSize="xs">
        {canRecord
          ? "Your workspace is ready. No flows have been recorded yet."
          : "An editor will need to record the first flow. You can already comment on prototype pages."}
      </Text>
    </Stack>
  );
}
