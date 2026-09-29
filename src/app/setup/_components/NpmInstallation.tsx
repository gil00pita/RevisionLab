import { Code, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { SetupCommand } from "./SetupCommand";

export function NpmInstallation() {
  return (
    <Stack as="section" gap="4" aria-labelledby="npm-installation">
      <Heading id="npm-installation" as="h2" size="xl" mt="4">
        Install from npm
      </Heading>
      <Text>Run these commands from your existing prototype project:</Text>
      <SetupCommand>{"npx revisionlab@latest init\nnpm run dev"}</SetupCommand>
      <Text>
        Open a prototype page for the widget, or <Code>/revisionlab</Code> for
        the workspace. Localhost development has owner access; the local SQLite
        database is initialized automatically on first use.
      </Text>
      <Text color="gray.600">
        npm lists{" "}
        <Link
          href="https://www.npmjs.com/package/revisionlab/v/0.1.1"
          color="blue.700"
        >
          revisionlab@0.1.1
        </Link>{" "}
        as the latest release, checked on 25 September 2026. The newer widget,
        saved personas, interaction capture, and bubble settings in this
        workspace are not included in that release. Use the local-build
        instructions below to try those changes before the next release.
      </Text>
      <Heading as="h3" size="md" mt="2">
        Choose or update a version
      </Heading>
      <Text>
        The installer installs the exact version of the CLI you invoke, rather
        than silently switching versions. To pin a published release:
      </Text>
      <SetupCommand>{"npx revisionlab@0.1.1 init"}</SetupCommand>
      <Text>
        Re-run <Code>npx revisionlab@latest init</Code> to update an existing
        installation, then restart the development server. Existing review data
        and customized integration files are retained; the widget is not mounted
        twice. A prerelease can be selected with <Code>@next</Code>
        only when that tag is available. <Code>--package</Code> explicitly
        overrides the dependency to install.
      </Text>
    </Stack>
  );
}
