import { useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import { detectLiveUrl, type SetupProgress } from "../../../setup.js";
import type { RevisionLabState } from "../../../server/types.js";
import type { RevisionLabSettings } from "../../../comment-settings.js";

export function useSetupWizard(
  data: RevisionLabState,
  apiPath: string,
  onRefresh: () => Promise<void>,
  onComplete: () => void,
) {
  const [progress, setProgress] = useState(data.setup);
  const [step, setStep] = useState(data.setup.step);
  const [name, setName] = useState(
    data.setup.name || (data.actor.local ? "" : data.actor.name),
  );
  const [email, setEmail] = useState(
    data.setup.email ||
      (data.actor.email === "owner@localhost" ? "" : data.actor.email),
  );
  const [systemUrl, setSystemUrl] = useState(
    () =>
      data.accessSettings?.systemUrl ||
      (typeof window === "undefined"
        ? ""
        : detectLiveUrl(window.location.origin)),
  );
  const [settings, setSettings] = useState(data.settings);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const colorInherited = useRef(data.setup.step < 2);

  function changeSettings(patch: Partial<RevisionLabSettings>) {
    setSettings((previous) => ({
      ...previous,
      ...patch,
      ...(patch.widgetColor && colorInherited.current
        ? { commentBubbleColor: patch.widgetColor }
        : {}),
    }));
    if (patch.commentBubbleColor) colorInherited.current = false;
  }
  function navigate(next: number) {
    setStep(next);
    requestAnimationFrame(() =>
      document.getElementById("revisionlab-setup-heading")?.focus(),
    );
  }
  async function save(finish = false) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      let next = progress;
      if (step === 0) {
        next = await apiRequest<SetupProgress>(apiPath, "setup", {
          method: "PATCH",
          body: JSON.stringify({ action: "identity", name, email, systemUrl }),
        });
        setProgress(next);
      }
      if (step >= 1 && step <= 3) {
        const patch =
          step === 1
            ? {
                widgetColor: settings.widgetColor,
                widgetPosition: settings.widgetPosition,
                widgetSide: settings.widgetPosition.endsWith("left")
                  ? ("left" as const)
                  : ("right" as const),
                showWidget: settings.showWidget,
                ...(colorInherited.current
                  ? { commentBubbleColor: settings.commentBubbleColor }
                  : {}),
              }
            : step === 2
              ? {
                  showCommentBubbles: settings.showCommentBubbles,
                  commentBubbleColor: settings.commentBubbleColor,
                }
              : {
                  auditLivePages: settings.auditLivePages,
                  auditRecordings: settings.auditRecordings,
                };
        await apiRequest(apiPath, "settings", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
      }
      if (finish || step === 5) {
        next = await apiRequest<SetupProgress>(apiPath, "setup", {
          method: "PATCH",
          body: JSON.stringify({ action: "finish" }),
        });
        setProgress(next);
        window.history.replaceState(null, "", "?view=flows");
        onComplete();
        await onRefresh();
      } else {
        if (step > 0) {
          next = await apiRequest<SetupProgress>(apiPath, "setup", {
            method: "PATCH",
            body: JSON.stringify({ action: "advance", step: step + 1 }),
          });
          setProgress(next);
        }
        if (step === 2) colorInherited.current = false;
        await onRefresh();
        navigate(step + 1);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save setup. Try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    step,
    progress,
    name,
    setName,
    email,
    setEmail,
    systemUrl,
    setSystemUrl,
    settings,
    changeSettings,
    error,
    busy,
    navigate,
    save,
  };
}
