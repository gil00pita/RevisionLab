import { Heading, Stack, Text } from "@chakra-ui/react";

export function AuditSettings() {
  return (
    <Stack gap="4">
      <Heading as="h2" size="md">
        Accessibility checks
      </Heading>
      <Text color="gray.700">
        RevisionLab automatically checks visited prototype pages while the
        widget is visible. The collapsed widget shows a spinner during checks
        and a badge when issues are found.
      </Text>
      <Text color="gray.700">
        Expand the widget and open its accessibility results to review findings
        or choose Run again. Stop auditing pauses live-page checks until you
        rerun them or reload the page. Accessibility evidence collected during
        recordings is checked separately.
      </Text>
      <Text fontSize="sm" color="gray.600">
        There are currently no workspace-wide audit settings. Automated checks
        do not replace manual accessibility review.
      </Text>
    </Stack>
  );
}
