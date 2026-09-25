import { Code, Heading, Text } from "@chakra-ui/react";
import { SetupCommand } from "./SetupCommand";

export function LocalInstallation({ version }: { version: string }) {
  const archive = `/absolute/path/revisionlab-${version}.tgz`;
  // Preserve the existing heading depth/order for saved page-comment anchors.
  return (
    <>
      <Heading id="local-installation" as="h2" size="xl" mt="4">
        Use the latest local build
      </Heading>
      <Text>
        To try unreleased workspace changes, build and pack RevisionLab in this
        repository:
      </Text>
      <SetupCommand>
        {"npm run build:package\nnpm pack --workspace revisionlab"}
      </SetupCommand>
      <Text>
        Then run this from your prototype project, replacing both archive paths
        with the file created above:
      </Text>
      <SetupCommand>{`npx --package "${archive}" revisionlab init \\\n  --package "${archive}"`}</SetupCommand>
      <Text color="gray.600">
        The first <Code>--package</Code> selects the CLI for npx. The second
        makes the installer add that same local build to your project, rather
        than the published package with the same version number. These commands
        do not publish anything. Restart your development server afterward.
      </Text>
    </>
  );
}
