import {
  captureExcluded,
  takeInteractionSnapshot,
  type InteractionSnapshot,
} from "./interaction-snapshot.js";

/** Freeze pointer/keyboard state without cancelling or replaying host events. */
export function prepareInteractionSnapshots(
  enabled: () => boolean,
  onRemovedTarget: (event: PointerEvent) => void,
) {
  let prepared: InteractionSnapshot | undefined;
  let target: Element | undefined;
  let timer: ReturnType<typeof setTimeout>;
  let rendering = 0;
  let releasedAt = -Infinity;
  const freeze = () => {
    // Coalesce rapid interactions rather than starting unbounded DOM renders.
    if (rendering >= 2) return;
    rendering += 1;
    const snapshot = takeInteractionSnapshot();
    void snapshot.image.then(() => {
      rendering -= 1;
    });
    return snapshot;
  };
  const clear = () => {
    prepared = undefined;
    target = undefined;
    clearTimeout(timer);
  };
  const prepare = (event: PointerEvent | KeyboardEvent) => {
    if (
      !event.isTrusted ||
      !enabled() ||
      !(event.target instanceof Element) ||
      event.target.closest(captureExcluded)
    )
      return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
      return;
    if (
      event instanceof PointerEvent &&
      (event.button !== 0 || !event.isPrimary)
    )
      return;
    if (
      event instanceof KeyboardEvent &&
      (event.repeat || !["Enter", " "].includes(event.key))
    )
      return;
    if (
      event instanceof KeyboardEvent &&
      !event.target.closest(
        'button, a[href], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], [role="button"], [role="link"], [role="menuitem"]',
      )
    )
      return;
    clear();
    prepared = freeze();
    target = event.target;
    timer = setTimeout(clear, 2000);
  };
  const release = (event: PointerEvent) => {
    // Removing the pressed control on pointerdown can prevent a click event.
    if (prepared && target && !target.isConnected) {
      onRemovedTarget(event);
      releasedAt = performance.now();
    }
  };
  window.addEventListener("pointerdown", prepare, true);
  window.addEventListener("pointerup", release, true);
  window.addEventListener("keydown", prepare, true);
  window.addEventListener("pointercancel", clear, true);
  return {
    consume: () => {
      const snapshot = prepared ?? freeze();
      clear();
      return snapshot;
    },
    skipClick: () => performance.now() - releasedAt < 100,
    dispose: () => {
      clear();
      window.removeEventListener("pointerdown", prepare, true);
      window.removeEventListener("pointerup", release, true);
      window.removeEventListener("keydown", prepare, true);
      window.removeEventListener("pointercancel", clear, true);
    },
  };
}
