import type { RevisionLabCapture } from "../server/types.js";
import { apiRequest } from "./api.js";
import {
  pageContentSignature,
  type InteractionSnapshot,
} from "./interaction-snapshot.js";
import { waitForPageSettled } from "./page-settled.js";
import {
  captureDimensions,
  captureScreen,
  loadRecording,
  saveRecording,
} from "./recording.js";

export interface AutomaticCaptureRequest {
  signal: AbortSignal;
  evidence: () => RevisionLabCapture;
  before?: () =>
    | (InteractionSnapshot & { cursor: RevisionLabCapture["cursor"] })
    | undefined;
}

export async function captureRecordingScreens({
  apiPath,
  flowId,
  route,
  title,
  automatic,
  isCurrent,
  lastSignature,
  onSaved,
}: {
  apiPath: string;
  flowId: string;
  route: string;
  title?: string;
  automatic?: AutomaticCaptureRequest;
  isCurrent: () => boolean;
  lastSignature?: string;
  onSaved: (signature: string, count: number) => void;
}): Promise<boolean> {
  if (automatic) await waitForPageSettled(automatic.signal);
  const cancelled = () => !isCurrent() || automatic?.signal.aborted;
  if (cancelled()) return false;
  const before = automatic?.before?.();
  const evidence: RevisionLabCapture = automatic?.evidence() ?? {
    ...captureDimensions(),
    reason: "manual",
    cursor: [],
  };
  const signature = pageContentSignature();
  const pending = loadRecording()?.pendingClick;
  let clickSourceId = pending?.sourceStepId;
  const clearPending = () => {
    const current = loadRecording();
    if (current?.flowId === flowId && current.pendingClick?.id === pending?.id)
      saveRecording({ ...current, pendingClick: undefined });
  };
  // A click that leaves host content unchanged needs no new screens.
  if (evidence.reason === "click" && before?.signature === signature) {
    clearPending();
    return true;
  }
  if (!before && evidence.reason === "click" && lastSignature === signature) {
    clearPending();
    return true;
  }
  const screenTitle =
    title?.trim() ||
    document.querySelector("main h1")?.textContent?.trim() ||
    document.title ||
    route;
  const screenshot = await captureScreen();
  if (cancelled()) return false;
  const persist = async (
    image: string,
    metadata: RevisionLabCapture,
    label: string,
    content: string,
    includeClick = false,
  ) => {
    const sourceStepId = loadRecording()?.lastStepId;
    const sourceMatches = loadRecording()?.lastSignature === pending?.signature;
    const result = await apiRequest<{ id: string; count?: number }>(
      apiPath,
      `flows/${flowId}/steps`,
      {
        method: "POST",
        body: JSON.stringify({
          title: label.slice(0, 160),
          route,
          screenshot: image,
          capture: metadata,
          reuse: Boolean(automatic),
          ...(includeClick &&
          pending &&
          sourceStepId &&
          sourceMatches &&
          sourceStepId === clickSourceId
            ? { interaction: { ...pending.interaction, sourceStepId } }
            : {}),
        }),
      },
    );
    // Count committed uploads even if selection pauses capture or Stop is pressed
    // before the acknowledgement. Never restore a discarded session.
    if (!isCurrent()) return;
    const current = loadRecording()!;
    const count = result.count ?? current.count + 1;
    saveRecording({
      ...current,
      count,
      lastRoute: route,
      lastStepId: result.id,
      lastSignature: content,
    });
    onSaved(content, count);
  };
  if (
    before &&
    before.signature !== signature &&
    lastSignature !== before.signature
  ) {
    const result = await before.image;
    if (cancelled()) return false;
    if ("error" in result) throw result.error;
    const suffix = " (before interaction)";
    await persist(
      result.screenshot,
      {
        width: before.width,
        height: before.height,
        reason: "click",
        cursor: before.cursor,
      },
      `${(before.title || route).slice(0, 160 - suffix.length)}${suffix}`,
      before.signature,
    );
    clickSourceId = loadRecording()?.lastStepId;
  }
  if (cancelled()) return false;
  await persist(screenshot, evidence, screenTitle, signature, true);
  clearPending();
  return isCurrent();
}
