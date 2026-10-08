import { useState } from "react";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { RevisionLabSettings } from "../../../comment-settings.js";
import { WidgetLauncher } from "./WidgetLauncher.js";

export function WidgetPreview({ settings }: { settings: RevisionLabSettings }) {
  const [expanded, setExpanded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [commenting, setCommenting] = useState(false);
  return (
    <Stack gap="3">
      <Heading as="h3" size="sm">
        Widget preview
      </Heading>
      <Text color="fg.muted" fontSize="sm">
        Open the small logo bubble to try the toolbar. Preview actions stay
        here.
      </Text>
      <Box
        position="relative"
        minH="48"
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
      >
        <Text p="4" color="fg.muted" fontSize="sm" role="status">
          {!settings.showWidget && !recording && !commenting
            ? "The widget is hidden on the prototype."
            : recording
              ? "Preview: recording controls"
              : commenting
                ? "Preview: comment controls"
                : "Your prototype"}
        </Text>
        {(settings.showWidget || recording || commenting) && (
          <WidgetLauncher
            contained
            settings={settings}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onStopAudit={() => {}}
            recording={recording}
            canRecord
            commenting={commenting}
            commentCount={1}
            busy={false}
            accessibility={{ status: "stopped", issues: [], incomplete: 0 }}
            authorized
            onRerun={() => {}}
            workspaceHref="#revisionlab-setup-heading"
            onRecord={() => setRecording(!recording)}
            onComment={() => setCommenting(!commenting)}
          />
        )}
      </Box>
    </Stack>
  );
}
