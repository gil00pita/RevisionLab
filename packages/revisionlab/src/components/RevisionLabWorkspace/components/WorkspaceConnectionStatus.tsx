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
      flexShrink="0"
      title={status}
    >
      <Status.Indicator as="span" aria-hidden="true" bg={status === "Connected" ? "green.600" : "orange.700"} />
      <VisuallyHidden>{status}</VisuallyHidden>
    </Status.Root>
  );
}
