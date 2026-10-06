import { useCallback, useEffect, useRef, useState } from "react";

export const dashboardUpdateEase = "cubic-bezier(0.16, 1, 0.3, 1)";

/** A brief acknowledgement of changed data, never an entrance or counting effect. */
export function useDashboardUpdate(value: number | null, enabled = true) {
  const ref = useRef<HTMLElement>(null);
  const previous = useRef(value);
  const visible = useRef(false);
  const frame = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);

  const cancelFeedback = useCallback(() => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    if (timer.current !== null) window.clearTimeout(timer.current);
    frame.current = null;
    timer.current = null;
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const stopFeedback = () => {
      cancelFeedback();
      setRecentlyUpdated(false);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") stopFeedback();
    };
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "undefined") {
      visible.current = true;
    } else {
      observer = new IntersectionObserver(([entry]) => {
        visible.current = entry.isIntersecting;
        if (!entry.isIntersecting) stopFeedback();
      });
      observer.observe(node);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cancelFeedback();
    };
  }, [cancelFeedback]);

  useEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    cancelFeedback();
    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      if (
        !changed ||
        !enabled ||
        !visible.current ||
        document.visibilityState !== "visible"
      ) {
        setRecentlyUpdated(false);
        return;
      }
      setRecentlyUpdated(true);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setRecentlyUpdated(false);
      }, 650);
    });
    return cancelFeedback;
  }, [value, enabled, cancelFeedback]);

  return { ref, recentlyUpdated };
}
