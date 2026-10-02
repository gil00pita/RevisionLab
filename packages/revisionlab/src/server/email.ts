import type { ResolvedConfig } from "./config.js";
import { HttpError, isLoopback } from "./security.js";

export function usesDevelopmentEmail(
  request: Request,
  config: ResolvedConfig,
): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    isLoopback(request) &&
    !config.resendApiKey
  );
}

export async function deliverCode(
  config: ResolvedConfig,
  email: string,
  code: string,
  development: boolean,
): Promise<void> {
  if (development) return;
  if (!config.resendApiKey || !config.emailFrom) {
    throw new HttpError(
      503,
      "Configure RESEND_API_KEY and REVISIONLAB_EMAIL_FROM to deliver verification emails.",
    );
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [email],
        subject: `Your ${config.projectName} review code`,
        text: `Your RevisionLab verification code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
      }),
    });
    if (!response.ok) throw new Error("Delivery rejected");
  } catch {
    throw new HttpError(
      502,
      "The verification email could not be delivered. Please try again.",
    );
  }
}

export async function deliverLoginLink(
  config: ResolvedConfig,
  email: string,
  loginUrl: string,
  development: boolean,
  addedByOwner = false,
): Promise<void> {
  if (development) return;
  if (!config.resendApiKey || !config.emailFrom) {
    throw new HttpError(
      503,
      "Configure RESEND_API_KEY and REVISIONLAB_EMAIL_FROM to deliver login emails.",
    );
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [email],
        subject: addedByOwner
          ? `You were added to ${config.projectName}`
          : `Sign in to ${config.projectName}`,
        text: `${addedByOwner ? `You have been added to the ${config.projectName} workspace. ` : ""}Open this single-use link to sign in: ${loginUrl}\n\nIt expires in 15 minutes. If you did not request this, ignore this email.`,
      }),
    });
    if (!response.ok) throw new Error("Delivery rejected");
  } catch {
    throw new HttpError(
      502,
      "The login email could not be delivered. Please try again.",
    );
  }
}
