import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";

interface Challenge {
  challengeId: string;
  devCode?: string;
}

export function useReviewAccess(apiPath: string, basePath: string) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inviteToken = useRef<string | undefined>(undefined);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    inviteToken.current = query.get("invite") ?? undefined;
  }, []);

  async function requestCode() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<Challenge>(apiPath, "auth/request", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          inviteToken: inviteToken.current,
        }),
      });
      setChallenge(result);
      setCode("");
      setNotice(
        challenge
          ? "A new code is ready. Use the latest code to continue."
          : "",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not send your code. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!challenge || busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, "auth/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          email: email.trim(),
          code: code.trim(),
          name: name.trim(),
        }),
      });
      window.location.assign(basePath);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not verify your code. Please try again.",
      );
      setBusy(false);
    }
  }

  function changeEmail() {
    setChallenge(null);
    setCode("");
    setError("");
    setNotice("");
  }

  return {
    email,
    setEmail,
    name,
    setName,
    code,
    setCode,
    challenge,
    busy,
    error,
    notice,
    requestCode,
    verifyCode,
    changeEmail,
  };
}
