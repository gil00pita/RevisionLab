import type { FlowBoardData } from "./types.js";

export function copyBoard(board: FlowBoardData): FlowBoardData {
  return {
    revision: board.revision,
    nodes: board.nodes.map((node) => ({ ...node })),
    edges: board.edges.map((edge) => ({ ...edge })),
    hiddenStepIds: [...(board.hiddenStepIds ?? [])],
  };
}

/** Revision changes acknowledge persistence; they are not an undoable edit. */
export function sameBoardContent(a: FlowBoardData, b: FlowBoardData): boolean {
  return JSON.stringify(content(a)) === JSON.stringify(content(b));
}

function content(board: FlowBoardData) {
  return {
    nodes: board.nodes.map(({ stepId, x, y }) => ({ stepId, x, y })),
    edges: board.edges.map(
      ({ id, sourceStepId, targetStepId, label, kind }) => ({
        id,
        sourceStepId,
        targetStepId,
        label,
        kind,
      }),
    ),
    hiddenStepIds: board.hiddenStepIds ?? [],
  };
}

export function requestBoard(board: FlowBoardData): FlowBoardData {
  const result = copyBoard(board);
  result.edges = result.edges.map((edge) => ({
    ...edge,
    label: edge.label.trim(),
  }));
  return result;
}

/** A gesture or typing burst owns one history entry, even across many updates. */
export class BoardHistory {
  private entries: FlowBoardData[] = [];
  private group: {
    key: string;
    explicit: boolean;
    before: FlowBoardData;
    added: boolean;
  } | null = null;

  get canUndo() {
    return this.entries.length > 0;
  }
  get gesturing() {
    return this.group?.explicit ?? false;
  }

  begin(key: string, board: FlowBoardData) {
    this.end();
    this.group = {
      key,
      explicit: true,
      before: copyBoard(board),
      added: false,
    };
  }

  record(before: FlowBoardData, after: FlowBoardData, key?: string) {
    if (key && this.group?.key !== key) {
      this.end();
      this.group = {
        key,
        explicit: false,
        before: copyBoard(before),
        added: false,
      };
    } else if (!key && !this.group?.explicit) this.end();
    if (!this.group || !this.group.added) {
      this.entries.push(copyBoard(before));
      if (!this.group && this.entries.length > 50) this.entries.shift();
      if (this.group) this.group.added = true;
    }
    if (this.group?.added && sameBoardContent(after, this.group.before)) {
      this.entries.pop();
      this.group.added = false;
    }
  }

  end() {
    this.group = null;
    if (this.entries.length > 50) this.entries = this.entries.slice(-50);
  }

  dropNoop(board: FlowBoardData) {
    const previous = this.entries.at(-1);
    if (previous && sameBoardContent(previous, board)) this.entries.pop();
  }

  undo() {
    this.end();
    return this.entries.pop() ?? null;
  }

  clear() {
    this.entries = [];
    this.end();
  }
}
