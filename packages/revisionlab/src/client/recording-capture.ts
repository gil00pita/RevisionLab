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
  // A click that leaves host content unchanged needs no new screens.
  if (evidence.reason === "click" && before?.signature === signature)
    return true;
  if (!before && evidence.reason === "click" && lastSignature === signature)
    return true;
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
  ) => {
    await apiRequest(apiPath, `flows/${flowId}/steps`, {
      method: "POST",
      body: JSON.stringify({
        title: label.slice(0, 160),
        route,
        screenshot: image,
        capture: metadata,
      }),
    });
    // Count committed uploads even if selection pauses capture or Stop is pressed
    // before the acknowledgement. Never restore a discarded session.
    if (!isCurrent()) return;
    const current = loadRecording()!;
    saveRecording({ ...current, count: current.count + 1, lastRoute: route });
    onSaved(content, current.count + 1);
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
  }
  if (cancelled()) return false;
  await persist(screenshot, evidence, screenTitle, signature);
  return isCurrent();
}
