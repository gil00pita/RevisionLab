export const emailProviders = [
  "environment",
  "disabled",
  "custom",
  "resend",
  "smtpdev",
] as const;
export type EmailProvider = (typeof emailProviders)[number];
export const emailProviderLabels: Record<EmailProvider, string> = {
  environment: "Host configuration",
  disabled: "Disabled",
  custom: "Custom SMTP",
  resend: "Resend",
  smtpdev: "SMTP.dev (sandbox)",
};
export const notificationSecretNames = [
  "customPassword",
  "resendApiKey",
  "smtpdevApiKey",
  "smtpdevPassword",
  "slackWebhook",
] as const;
export type NotificationSecret = (typeof notificationSecretNames)[number];
export interface NotificationSettings {
  defaultProvider: EmailProvider;
  custom: {
    from: string;
    host: string;
    port: number;
    security: "starttls" | "tls";
    username: string;
  };
  resend: { from: string };
  smtpdev: { from: string; username: string };
  email: { recipients: string[]; comments: boolean; issues: boolean };
  slack: { enabled: boolean; comments: boolean; issues: boolean };
}
export const defaultNotificationSettings: NotificationSettings = {
  defaultProvider: "environment",
  custom: { from: "", host: "", port: 587, security: "starttls", username: "" },
  resend: { from: "" },
  smtpdev: { from: "", username: "" },
  email: { recipients: [], comments: false, issues: false },
  slack: { enabled: false, comments: true, issues: true },
};
export interface NotificationConfiguration {
  settings: NotificationSettings;
  revision: number;
  configuredSecrets: Record<NotificationSecret, boolean>;
  encryptionAvailable: boolean;
  environmentEmailConfigured: boolean;
  lastDelivery: { email: string | null; slack: string | null };
}
export interface NotificationUpdate {
  settings: NotificationSettings;
  revision: number;
  secrets: Partial<Record<NotificationSecret, string | null>>;
}
