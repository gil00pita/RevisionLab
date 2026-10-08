import { Status, VisuallyHidden } from "@chakra-ui/react";

import type { WorkspaceInstance } from "../../../workspace-instances.js";

export function workspaceConnectionStatus(
  sources: WorkspaceInstance[],
  syncError = false,
): "Connected" | "Partly connected" | "Not connected" {
  const connected = syncError
    ? 0
    : sources.filter((source) => source.status === "connected").length;
  return connected > 0 && connected === sources.length
    ? "Connected"
    : connected > 0
      ? "Partly connected"
      : "Not connected";
}

export function WorkspaceConnectionStatus({
  status,
}: {
  status: ReturnType<typeof workspaceConnectionStatus>;
}) {
  return (
    <Status.Root
      as="span"
      colorPalette={status === "Connected" ? "green" : "orange"}
      title={status}
      flexShrink="0"
      gap="0"
      alignSelf="center"
    >
      <Status.Indicator as="span" boxSize="2" aria-hidden="true" />
      <VisuallyHidden>{status}</VisuallyHidden>
    </Status.Root>
  );
}
