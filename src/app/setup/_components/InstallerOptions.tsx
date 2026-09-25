import { Code, Heading, List, Stack, Text } from "@chakra-ui/react";
import { SetupCommand } from "./SetupCommand";

export function InstallerOptions() {
  return (
    <Stack as="section" gap="4" aria-labelledby="installer-options">
      <Heading id="installer-options" as="h2" size="xl" mt="4">
        Installer options
      </Heading>
      <SetupCommand>
        {"npx revisionlab@latest init --dry-run\nnpx revisionlab@latest --help"}
      </SetupCommand>
      <List.Root ps="5" gap="3">
        <List.Item>
          <Code>--dry-run</Code> previews file and script changes without
          writing files or installing dependencies.
        </List.Item>
        <List.Item>
          <Code>--cwd /absolute/path/my-prototype</Code> targets a different
          existing project.
        </List.Item>
        <List.Item>
          <Code>--protect</Code> also gates prototype pages with RevisionLab
          invitations. Requires Next.js 15.5+ or 16.
        </List.Item>
        <List.Item>
          <Code>--no-install</Code> generates integration files but skips npm
          install. Use this with pnpm or Yarn, then install the same RevisionLab
          version with your package manager.
        </List.Item>
        <List.Item>
          <Code>--package &lt;spec&gt;</Code> installs an explicit npm package
          version, tag, or local tarball instead of the CLI&apos;s version.
        </List.Item>
      </List.Root>
      <Heading as="h3" size="md" mt="2">
        What init changes
      </Heading>
      <Text>
        The installer adds configuration, workspace and access pages, Node.js
        API routes, an environment example, and the widget in your root layout.
        It follows your <Code>app/</Code> or <Code>src/app/</Code>
        structure and TypeScript or JavaScript conventions, preserving existing
        providers and page content.
      </Text>
      <Text>
        Conventional development/build scripts use Webpack for Chakra/Emotion
        compatibility: Next.js 16 gets <Code>--webpack</Code>; Next.js 15 has
        its Turbo flags removed. Custom scripts are left untouched with manual
        guidance. Modified host files are backed up in{" "}
        <Code>.revisionlab/backups/</Code>, and conflicting routes or protection
        files are not overwritten.
      </Text>
      <Text color="gray.600">
        Initialization does not create a new Next.js project, provision a hosted
        database, publish a package, or deploy your application.
      </Text>
    </Stack>
  );
}
