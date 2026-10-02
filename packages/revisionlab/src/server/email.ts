import type { ResolvedConfig } from "./config.js";
import { getDatabase } from "./database.js";
import { HttpError, isLoopback } from "./security.js";
import { readNotificationRecord } from "./notifications/store.js";
import { sendEmail } from "./notifications/delivery.js";

export async function usesDevelopmentEmail(
  request: Request,
  config: ResolvedConfig,
): Promise<boolean> {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    !isLoopback(request)
  )
    return false;
  const { settings } = await readNotificationRecord(await getDatabase(config));
  return settings.defaultProvider === "environment" && !config.resendApiKey;
}

export async function deliverCode(
  config: ResolvedConfig,
  email: string,
  code: string,
  development: boolean,
): Promise<void> {
  if (development) return;
  try {
    await sendEmail(await getDatabase(config), config, {
      to: [email],
      subject: `Your ${config.projectName} review code`,
      text: `Your RevisionLab verification code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
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
  try {
    await sendEmail(await getDatabase(config), config, {
      to: [email],
      subject: addedByOwner
        ? `You were added to ${config.projectName}`
        : `Sign in to ${config.projectName}`,
      text: `${addedByOwner ? `You have been added to the ${config.projectName} workspace. ` : ""}Open this single-use link to sign in: ${loginUrl}\n\nIt expires in 15 minutes. If you did not request this, ignore this email.`,
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      502,
      "The login email could not be delivered. Please try again.",
    );
  }
}
