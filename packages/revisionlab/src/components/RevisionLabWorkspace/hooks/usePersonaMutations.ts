import { useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";

export function usePersonaMutations(
  apiPath: string,
  onRefresh: () => Promise<void>,
  onBusyChange?: (busy: boolean) => void,
) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [undoPersona, setUndoPersona] = useState<RevisionLabPersona | null>(
    null,
  );
  const pending = useRef(false);
  async function archive(persona: RevisionLabPersona, archived = !persona.archivedAt) {
    if (pending.current) return;
    pending.current = true;
    setBusy(persona.id);
    onBusyChange?.(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(apiPath, `personas/${persona.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived }),
      });
      setUndoPersona(archived ? persona : null);
      await onRefresh();
      setNotice(
        archived
          ? "Persona archived. Existing recordings are unchanged."
          : "Persona restored.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update the persona.",
      );
    } finally {
      pending.current = false;
      setBusy(null);
      onBusyChange?.(false);
    }
  }
  async function removeAccount(id: string) {
    if (pending.current) return;
    pending.current = true;
    setBusy(id);
    onBusyChange?.(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(apiPath, `personas/${id}/credentials`, {
        method: "DELETE",
        body: "{}",
      });
      await onRefresh();
      setNotice("Persona test account removed.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not remove the test account.",
      );
    } finally {
      pending.current = false;
      setBusy(null);
      onBusyChange?.(false);
    }
  }
  return {
    busy,
    error,
    notice,
    undoPersona,
    setNotice,
    archive,
    removeAccount,
  };
}
