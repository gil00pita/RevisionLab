import type { Prototype, RecordedStep } from "./types";

export const prototypes: Prototype[] = [
  {
    id: "checkout-service",
    name: "Checkout service",
    description: "Responsive purchase journey for the next checkout release.",
    screens: 4,
    flows: 3,
    version: "v0.8.4",
    updated: "4 minutes ago",
    role: "Owner",
    privacy: "Private",
    replay: "healthy",
    members: ["JD", "MP", "AK", "+2"],
  },
  {
    id: "account-onboarding",
    name: "Account onboarding",
    description: "Verified signup and first-run setup.",
    screens: 6,
    flows: 2,
    version: "v1.2.0",
    updated: "Yesterday",
    role: "Manager",
    privacy: "Private",
    replay: "healthy",
    members: ["MP", "NT", "+3"],
  },
  {
    id: "profile-settings",
    name: "Profile settings",
    description: "Account, password, and session controls.",
    screens: 4,
    flows: 2,
    version: "v0.6.1",
    updated: "2 days ago",
    role: "Owner",
    privacy: "Private",
    replay: "healthy",
    members: ["JD", "SL"],
  },
  {
    id: "billing-portal",
    name: "Billing portal",
    description: "Subscription and invoice management.",
    screens: 5,
    flows: 4,
    version: "v1.0.3",
    updated: "3 days ago",
    role: "Viewer",
    privacy: "Private",
    replay: "attention",
    members: ["AK", "RP", "+1"],
  },
  {
    id: "help-centre",
    name: "Help centre",
    description: "Support discovery and contact routes.",
    screens: 3,
    flows: 1,
    version: "v0.4.7",
    updated: "19 Aug",
    role: "Manager",
    privacy: "Private",
    replay: "not-run",
    members: ["SL", "NT"],
  },
];

export const activity = [
  { action: "Replay completed", detail: "Checkout happy path · desktop", time: "4 min", actor: "Jamie Diaz", tone: "healthy" },
  { action: "Version published", detail: "v0.8.4 · 4 viewport snapshots", time: "12 min", actor: "Morgan Price", tone: "neutral" },
  { action: "Screen updated", detail: "Payment · stable targets checked", time: "2 hr", actor: "Jamie Diaz", tone: "neutral" },
  { action: "Access changed", detail: "Viewer invitation accepted", time: "1 day", actor: "Ari Khan", tone: "neutral" },
];

export const seedSteps: RecordedStep[] = [
  { id: "step-1", order: 1, from: "Basket", to: "Delivery", label: "Continue to delivery", flowId: "continue-to-delivery" },
  { id: "step-2", order: 2, from: "Delivery", to: "Payment", label: "Confirm delivery address", flowId: "confirm-address" },
  { id: "step-3", order: 3, from: "Payment", to: "Confirmation", label: "Pay securely", flowId: "pay-now" },
];

export const versionHistory = [
  { version: "v0.8.4", title: "Payment reassurance and review", note: "Clarified the final payment action and strengthened the error state.", author: "Jamie Diaz", time: "Today, 10:24", commit: "a18fd93", status: "Current", screens: 12 },
  { version: "v0.8.3", title: "Delivery address refinement", note: "Reduced repeated copy and added postcode lookup recovery.", author: "Morgan Price", time: "Yesterday, 16:42", commit: "fe84c01", status: "Available", screens: 12 },
  { version: "v0.8.2", title: "Responsive basket baseline", note: "Captured the first stable phone, tablet, and desktop evidence.", author: "Jamie Diaz", time: "2 Sep, 09:18", commit: "706bc4e", status: "Available", screens: 9 },
];
