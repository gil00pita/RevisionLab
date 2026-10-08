import { personaAvatarIds } from "../../persona-avatars.js";

export const personaRecommendations = [
  {
    name: "First-time or novice user",
    description:
      "Unfamiliar with the product, needs clear guidance, onboarding and forgiving interactions",
  },
  {
    name: "Regular user",
    description:
      "Uses the product repeatedly and values predictability, speed and continuity",
  },
  {
    name: "Expert or power user",
    description:
      "Uses advanced features, shortcuts, bulk actions and customisation",
  },
  {
    name: "Occasional or returning user",
    description:
      "Uses the product infrequently and may need reminders or contextual help",
  },
  {
    name: "Guest or unauthenticated user",
    description:
      "Has limited access and may be evaluating the product before registering",
  },
  {
    name: "Administrator or operator",
    description:
      "Configures the system, manages users, permissions, settings and data",
  },
  {
    name: "Buyer or decision-maker",
    description:
      "Selects or purchases the product but may not use it day to day",
  },
  {
    name: "Support or service agent",
    description:
      "Resolves user problems, investigates records and may act on another user’s behalf",
  },
  {
    name: "Accessibility-focused user",
    description:
      "Encounters visual, auditory, motor or cognitive barriers, including permanent, temporary and situational limitations",
  },
  {
    name: "Misuse or anti-persona",
    description:
      "Represents accidental or deliberate misuse that could harm users, the service or the business",
  },
] as const;

export const personaTemplates = personaRecommendations.map(
  (recommendation, index) => ({
    ...recommendation,
    avatar: personaAvatarIds[index] ?? null,
  }),
);

export type PersonaTemplate = (typeof personaTemplates)[number];
