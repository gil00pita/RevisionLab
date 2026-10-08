"use client";

import { useMemo, useSyncExternalStore } from "react";
import { defaultDemoDraft, type DemoDraft, type DemoField } from "./demoData";

const storageKey = "revisionlab:northstar-demo:v1";
const changeEvent = "revisionlab:northstar-demo-change";
const defaultSnapshot = JSON.stringify(defaultDemoDraft);
let memorySnapshot = defaultSnapshot;

function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot() {
  try {
    return window.sessionStorage.getItem(storageKey) ?? memorySnapshot;
  } catch {
    return memorySnapshot;
  }
}

function readDraft(snapshot: string): DemoDraft {
  const draft = { ...defaultDemoDraft };
  try {
    const saved = JSON.parse(snapshot);
    if (!saved || typeof saved !== "object") return draft;
    for (const key of Object.keys(draft) as DemoField[]) {
      if (typeof saved[key] === "string" && saved[key].length <= 100)
        draft[key] = saved[key];
    }
  } catch {
    // An invalid or older browser draft starts from the fictional sample.
  }
  return draft;
}

function writeDraft(draft: DemoDraft) {
  memorySnapshot = JSON.stringify(draft);
  try {
    window.sessionStorage.setItem(storageKey, memorySnapshot);
  } catch {
    // Keep navigation usable when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function useDemoDraft() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => defaultSnapshot,
  );
  const draft = useMemo(() => readDraft(snapshot), [snapshot]);

  function update(field: DemoField, value: string) {
    writeDraft({ ...readDraft(getSnapshot()), [field]: value });
  }

  function reset() {
    writeDraft({ ...defaultDemoDraft });
  }

  return { draft, update, reset };
}
