import type { JournalData } from "./types.js";

const key = "revisionlab.recording-journal";
let volatile: JournalData | null = null;
let database: Promise<IDBDatabase> | undefined;
function db() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("revisionlab-recording", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("images", { keyPath: "id" });
    const timer = setTimeout(() => reject(new Error("Capture storage timed out.")), 3000);
    request.onsuccess = () => { clearTimeout(timer); resolve(request.result); };
    request.onerror = () => { clearTimeout(timer); reject(request.error); };
    request.onblocked = () => { clearTimeout(timer); reject(new Error("Capture storage is blocked.")); };
  });
}
export function readJournal(flowId: string): JournalData | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(key) ?? "null") as JournalData | null;
    if (data?.flowId === flowId && Array.isArray(data.entries) && data.entries.length <= 1000) return data;
  } catch { /* The current tab can keep recording without storage. */ }
  return volatile?.flowId === flowId ? volatile : null;
}
export function writeJournal(data: JournalData | null): boolean {
  volatile = data;
  try {
    if (data) sessionStorage.setItem(key, JSON.stringify(data));
    else sessionStorage.removeItem(key);
    return true;
  } catch { return false; }
}
async function images(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest) {
  const database = await db();
  return new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction("images", mode);
    const request = operation(transaction.objectStore("images"));
    const timer = setTimeout(() => { transaction.abort(); reject(new Error("Capture storage timed out.")); }, 3000);
    transaction.oncomplete = () => { clearTimeout(timer); resolve(request.result); };
    transaction.onerror = () => { clearTimeout(timer); reject(transaction.error); };
    transaction.onabort = () => { clearTimeout(timer); reject(transaction.error); };
  });
}
export async function storeImage(flowId: string, id: string, screenshot: string) {
  await images("readwrite", (store) => store.put({ flowId, id, screenshot }));
}
export async function readImage(id: string): Promise<string | undefined> {
  const result = await images("readonly", (store) => store.get(id)) as { screenshot?: string } | undefined;
  return result?.screenshot;
}
export async function removeImage(id: string) {
  await images("readwrite", (store) => store.delete(id));
}
