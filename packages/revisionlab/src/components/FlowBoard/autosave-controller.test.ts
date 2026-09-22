import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../client/api.js";
import {
  BoardAutosaveController,
  type BoardAutosaveScheduler,
} from "./autosave-controller.js";
import { boardActions } from "./board-actions.js";
import { copyBoard, sameBoardContent } from "./board-history.js";
import type { FlowBoardData } from "./types.js";

const initial: FlowBoardData = {
  revision: 5,
  hiddenStepIds: [],
  nodes: ["a", "b", "c"].map((stepId, index) => ({
    stepId,
    x: 48 + index * 360,
    y: 48,
  })),
  edges: [
    {
      id: "recorded_a_b",
      sourceStepId: "a",
      targetStepId: "b",
      label: "",
      kind: "recorded",
    },
    {
      id: "recorded_b_c",
      sourceStepId: "b",
      targetStepId: "c",
      label: "",
      kind: "recorded",
    },
    {
      id: "manual_c_a",
      sourceStepId: "c",
      targetStepId: "a",
      label: "Try again",
      kind: "manual",
    },
  ],
};

function clock() {
  let now = 0;
  let id = 0;
  const tasks = new Map<number, { due: number; run: () => void }>();
  const scheduler: BoardAutosaveScheduler = {
    set(run, delay) {
      const key = ++id;
      tasks.set(key, { due: now + delay, run });
      return key;
    },
    clear(handle) {
      tasks.delete(handle as number);
    },
  };
  return {
    scheduler,
    async advance(ms: number) {
      const until = now + ms;
      for (;;) {
        const next = [...tasks]
          .filter(([, task]) => task.due <= until)
          .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
        if (!next) break;
        now = next[1].due;
        tasks.delete(next[0]);
        next[1].run();
        await settle();
      }
      now = until;
      await settle();
    },
  };
}

async function settle() {
  for (let index = 0; index < 12; index++) await Promise.resolve();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function fixture() {
  const time = clock();
  const calls: FlowBoardData[] = [];
  let saved = copyBoard(initial);
  let loads = 0;
  let save: (board: FlowBoardData) => Promise<FlowBoardData> = async (board) =>
    commit(board);
  let load: () => Promise<FlowBoardData> = async () => copyBoard(saved);
  function commit(board: FlowBoardData) {
    assert.equal(board.revision, saved.revision);
    saved = { ...copyBoard(board), revision: board.revision + 1 };
    return copyBoard(saved);
  }
  const controller = new BoardAutosaveController(initial, {
    scheduler: time.scheduler,
    async persist(board) {
      calls.push(copyBoard(board));
      return save(board);
    },
    async load() {
      loads++;
      return load();
    },
  });
  return {
    controller,
    actions: boardActions(controller),
    calls,
    time,
    commit,
    state: () => controller.getSnapshot(),
    get saved() {
      return saved;
    },
    get loads() {
      return loads;
    },
    setSaved(board: FlowBoardData) {
      saved = copyBoard(board);
    },
    setSave(handler: typeof save) {
      save = handler;
    },
    setLoad(handler: typeof load) {
      load = handler;
    },
  };
}

test("autosave debounces edits and no-op mutations create neither history nor writes", async () => {
  const f = fixture();
  assert.equal(f.state().canUndo, false);
  const snapshot = f.state();
  f.actions.moveNode("a", 48, 48);
  f.actions.removeEdge("missing");
  f.actions.removeScreen("missing");
  f.actions.restoreScreen("a");
  f.actions.arrange();
  assert.equal(f.state(), snapshot);
  await f.time.advance(1000);
  assert.equal(f.calls.length, 0);
  f.actions.moveNode("a", 100, 80);
  await f.time.advance(499);
  assert.equal(f.calls.length, 0);
  await f.time.advance(1);
  assert.equal(f.calls.length, 1);
  assert.equal(f.state().dirty, false);
  assert.equal(f.state().canUndo, true);
  assert.equal(f.state().savedBoard.revision, 6);
  assert.equal(f.actions.addEdge("a", "b", "Duplicate"), null);
  assert.match(f.state().error, /different screens/);
  assert.equal(await f.actions.flush(), true);
  assert.equal(f.state().error, "");
  assert.equal(f.calls.length, 1);
  f.actions.labelEdge("manual_c_a", "Try again ");
  await f.time.advance(500);
  assert.equal(f.calls.length, 1);
  assert.equal(f.state().board.edges[2].label, "Try again");
  assert.equal(f.actions.undo(), true);
  await f.time.advance(500);
  assert.ok(sameBoardContent(f.saved, initial));
  assert.equal(f.state().canUndo, false);
});

test("queued edits serialize behind a write and retain their data with the acknowledged revision", async () => {
  const f = fixture();
  const first = deferred<FlowBoardData>();
  const second = deferred<FlowBoardData>();
  f.setSave(() => (f.calls.length === 1 ? first.promise : second.promise));
  f.actions.moveNode("a", 100, 80);
  await f.time.advance(500);
  f.actions.moveNode("b", 450, 200);
  await f.time.advance(500);
  assert.equal(f.calls.length, 1);
  assert.equal(f.state().saving, true);
  first.resolve(f.commit(f.calls[0]));
  await settle();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].revision, 6);
  assert.deepEqual(f.calls[1].nodes.slice(0, 2), [
    { stepId: "a", x: 100, y: 80 },
    { stepId: "b", x: 450, y: 200 },
  ]);
  second.resolve(f.commit(f.calls[1]));
  await settle();
  assert.equal(f.state().board.revision, 7);
  assert.equal(f.state().dirty, false);
  f.controller.receive(initial);
  f.controller.receive({ ...f.calls[0], revision: 6 });
  assert.equal(f.state().board.revision, 7);
  assert.equal(f.state().board.nodes[1].y, 200);
  assert.equal(f.state().canUndo, true);
});

test("Undo after saved screen removal restores exact edge IDs, endpoints and positions", async () => {
  const f = fixture();
  f.actions.removeScreen("b");
  await f.time.advance(500);
  assert.deepEqual(f.saved.hiddenStepIds, ["b"]);
  assert.deepEqual(
    f.saved.edges.map((edge) => edge.id),
    ["manual_c_a"],
  );
  assert.equal(f.actions.undo(), true);
  assert.equal(f.state().dirty, true);
  assert.ok(sameBoardContent(f.state().board, initial));
  await f.time.advance(500);
  assert.deepEqual(f.saved.edges, initial.edges);
  assert.deepEqual(f.saved.nodes, initial.nodes);
  assert.deepEqual(f.saved.hiddenStepIds, []);
  assert.equal(f.saved.revision, 7);
  assert.equal(f.actions.undo(), false);
});

test("one drag and one typing burst each form a single undo operation", async () => {
  const f = fixture();
  f.actions.beginMove("a");
  f.actions.moveNode("a", 100, 60);
  await f.time.advance(700);
  f.actions.moveNode("a", 300, 180);
  await f.time.advance(700);
  assert.equal(f.calls.length, 0);
  f.actions.endMove();
  await f.time.advance(500);
  assert.equal(f.calls.length, 1);
  assert.equal(f.actions.undo(), true);
  await f.time.advance(500);
  assert.ok(sameBoardContent(f.saved, initial));
  assert.equal(f.state().canUndo, false);

  f.actions.labelEdge("manual_c_a", "Retry ");
  await f.time.advance(200);
  f.actions.labelEdge("manual_c_a", "Retry now");
  await f.time.advance(499);
  assert.equal(f.calls.length, 2);
  await f.time.advance(1);
  assert.equal(f.saved.edges[2].label, "Retry now");
  assert.equal(f.actions.undo(), true);
  await f.time.advance(500);
  assert.equal(f.saved.edges[2].label, "Try again");
  assert.equal(f.state().canUndo, false);
});

test("a drag returning to its initial position is a no-op with no history or request", async () => {
  const f = fixture();
  f.actions.beginMove("a");
  f.actions.moveNode("a", 500, 500);
  f.actions.moveNode("a", 48, 48);
  f.actions.endMove();
  await f.time.advance(1000);
  assert.equal(f.calls.length, 0);
  assert.equal(f.state().canUndo, false);
  assert.equal(f.state().dirty, false);
  for (let index = 0; index < 50; index++)
    f.actions.moveNode("a", 100 + index, 100);
  f.actions.beginMove("a");
  f.actions.moveNode("a", 500, 500);
  f.actions.moveNode("a", 149, 100);
  f.actions.endMove();
  let undos = 0;
  while (f.actions.undo()) undos++;
  assert.equal(undos, 50);
  assert.ok(sameBoardContent(f.state().board, initial));
});

test("Undo during an in-flight write stays dirty and autosaves the inverse afterwards", async () => {
  const f = fixture();
  const pending = deferred<FlowBoardData>();
  f.setSave((board) =>
    f.calls.length === 1 ? pending.promise : Promise.resolve(f.commit(board)),
  );
  f.actions.moveNode("a", 100, 80);
  await f.time.advance(500);
  assert.equal(f.actions.undo(), true);
  assert.equal(f.state().dirty, true);
  await f.time.advance(500);
  assert.equal(f.calls.length, 1);
  pending.resolve(f.commit(f.calls[0]));
  await settle();
  assert.equal(f.state().dirty, true);
  await f.time.advance(500);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].revision, 6);
  assert.ok(sameBoardContent(f.saved, initial));
  assert.equal(f.state().dirty, false);
});

test("flush drains edits arriving during its in-flight request before allowing exit", async () => {
  const f = fixture();
  const first = deferred<FlowBoardData>();
  f.setSave((board) =>
    f.calls.length === 1 ? first.promise : Promise.resolve(f.commit(board)),
  );
  f.actions.moveNode("a", 100, 80);
  const flushed = f.actions.flush();
  await settle();
  f.actions.moveNode("b", 420, 190);
  first.resolve(f.commit(f.calls[0]));
  assert.equal(await flushed, true);
  assert.equal(f.calls.length, 2);
  assert.equal(f.saved.nodes[1].y, 190);
  assert.equal(f.state().dirty, false);
});

test("network failure retains queued edits, pauses automatic retry, and reconciles before retry", async () => {
  const f = fixture();
  f.setSave(async () => {
    throw new Error("Network unavailable");
  });
  f.actions.moveNode("a", 100, 80);
  assert.equal(await f.actions.flush(), false);
  assert.equal(f.state().dirty, true);
  assert.match(f.state().error, /Network unavailable/);
  f.actions.moveNode("b", 430, 150);
  await f.time.advance(5000);
  assert.equal(f.calls.length, 1);
  f.setSave(async (board) => f.commit(board));
  assert.equal(await f.actions.retry(), true);
  assert.equal(f.loads, 1);
  assert.equal(f.calls.length, 2);
  assert.equal(f.saved.nodes[0].x, 100);
  assert.equal(f.saved.nodes[1].y, 150);
  assert.equal(f.state().canUndo, true);
});

test("lost acknowledgement followed by Undo reconciles the committed write and saves its inverse", async () => {
  const f = fixture();
  f.setSave(async (board) => {
    const saved = f.commit(board);
    if (f.calls.length === 1) throw new Error("Response lost");
    return saved;
  });
  f.actions.removeScreen("b");
  assert.equal(await f.actions.flush(), false);
  assert.equal(f.actions.undo(), true);
  assert.equal(f.state().dirty, true);
  assert.equal(await f.actions.retry(), true);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].revision, 6);
  assert.deepEqual(f.saved.edges, initial.edges);
  assert.deepEqual(f.saved.nodes, initial.nodes);
  assert.equal(f.state().dirty, false);
});

test("our own poll acknowledgement does not conflict or reset Undo when the response is lost", async () => {
  const f = fixture();
  const pending = deferred<FlowBoardData>();
  f.setSave(() => pending.promise);
  f.actions.moveNode("a", 100, 80);
  await f.time.advance(500);
  const committed = f.commit(f.calls[0]);
  f.controller.receive(committed);
  assert.equal(f.state().conflict, false);
  pending.reject(new Error("Response lost"));
  await settle();
  assert.equal(f.state().error, "");
  assert.equal(f.state().board.revision, 6);
  assert.equal(f.state().dirty, false);
  assert.equal(f.state().canUndo, true);
  f.controller.receive(committed);
  assert.equal(f.state().canUndo, true);
});

test("409 and external pending changes preserve drafts and prevent overwriting remote work", async () => {
  const f = fixture();
  f.setSave(async () => {
    throw new ApiError(409, "Changed elsewhere");
  });
  f.actions.moveNode("a", 100, 80);
  assert.equal(await f.actions.flush(), false);
  assert.equal(f.state().conflict, true);
  assert.equal(f.state().board.nodes[0].x, 100);
  assert.equal(f.state().canUndo, false);
  const remote = copyBoard(initial);
  remote.revision = 6;
  remote.nodes[0].x = 800;
  f.setSaved(remote);
  f.controller.receive(remote);
  assert.equal(f.state().board.nodes[0].x, 100);
  assert.equal(await f.actions.retry(), false);
  f.actions.moveNode("a", 999, 999);
  assert.equal(f.state().board.nodes[0].x, 100);
  assert.equal(await f.actions.discard(), true);
  assert.deepEqual(f.state().board, remote);
  assert.equal(f.state().conflict, false);
  assert.equal(f.state().canUndo, false);
  assert.equal(f.calls.length, 1);

  f.actions.moveNode("b", 430, 200);
  f.controller.receive({ ...remote, revision: 7 });
  await f.time.advance(500);
  assert.equal(f.state().conflict, true);
  assert.equal(f.calls.length, 1);
});

test("clean external adoption resets local history but matching and stale polls do not", async () => {
  const f = fixture();
  f.actions.moveNode("a", 100, 80);
  assert.equal(await f.actions.flush(), true);
  f.controller.receive(initial);
  f.controller.receive(f.saved);
  assert.equal(f.state().canUndo, true);
  f.controller.receive({ ...f.saved, revision: 7 });
  assert.equal(f.state().canUndo, true);
  const remote = copyBoard(f.state().board);
  remote.revision = 8;
  remote.nodes[1].x = 900;
  f.controller.receive(remote);
  assert.equal(f.state().canUndo, false);
  assert.deepEqual(f.state().board, remote);
});

test("explicit reload waits for the current write and clears pending edits only after a fresh read", async () => {
  const f = fixture();
  const pending = deferred<FlowBoardData>();
  f.setSave(() => pending.promise);
  f.actions.moveNode("a", 100, 80);
  await f.time.advance(500);
  f.actions.moveNode("b", 450, 200);
  const reloaded = f.actions.discard();
  assert.equal(f.state().reloading, true);
  assert.equal(f.loads, 0);
  pending.resolve(f.commit(f.calls[0]));
  assert.equal(await reloaded, true);
  assert.equal(f.loads, 1);
  assert.equal(f.calls.length, 1);
  assert.equal(f.state().board.nodes[0].x, 100);
  assert.equal(f.state().board.nodes[1].y, 48);
  assert.equal(f.state().canUndo, false);
  assert.equal(f.state().dirty, false);

  f.actions.moveNode("a", 120, 90);
  f.setLoad(async () => {
    throw new Error("Read failed");
  });
  assert.equal(await f.actions.discard(), false);
  assert.equal(f.state().board.nodes[0].x, 120);
  assert.equal(f.state().canUndo, true);
  assert.equal(f.state().dirty, true);
});

test("typing bursts still split into separate undo operations while offline", async () => {
  const f = fixture();
  f.setSave(async () => {
    throw new Error("Offline");
  });
  f.actions.labelEdge("manual_c_a", "First label");
  await f.time.advance(500);
  f.actions.labelEdge("manual_c_a", "Second label");
  await f.time.advance(500);
  f.actions.labelEdge("manual_c_a", "Third label");
  assert.equal(f.actions.undo(), true);
  assert.equal(f.state().board.edges[2].label, "Second label");
  assert.equal(f.actions.undo(), true);
  assert.equal(f.state().board.edges[2].label, "First label");
  assert.equal(f.calls.length, 1);
});

test("pause and resume tolerate Strict Mode cleanup without losing history or queued work", async () => {
  const f = fixture();
  f.actions.moveNode("a", 100, 80);
  f.controller.pause();
  await f.time.advance(1000);
  assert.equal(f.calls.length, 0);
  f.controller.resume();
  await f.time.advance(500);
  assert.equal(f.calls.length, 1);
  assert.equal(f.state().canUndo, true);
  assert.equal(f.state().dirty, false);
});
