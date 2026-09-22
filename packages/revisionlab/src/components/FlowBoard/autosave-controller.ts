import { ApiError } from "../../client/api.js";
import {
  BoardHistory,
  copyBoard,
  requestBoard,
  sameBoardContent,
} from "./board-history.js";
import type { FlowBoardData } from "./types.js";

export interface BoardAutosaveScheduler {
  set: (callback: () => void, delay: number) => unknown;
  clear: (handle: unknown) => void;
}

interface AutosaveOptions {
  persist: (board: FlowBoardData) => Promise<FlowBoardData>;
  load: () => Promise<FlowBoardData>;
  scheduler?: BoardAutosaveScheduler;
  debounceMs?: number;
}

export interface BoardAutosaveState {
  board: FlowBoardData;
  savedBoard: FlowBoardData;
  dirty: boolean;
  saving: boolean;
  reloading: boolean;
  conflict: boolean;
  error: string;
  notice: string;
  canUndo: boolean;
}

type Submission = {
  draft: FlowBoardData;
  request: FlowBoardData;
  observed?: FlowBoardData;
};
const CONFLICT =
  "This board changed in another session. Your changes are still here. Load the saved board before editing again; no remote changes have been overwritten.";

/** One flow's local draft, bounded undo history, and serialized optimistic writes. */
export class BoardAutosaveController {
  private board: FlowBoardData;
  private saved: FlowBoardData;
  private history = new BoardHistory();
  private listeners = new Set<() => void>();
  private scheduler: BoardAutosaveScheduler;
  private timer: unknown;
  private groupTimer: unknown;
  private active = true;
  private ready = false;
  private draining = false;
  private running: Promise<boolean> | null = null;
  private submitted: Submission | null = null;
  private uncertain: Submission | null = null;
  private reloading = false;
  private conflict = false;
  private error = "";
  private notice = "";
  private snapshot: BoardAutosaveState;

  constructor(
    initial: FlowBoardData,
    private options: AutosaveOptions,
  ) {
    this.board = copyBoard(initial);
    this.saved = copyBoard(initial);
    this.scheduler = options.scheduler ?? {
      set: (callback, delay) => setTimeout(callback, delay),
      clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    };
    this.snapshot = this.state();
  }

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  resume() {
    this.active = true;
    this.schedule();
  }

  pause() {
    this.active = false;
    this.cancelTimer();
    this.endGroup();
  }

  change(
    update: (board: FlowBoardData) => FlowBoardData,
    groupKey?: string,
  ): boolean {
    if (this.conflict || this.reloading) return false;
    const next = copyBoard(update(copyBoard(this.board)));
    next.revision = this.saved.revision;
    if (sameBoardContent(next, this.board)) return false;
    if (!groupKey) this.cancelGroupTimer();
    this.history.record(this.board, next, groupKey);
    if (groupKey) {
      this.cancelGroupTimer();
      this.groupTimer = this.scheduler.set(() => {
        this.groupTimer = undefined;
        this.history.end();
      }, this.options.debounceMs ?? 500);
    }
    this.board = next;
    if (!this.uncertain) this.error = "";
    this.notice = "Changes will save automatically.";
    this.schedule();
    this.publish();
    return true;
  }

  beginMove(id: string) {
    if (this.conflict || this.reloading) return;
    this.endGroup();
    this.history.begin(`move:${id}`, this.board);
    this.ready = false;
    this.cancelTimer();
  }

  endMove() {
    this.endGroup();
    this.schedule();
  }

  undo(): boolean {
    if (this.conflict || this.reloading) return false;
    this.cancelGroupTimer();
    const previous = this.history.undo();
    if (!previous) return false;
    this.board = { ...copyBoard(previous), revision: this.saved.revision };
    if (!this.uncertain) this.error = "";
    this.notice = "Change undone.";
    this.schedule();
    this.publish();
    return true;
  }

  reportError(message: string) {
    if (!this.conflict && !this.uncertain) this.error = message;
    this.publish();
  }

  receive(incoming: FlowBoardData) {
    if (incoming.revision < this.saved.revision) return;
    const attempt = this.submitted ?? this.uncertain;
    if (attempt && this.matchesAcknowledgement(incoming, attempt)) {
      if (this.submitted) this.submitted.observed = copyBoard(incoming);
      else {
        this.acknowledge(incoming, attempt);
        this.uncertain = null;
        this.error = "";
        this.schedule();
      }
      this.publish();
      return;
    }
    if (
      incoming.revision === this.saved.revision &&
      sameBoardContent(incoming, this.saved)
    )
      return;
    if (this.pending() || this.running || this.uncertain || this.conflict) {
      this.markConflict();
    } else {
      const changed = !sameBoardContent(incoming, this.saved);
      this.saved = copyBoard(incoming);
      this.board = copyBoard(incoming);
      if (changed) {
        this.history.clear();
        this.notice = "Loaded changes from another session.";
      }
    }
    this.publish();
  }

  async flush(): Promise<boolean> {
    this.endGroup();
    this.cancelTimer();
    if (this.conflict || this.uncertain || this.reloading || !this.active)
      return false;
    this.draining = true;
    this.ready = true;
    await this.start();
    if (!this.state().dirty && !this.conflict) {
      this.error = "";
      this.publish();
      return true;
    }
    return false;
  }

  async retry(): Promise<boolean> {
    if (this.conflict || this.reloading) return false;
    if (this.uncertain) {
      const attempt = this.uncertain;
      this.reloading = true;
      this.publish();
      try {
        const current = await this.options.load();
        if (this.matchesAcknowledgement(current, attempt)) {
          this.acknowledge(current, attempt);
          this.uncertain = null;
        } else if (
          current.revision === this.saved.revision &&
          sameBoardContent(current, this.saved)
        ) {
          this.uncertain = null;
        } else this.markConflict();
        if (!this.conflict) this.error = "";
      } catch (cause) {
        this.error = message(
          cause,
          "Could not check the saved board. Retry when the connection is available.",
        );
      } finally {
        this.reloading = false;
        this.publish();
      }
    }
    return this.flush();
  }

  /** Reload only after any dispatched write settles, never from stale poll props. */
  async discard(): Promise<boolean> {
    if (this.reloading) return false;
    this.cancelTimer();
    this.endGroup();
    this.reloading = true;
    this.ready = false;
    this.publish();
    if (this.running) await this.running;
    try {
      const current = await this.options.load();
      if (current.revision < this.saved.revision)
        throw new Error(
          "The saved board is still updating. Try loading it again.",
        );
      this.saved = copyBoard(current);
      this.board = copyBoard(current);
      this.history.clear();
      this.uncertain = null;
      this.conflict = false;
      this.error = "";
      this.notice = "Loaded the latest saved board.";
      return true;
    } catch (cause) {
      this.error = message(
        cause,
        "Could not load the saved board. Your changes are still here.",
      );
      return false;
    } finally {
      this.reloading = false;
      this.publish();
    }
  }

  private pending() {
    return !sameBoardContent(this.board, this.saved);
  }

  private schedule() {
    this.cancelTimer();
    this.ready = false;
    if (
      !this.active ||
      this.conflict ||
      this.uncertain ||
      this.reloading ||
      this.history.gesturing ||
      !this.pending()
    )
      return;
    this.timer = this.scheduler.set(() => {
      this.timer = undefined;
      this.history.end();
      this.ready = true;
      void this.start();
    }, this.options.debounceMs ?? 500);
  }

  private cancelTimer() {
    if (this.timer !== undefined) this.scheduler.clear(this.timer);
    this.timer = undefined;
  }

  private cancelGroupTimer() {
    if (this.groupTimer !== undefined) this.scheduler.clear(this.groupTimer);
    this.groupTimer = undefined;
  }

  private endGroup() {
    this.cancelGroupTimer();
    this.history.end();
  }

  private start(): Promise<boolean> {
    if (this.running) return this.running;
    if (!this.pending()) {
      this.draining = false;
      return Promise.resolve(true);
    }
    if (!this.active || this.conflict || this.uncertain || this.reloading)
      return Promise.resolve(false);
    this.running = Promise.resolve().then(() => this.write());
    this.notice = "Saving changes…";
    this.publish();
    return this.running;
  }

  private async write(): Promise<boolean> {
    try {
      while (
        this.active &&
        !this.conflict &&
        !this.uncertain &&
        !this.reloading &&
        !this.history.gesturing &&
        this.pending() &&
        (this.ready || this.draining)
      ) {
        this.ready = false;
        const draft = copyBoard(this.board);
        const attempt: Submission = { draft, request: requestBoard(draft) };
        if (sameBoardContent(attempt.request, this.saved)) {
          this.board = copyBoard(this.saved);
          this.history.dropNoop(this.board);
          this.notice = "All changes saved.";
          continue;
        }
        this.submitted = attempt;
        try {
          const saved = await this.options.persist(copyBoard(attempt.request));
          this.acknowledge(saved, attempt);
        } catch (cause) {
          if (attempt.observed) this.acknowledge(attempt.observed, attempt);
          else if (cause instanceof ApiError && cause.status === 409)
            this.markConflict();
          else {
            this.uncertain = attempt;
            this.error = message(
              cause,
              "Changes could not be saved. They are still here; retry when ready.",
            );
          }
        } finally {
          this.submitted = null;
          this.publish();
        }
      }
      return !this.pending() && !this.conflict && !this.uncertain;
    } finally {
      this.running = null;
      this.draining = false;
      if (this.conflict || this.uncertain) this.cancelTimer();
      else if (this.pending() && this.timer === undefined && !this.ready)
        this.schedule();
      this.publish();
    }
  }

  private acknowledge(saved: FlowBoardData, attempt: Submission) {
    if (saved.revision < this.saved.revision) return;
    this.saved = copyBoard(saved);
    this.board = sameBoardContent(this.board, attempt.draft)
      ? copyBoard(saved)
      : { ...this.board, revision: saved.revision };
    if (!this.conflict) this.error = "";
    this.notice = this.pending()
      ? "More changes waiting to save."
      : "All changes saved.";
  }

  private matchesAcknowledgement(board: FlowBoardData, attempt: Submission) {
    return (
      board.revision === attempt.request.revision + 1 &&
      sameBoardContent(board, attempt.request)
    );
  }

  private markConflict() {
    this.conflict = true;
    this.error = CONFLICT;
    this.ready = false;
    this.cancelTimer();
  }

  private state(): BoardAutosaveState {
    return {
      board: this.board,
      savedBoard: this.saved,
      dirty: this.pending() || this.running !== null || this.uncertain !== null,
      saving: this.running !== null,
      reloading: this.reloading,
      conflict: this.conflict,
      error: this.error,
      notice: this.notice,
      canUndo: this.history.canUndo && !this.conflict && !this.reloading,
    };
  }

  private publish() {
    this.snapshot = this.state();
    for (const listener of this.listeners) listener();
  }
}

function message(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
