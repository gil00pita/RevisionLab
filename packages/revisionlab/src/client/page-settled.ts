const reviewUi = "[data-revisionlab-ui], nextjs-portal, .html2canvas-container";

export function isHostMutation(record: MutationRecord): boolean {
  const element =
    record.target instanceof Element
      ? record.target
      : record.target.parentElement;
  if (element?.closest(reviewUi)) return false;
  if (record.type === "childList") {
    return [...record.addedNodes, ...record.removedNodes].some(
      (node) =>
        !(node instanceof Element) ||
        !node.matches(`${reviewUi}, style, script`),
    );
  }
  return true;
}

/** Observe the host without patching its fetch, router, or event handlers. */
export function waitForPageSettled(
  signal: AbortSignal,
  timeout = 10_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let quietSince = performance.now();
    const start = quietSince;
    const changed = () => {
      quietSince = performance.now();
    };
    const observer = new MutationObserver((records) => {
      if (records.some(isHostMutation)) changed();
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    const resources =
      typeof PerformanceObserver === "undefined"
        ? null
        : new PerformanceObserver(changed);
    resources?.observe({ entryTypes: ["resource"] });
    const clean = () => {
      clearInterval(timer);
      observer.disconnect();
      resources?.disconnect();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      clean();
      reject(new DOMException("Capture cancelled", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    const timer = setInterval(() => {
      const imagesReady = [...document.images].every(
        (image) =>
          image.closest(reviewUi) || image.complete || image.loading === "lazy",
      );
      const hostBusy = [
        ...document.querySelectorAll('[aria-busy="true"]'),
      ].some((element) => !element.closest(reviewUi));
      if (
        document.readyState === "complete" &&
        document.fonts.status === "loaded" &&
        imagesReady &&
        !hostBusy &&
        performance.now() - quietSince >= 650
      ) {
        clean();
        resolve();
      } else if (performance.now() - start >= timeout) {
        clean();
        reject(
          new Error(
            "The page has not settled. Wait for loading to finish and try again.",
          ),
        );
      }
    }, 100);
    if (signal.aborted) abort();
  });
}
