import { unavailableAccessibility } from "../../accessibility.js";
import type { InteractionSnapshot } from "../interaction-snapshot.js";
import { loadRecording, saveRecording } from "../recording.js";
import type { RevisionLabCapture, RevisionLabClick, RevisionLabStep } from "../../server/types.js";
import { journalRequest } from "./requests.js";
import { readImage, readJournal, removeImage, storeImage, writeJournal } from "./storage.js";
import type { JournalData, JournalEntry, JournalStatus } from "./types.js";

export class RecordingJournal {
  readonly data: JournalData;
  private reserveTask: Promise<void> | null = null;
  private uploadTask: Promise<void> | null = null;
  private snapshots = new Set<Promise<void>>();
  private images = new Map<string, string>();
  private draining = false;
  private error = "";
  private warning = "";
  private recovering: Promise<void>;
  constructor(readonly apiPath: string, readonly flowId: string) {
    this.data = readJournal(flowId) ?? { flowId, entries: [] };
    this.recovering = this.recover([...this.data.entries]);
    void this.recovering.then(() => this.kick());
  }
  active = () => loadRecording()?.flowId === this.flowId && !loadRecording()?.discardRequested;
  private changed() {
    if (!this.active()) return;
    if (!writeJournal(this.data)) this.warning = "Browser storage is unavailable. Keep this page open until saving finishes.";
    window.dispatchEvent(new Event("revisionlab:recording-progress"));
  }
  status(): JournalStatus {
    const pending = this.data.entries.filter((entry) => !entry.reserved || !entry.uploaded || (entry.audit && !entry.audited)).length;
    return { pending, limited: this.data.limitReached, phase: this.error ? "Retry" : this.data.entries.some((entry) => entry.state === "waiting" || entry.state === "rendering") ? "Capturing" : pending ? "Saving" : "Ready", error: this.error, warning: this.data.limitReached ? "Recording limit reached. Stop to save this flow, then start a new recording." : this.warning };
  }
  private async recover(entries: JournalEntry[]) {
    await Promise.resolve();
    for (const entry of entries) {
      if (entry.uploaded) continue;
      const image = await readImage(entry.id).catch(() => undefined);
      if (image) { this.images.set(entry.id, image); entry.state = "saved"; }
      else if (["rendering", "saved", "waiting"].includes(entry.state)) { entry.state = "unavailable"; entry.failure = "interrupted"; }
    }
    this.changed();
  }
  append(route: string, title: string, capture: RevisionLabCapture): JournalEntry {
    const reservedCount = loadRecording()?.count ?? 0;
    const unreserved = this.data.entries.filter((entry) => !entry.reserved).length;
    if (this.data.limitReached || this.data.entries.length >= 1000 || reservedCount + unreserved >= 200) {
      this.data.limitReached = true;
      this.changed();
      throw new Error("Recording limit reached. Stop to save this flow.");
    }
    const previous = this.data.entries.at(-1);
    const pending = this.data.pendingClick;
    const entry: JournalEntry = { id: crypto.randomUUID(), previousVisitId: previous?.id ?? null, route, title: (title.trim() || route).slice(0, 160), capture, interaction: pending?.sourceVisitId === previous?.id ? pending?.interaction ?? null : null, reservation: { title: (title.trim() || route).slice(0, 160), capture: { ...capture, accessibility: unavailableAccessibility("not-scanned") } }, reserved: false, state: "waiting" };
    this.data.pendingClick = undefined;
    this.data.entries.push(entry);
    this.changed();
    this.kick();
    return entry;
  }
  click(entry: JournalEntry, interaction: RevisionLabClick | null) {
    this.data.pendingClick = interaction ? { sourceVisitId: entry.id, interaction } : undefined;
    this.changed();
  }
  unavailable(entry: JournalEntry, failure: RevisionLabStep["captureFailure"]) {
    if (["saved", "rendering", "unavailable"].includes(entry.state)) return;
    entry.state = "unavailable";
    entry.revision = (entry.revision ?? 0) + 1;
    entry.failure = failure;
    entry.uploaded = false;
    this.changed();
    this.kick();
  }
  freeze(entry: JournalEntry, snapshot: InteractionSnapshot, capture: RevisionLabCapture, audit?: Promise<RevisionLabCapture["accessibility"]>) {
    if (entry.state === "rendering" || entry.state === "saved") return;
    entry.state = "rendering";
    entry.revision = (entry.revision ?? 0) + 1;
    entry.signature = snapshot.signature;
    entry.title = (snapshot.title || entry.route).slice(0, 160);
    entry.capture = { ...capture, width: snapshot.width, height: snapshot.height, accessibility: snapshot.accessibility };
    entry.uploaded = false;
    this.changed();
    const task = (async () => {
      const result = await snapshot.image;
      if (!this.active()) return;
      if ("error" in result || this.images.size >= 8) {
        entry.state = "unavailable";
        entry.failure = "failed";
      } else {
        this.images.set(entry.id, result.screenshot);
        await storeImage(this.flowId, entry.id, result.screenshot).catch(() => { this.warning = "Capture storage is unavailable. Keep this page open until uploads finish."; });
        entry.state = "saved";
      }
      this.changed();
      this.kick();
      if (audit) {
        const report = await audit.catch(() => unavailableAccessibility("failed"));
        if (this.active() && entry.state === "saved") { entry.audit = report; this.changed(); this.kick(); }
      }
    })().finally(() => this.snapshots.delete(task));
    this.snapshots.add(task);
  }
  private kick() {
    if (!this.active() || this.error || this.draining) return;
    if (!this.reserveTask && this.data.entries.some((entry) => !entry.reserved)) {
      const task = this.reserve().catch((cause: unknown) => this.failed(cause)).finally(() => { this.reserveTask = null; this.changed(); this.reschedule(); });
      this.reserveTask = task;
    }
    if (!this.uploadTask && this.data.entries.some((entry) => entry.reserved && ["saved", "unavailable"].includes(entry.state) && (!entry.uploaded || (entry.audit && !entry.audited)))) {
      const task = this.upload().catch((cause: unknown) => this.failed(cause)).finally(() => { this.uploadTask = null; this.changed(); this.reschedule(); });
      this.uploadTask = task;
    }
  }
  private reschedule() {
    if (this.error || !this.active()) return;
    if (this.data.entries.some((entry) => !entry.reserved || (entry.reserved && ["saved", "unavailable"].includes(entry.state) && (!entry.uploaded || (entry.audit && !entry.audited))))) queueMicrotask(() => this.kick());
  }
  private failed(cause: unknown) {
    if (this.active()) { this.error = cause instanceof Error ? cause.message : "Could not save recorded visits. Retry saving."; this.changed(); }
  }
  private async reserve() {
    await this.recovering;
    for (const entry of this.data.entries) {
      if (!this.active() || this.error) return;
      if (entry.reserved) continue;
      const result = await journalRequest<{ count: number }>(this.apiPath, `flows/${this.flowId}/visits`, "POST", { id: entry.id, previousVisitId: entry.previousVisitId, route: entry.route, title: entry.reservation.title, capture: entry.reservation.capture, interaction: entry.interaction }, this.active);
      if (!this.active()) return;
      entry.reserved = true;
      const current = loadRecording();
      if (current?.flowId === this.flowId && typeof result.count === "number") saveRecording({ ...current, count: result.count });
      this.changed();
    }
    // Reserves finish independently of image rendering and audits.
    if (!this.uploadTask) this.kick();
  }
  private async upload() {
    await this.recovering;
    await this.reserveTask;
    for (const entry of this.data.entries) {
      if (!this.active() || this.error) return;
      if (!entry.reserved || !["saved", "unavailable"].includes(entry.state)) continue;
      if (!entry.uploaded) {
        const revision = entry.revision;
        const screenshot = this.images.get(entry.id) ?? await readImage(entry.id).catch(() => undefined);
        if (entry.state === "saved" && !screenshot) { entry.state = "unavailable"; entry.failure = "interrupted"; }
        const body = entry.state === "saved" ? { state: "saved", screenshot, title: entry.title, capture: entry.capture } : { state: "unavailable", failure: entry.failure ?? "failed" };
        const result = await journalRequest<{ count: number }>(this.apiPath, `flows/${this.flowId}/visits/${entry.id}`, "PATCH", body, this.active);
        if (!this.active()) return;
        if (entry.revision !== revision) continue;
        entry.uploaded = true;
        this.images.delete(entry.id);
        await removeImage(entry.id).catch(() => undefined);
        const current = loadRecording();
        if (current?.flowId === this.flowId) saveRecording({ ...current, count: result.count });
        this.changed();
      }
      if (entry.state === "saved" && entry.audit && !entry.audited) {
        await journalRequest(this.apiPath, `flows/${this.flowId}/visits/${entry.id}/audit`, "PATCH", entry.audit, this.active);
        entry.audited = true;
        this.changed();
      }
    }
  }
  async retry() {
    await Promise.all([this.reserveTask, this.uploadTask]);
    this.error = "";
    this.changed();
    this.kick();
  }
  async drain() {
    await this.recovering;
    try {
      for (const entry of this.data.entries) if (entry.state === "waiting") this.unavailable(entry, "not-ready");
      await Promise.all([...this.snapshots]);
      this.draining = true;
      await Promise.all([this.reserveTask, this.uploadTask]);
      this.error = "";
      await this.reserve();
      await this.upload();
      if (this.status().pending) throw new Error("Recorded visits are still pending. Retry saving.");
    } catch (cause) {
      this.failed(cause);
      throw cause;
    } finally {
      this.draining = false;
      this.changed();
    }
  }
  async discard() {
    await Promise.all([this.reserveTask, this.uploadTask]);
    await Promise.all([...this.snapshots]);
    await Promise.all(this.data.entries.map((entry) => removeImage(entry.id).catch(() => undefined)));
    writeJournal(null);
  }
  clear() { writeJournal(null); }
}

let current: RecordingJournal | undefined;
export function recordingJournal(apiPath: string, flowId: string) {
  if (current?.flowId !== flowId || current.apiPath !== apiPath) current = new RecordingJournal(apiPath, flowId);
  return current;
}
