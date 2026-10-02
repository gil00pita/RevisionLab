import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import type {
  NotificationConfiguration,
  NotificationSecret,
  NotificationSettings,
  NotificationUpdate,
} from "../../../notification-settings.js";

export function useNotificationSettings(apiPath: string) {
  const [configuration, setConfiguration] =
    useState<NotificationConfiguration | null>(null);
  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const [secrets, setSecrets] = useState<NotificationUpdate["secrets"]>({});
  const [recipients, setRecipients] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  const accept = useCallback((value: NotificationConfiguration) => {
    setConfiguration(value);
    setDraft(value.settings);
    setSecrets({});
    setRecipients(value.settings.email.recipients.join(", "));
    setDirty(false);
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      accept(
        await apiRequest<NotificationConfiguration>(
          apiPath,
          "settings/notifications",
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiPath, accept]);
  useEffect(() => {
    let active = true;
    apiRequest<NotificationConfiguration>(apiPath, "settings/notifications")
      .then((value) => {
        if (active) accept(value);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load notifications.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiPath, accept]);
  function change(value: NotificationSettings) {
    setDraft(value);
    setDirty(true);
    setMessage("");
  }
  function changeSecret(
    name: NotificationSecret,
    value: string | null | undefined,
  ) {
    setSecrets((current) => ({ ...current, [name]: value }));
    setDirty(true);
    setMessage("");
  }
  async function save(): Promise<boolean> {
    if (!draft || !configuration || pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const settings = {
        ...draft,
        email: {
          ...draft.email,
          recipients: recipients
            .split(/[,\n]/)
            .map((value) => value.trim())
            .filter(Boolean),
        },
      };
      accept(
        await apiRequest<NotificationConfiguration>(
          apiPath,
          "settings/notifications",
          {
            method: "PATCH",
            body: JSON.stringify({
              settings,
              secrets,
              revision: configuration.revision,
            }),
          },
        ),
      );
      setMessage("Notification settings saved.");
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save notification settings.",
      );
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function test(channel: "email" | "slack", recipient: string) {
    if (pending.current || dirty) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiRequest<{ message: string }>(
        apiPath,
        "settings/notifications/test",
        {
          method: "POST",
          body: JSON.stringify(
            channel === "email" ? { channel, recipient } : { channel },
          ),
        },
      );
      setMessage(result.message);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Test delivery failed.",
      );
    } finally {
      try {
        accept(
          await apiRequest<NotificationConfiguration>(
            apiPath,
            "settings/notifications",
          ),
        );
      } catch {
        /* Keep the test result visible if the status refresh fails. */
      }
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    configuration,
    draft,
    secrets,
    recipients,
    setRecipients: (value: string) => {
      setRecipients(value);
      setDirty(true);
      setMessage("");
    },
    dirty,
    loading,
    busy,
    error,
    message,
    change,
    changeSecret,
    save,
    test,
    load,
  };
}
