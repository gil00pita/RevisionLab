import { apiRequest } from "./api.js";
import { loadRecording, saveRecording } from "./recording.js";

/** Stop new captures immediately, then let the server reconcile saved screens. */
export async function finishPendingRecording(
  apiPath: string,
  pendingCapture: Promise<boolean> | null,
) {
  const target = loadRecording();
  if (!target || target.discardRequested) return null;
  saveRecording({ ...target, finishRequested: true });
  await pendingCapture;
  if (loadRecording()?.flowId !== target.flowId) return null;
  const { outcome } = await apiRequest<{ outcome: "saved" | "empty" }>(
    apiPath,
    `flows/${target.flowId}/finish`,
    { method: "POST", body: "{}" },
  );
  if (loadRecording()?.flowId !== target.flowId) return null;
  saveRecording(null);
  return { outcome, id: target.flowId, name: target.name };
}
