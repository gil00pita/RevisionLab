import { personaAvatarIds } from "../../persona-avatars.js";
import { builtInPersonaSuggestions } from "../../persona-template-suggestions.js";

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  category?: string;
  saved?: boolean;
}

export const personaTemplates: PersonaTemplate[] = builtInPersonaSuggestions.map(
  (template, index) => ({
    id: template.id,
    category: template.category,
    name: template.name,
    description: template.description,
    avatar: personaAvatarIds[index] ?? null,
  }),
);

export const personaRecommendations = personaTemplates;
