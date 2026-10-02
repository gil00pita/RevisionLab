import { Button, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../client/api.js";

export function LocalWorkspaceAccess({
  apiPath,
  basePath,
}: {
  apiPath: string;
  basePath: string;
}) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<{ localOwner: boolean }>(apiPath, "auth/options", {
      signal: controller.signal,
    })
      .then((options) => {
        if (!controller.signal.aborted) setAvailable(options.localOwner);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, [apiPath]);

  async function openWorkspace() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, "auth/logout", { method: "POST" });
      window.location.assign(basePath);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not clear your session.",
      );
      setBusy(false);
    }
  }

  if (!available) return null;

  return (
    <Stack gap="3" mb="6" pb="6" borderBottomWidth="1px" borderColor="gray.200">
      <Text fontWeight="semibold">Local development</Text>
      <Text fontSize="sm" color="gray.600">
        No email is required on this local installation. Opening the workspace
        clears any saved reviewer session in this browser and uses local owner
        access.
      </Text>
      {error && (
        <Text role="alert" fontSize="sm" color="red.700">
          {error}
        </Text>
      )}
      <Button
        type="button"
        variant="outline"
        loading={busy}
        loadingText="Opening workspace"
        onClick={() => void openWorkspace()}
      >
        Open local workspace
      </Button>
    </Stack>
  );
}
