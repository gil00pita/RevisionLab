import NextLink from "next/link";
import { Box, Code, Heading, Link, List, Stack, Text } from "@chakra-ui/react";

export default function SetupPage() {
  return (
    <Box
      as="main"
      bg="gray.50"
      color="gray.900"
      minH="100dvh"
      p={{ base: "6", md: "12" }}
    >
      <Stack maxW="3xl" mx="auto" gap="6">
        <Link asChild color="blue.700">
          <NextLink href="/">Back to RevisionLab</NextLink>
        </Link>
        <Heading as="h1" size="3xl">
          Install in your prototype
        </Heading>
        <Text fontSize="lg" color="gray.600">
          Start with an existing Next.js App Router project using React 19. The
          installer adds the widget, workspace, API routes, and local storage
          configuration.
        </Text>
        <Heading as="h2" size="xl" mt="4">
          Use the local package
        </Heading>
        <Text>Build and pack RevisionLab in this repository:</Text>
        <Code
          display="block"
          whiteSpace="pre-wrap"
          overflowWrap="anywhere"
          p="4"
          bg="gray.900"
          color="gray.100"
        >
          {"npm run build:package\nnpm pack --workspace revisionlab"}
        </Code>
        <Text>
          Then run the installer from your prototype project, replacing the
          archive path with the file created above:
        </Text>
        <Code
          display="block"
          whiteSpace="pre-wrap"
          overflowWrap="anywhere"
          p="4"
          bg="gray.900"
          color="gray.100"
        >
          npx --package /absolute/path/revisionlab-0.1.0.tgz revisionlab init
          --package /absolute/path/revisionlab-0.1.0.tgz
        </Code>
        <Text color="gray.600">
          After the package is published, the installation command becomes{" "}
          <Code>npx revisionlab init</Code>. Run your Next.js development server
          and open any prototype page to see the Review widget.
        </Text>
        <Heading as="h2" size="xl" mt="4">
          Share a private review
        </Heading>
        <List.Root as="ol" ps="5" gap="3">
          <List.Item>
            Use <Code>init --protect</Code> to generate the prototype access
            gate. Existing middleware or proxy files require manual integration.
          </List.Item>
          <List.Item>
            Configure a hosted libSQL database, the owner email, and Resend
            delivery in your deployment environment. The generated environment
            example lists each setting.
          </List.Item>
          <List.Item>
            The owner verifies their email, opens Review access, and creates a
            link for a client or colleague. Reviewers verify their email; they
            do not need a Vercel account.
          </List.Item>
        </List.Root>
        <Text color="gray.600">
          Vercel Deployment Protection runs before the application. Use a review
          deployment that allows invitees to reach RevisionLab’s email gate. The
          application cannot bypass Vercel’s login page.
        </Text>
        <Heading as="h2" size="xl" mt="4">
          Capture with context
        </Heading>
        <Text>
          Switch to the right role in your prototype before recording. A persona
          label describes the journey; it does not impersonate a user or grant
          prototype permissions.
        </Text>
        <Text>
          New routes are captured automatically. Use Capture screen for a
          dialog, validation error, or other state on the same page. Completed
          recordings remain available when you create a new version.
        </Text>
        <Text>
          Passwords are excluded from screenshots. Mark any other sensitive
          region with <Code>data-revisionlab-private</Code>. Screenshots may not
          include cross-origin frames, video, or protected external images.
        </Text>
        <Link asChild color="blue.700" fontWeight="semibold">
          <NextLink href="/revisionlab">Open your review workspace</NextLink>
        </Link>
      </Stack>
    </Box>
  );
}
