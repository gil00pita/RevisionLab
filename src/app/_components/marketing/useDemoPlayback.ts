"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getServerMotion = () => true;

export function useDemoPlayback({
  autoplay = true,
  steps = 10,
  interval = 2200,
  loop = true,
} = {}) {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getReducedMotion,
    getServerMotion,
  );
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const attach = useCallback(
    (node: HTMLDivElement | null) => setElement(node),
    [],
  );
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [manual, setManual] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    if (element) observer.observe(element);
    const onVisibility = () => setTabVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [element]);

  useEffect(() => {
    if (
      !visible ||
      !tabVisible ||
      !playing ||
      reducedMotion ||
      (!loop && phase === steps - 1)
    )
      return;
    const timer = window.setInterval(() => {
      setPhase((current) =>
        current === steps - 1 ? (loop ? 0 : current) : current + 1,
      );
    }, interval);
    return () => window.clearInterval(timer);
  }, [
    visible,
    tabVisible,
    playing,
    reducedMotion,
    steps,
    interval,
    loop,
    phase,
  ]);

  function replay() {
    setManual(false);
    setPhase(0);
    setPlaying(true);
  }
  function seek(next: number) {
    setManual(true);
    setPhase(next);
    setPlaying(false);
  }
  const active = playing && !reducedMotion && (loop || phase !== steps - 1);
  function toggle() {
    if (!loop && phase === steps - 1) replay();
    else setPlaying((current) => !current);
  }
  return {
    attach,
    phase: reducedMotion && autoplay && !manual ? steps - 1 : phase,
    playing: active,
    reducedMotion,
    replay,
    seek,
    toggle,
  };
}
