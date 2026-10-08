import NextLink from "next/link";
import { Box, Button, Icon, Link, Stack, Text } from "@chakra-ui/react";
import { Check, RotateCcw } from "lucide-react";

export function DemoConfirmation({
  firstName,
  onRestart,
}: {
  firstName: string;
  onRestart: () => void;
}) {
  return (
    <Stack gap="6">
      <Icon
        boxSize="14"
        p="3"
        borderRadius="full"
        bg="colorPalette.subtle"
        color="colorPalette.fg"
        aria-hidden="true"
      >
        <Check />
      </Icon>
      <Box>
        <Text fontSize="xl" fontWeight="semibold">
          Example complete, {firstName || "Alex"}.
        </Text>
        <Text mt="2" color="fg.muted">
          Demo reference NS–2048. This confirmation is simulated; no finance
          application has been sent.
        </Text>
      </Box>
      <Box bg="bg.subtle" borderRadius="lg" p="5">
        <Text fontWeight="semibold">Finish your recording</Text>
        <Text mt="2" fontSize="sm" color="fg.muted">
          Stop and save using the RevisionLab widget. Your saved flow will
          include the pages you visited and the interactions you captured.
        </Text>
      </Box>
      <Stack direction={{ base: "column", sm: "row" }} gap="3">
        <Button
          type="button"
          minH="11"
          colorPalette="teal"
          bg="colorPalette.fg"
          color="bg.panel"
          focusRingColor="colorPalette.fg"
          _hover={{ bg: "colorPalette.fg/90" }}
          onClick={onRestart}
        >
          <Icon size="sm">
            <RotateCcw />
          </Icon>
          Restart demo
        </Button>
        <Link asChild minH="11" px="3">
          <NextLink href="/revisionlab">Review saved flows</NextLink>
        </Link>
      </Stack>
    </Stack>
  );
}
