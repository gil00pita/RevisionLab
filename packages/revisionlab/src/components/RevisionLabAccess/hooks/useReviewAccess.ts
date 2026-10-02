import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";

export function useReviewAccess(apiPath: string, basePath: string) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("code") ?? ""),
  );
  const [loginToken] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("login") ?? ""),
  );
  const [returnTo] = useState(() =>
    typeof window === "undefined"
      ? basePath
      : (new URLSearchParams(window.location.search).get("returnTo") ??
        basePath),
  );
  const [requested, setRequested] = useState(false);
  const [devLoginUrl, setDevLoginUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const consuming = useRef(false);

  async function requestLink() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ ok: true; devLoginUrl?: string }>(
        apiPath,
        "auth/magic-request",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim(),
            joinCode: joinCode.trim() || undefined,
            returnTo,
          }),
        },
      );
      setRequested(true);
      setDevLoginUrl(result.devLoginUrl ?? "");
      setNotice(
        "If this email can access the workspace, a single-use login link has been sent.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not send your login link.",
      );
    } finally {
      setBusy(false);
    }
  }

  const consumeLink = useCallback(
    async function consumeLink() {
      if (!loginToken || busy) return;
      setBusy(true);
      setError("");
      try {
        const result = await apiRequest<{ returnTo: string }>(
          apiPath,
          "auth/magic-consume",
          {
            method: "POST",
            body: JSON.stringify({
              token: loginToken,
              name: name.trim() || undefined,
            }),
          },
        );
        window.location.assign(result.returnTo || basePath);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "We could not use this login link.",
        );
        setBusy(false);
      }
    },
    [apiPath, basePath, busy, loginToken, name],
  );

  useEffect(() => {
    if (!loginToken || consuming.current) return;
    consuming.current = true;
    void consumeLink();
  }, [consumeLink, loginToken]);

  return {
    email,
    setEmail,
    name,
    setName,
    joinCode,
    setJoinCode,
    loginToken,
    requested,
    devLoginUrl,
    busy,
    error,
    notice,
    requestLink,
    consumeLink,
  };
}
