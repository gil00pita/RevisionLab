import { useEffect } from "react";
import { recordingLaunchParameter } from "../../../client/recording-launch.js";

export function useRecordingLaunch(enabled: boolean, onLaunch: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(recordingLaunchParameter) !== "1") return;
    const frame = requestAnimationFrame(() => {
      // Consume the launch request; captures and reloads use the original route.
      url.searchParams.delete(recordingLaunchParameter);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      onLaunch();
    });
    return () => cancelAnimationFrame(frame);
  }, [enabled, onLaunch]);
}
