export const personaResearchStatuses = [
  "Assumption-Based",
  "Partially Validated",
  "Research-Backed",
  "Needs Validation",
] as const;

export const personaConfidenceLevels = [
  "Not Assessed",
  "Low",
  "Medium",
  "High",
] as const;

export const personaTypes = [
  "Primary",
  "Secondary",
  "Buyer",
  "Negative",
  "Other",
] as const;

export const personaFieldTypes = [
  "short-text", "long-text", "number", "single-select", "multi-select",
  "tags", "rating", "date", "boolean", "url", "file", "repeatable-text",
  "relationship",
] as const;

export type PersonaFieldType = (typeof personaFieldTypes)[number];
export type PersonaResearchStatus = (typeof personaResearchStatuses)[number];
export type PersonaConfidenceLevel = (typeof personaConfidenceLevels)[number];

export interface PersonaSection {
  id: string;
  personaId: string | null;
  name: string;
  description: string;
  position: number;
  hidden: boolean;
}

export interface PersonaField {
  id: string;
  sectionId: string;
  personaId: string | null;
  name: string;
  description: string;
  type: PersonaFieldType;
  options: string[];
  placeholder: string;
  required: boolean;
  hidden: boolean;
  position: number;
  validation: Record<string, unknown>;
}

export interface PersonaValue {
  id: string;
  personaId: string;
  fieldId: string;
  value: unknown;
  position: number;
  illustrative: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaEvidence {
  id: string;
  personaId: string;
  title: string;
  type: string;
  sourceReference: string;
  url: string;
  date: string | null;
  confidence: PersonaConfidenceLevel;
  notes: string;
  feedbackId: string | null;
  valueIds: string[];
  createdAt: string;
}

export interface PersonaActivity {
  id: string;
  personaId: string;
  actorName: string;
  action: string;
  createdAt: string;
}

export interface PersonaSavedTemplate {
  id: string;
  name: string;
  description: string;
  sourcePersonaId: string | null;
  sourceTemplateId: string | null;
  profile: { sections: PersonaSection[]; fields: PersonaField[]; values: PersonaValue[] };
  createdAt: string;
  updatedAt: string;
}

export interface PersonaProfile {
  sections: PersonaSection[];
  fields: PersonaField[];
  values: PersonaValue[];
  evidence: PersonaEvidence[];
  activity: PersonaActivity[];
}

export const standardPersonaSections = [
  { id: "basic", name: "Basic information" },
  { id: "goals", name: "Goals and motivations" },
  { id: "challenges", name: "Pain points and challenges" },
  { id: "behaviours", name: "Behaviours and preferences" },
  { id: "context", name: "Context and scenarios" },
  { id: "research", name: "Research notes" },
] as const;

export const standardPersonaFields: ReadonlyArray<{ id: string; sectionId: string; name: string; type: PersonaFieldType }> = [
  { id: "quote", sectionId: "basic", name: "Quote", type: "long-text" },
  { id: "age-range", sectionId: "basic", name: "Age range", type: "short-text" },
  { id: "occupation", sectionId: "basic", name: "Occupation", type: "short-text" },
  { id: "location", sectionId: "basic", name: "Location", type: "short-text" },
  { id: "background", sectionId: "basic", name: "Background", type: "long-text" },
  { id: "primary-goals", sectionId: "goals", name: "Primary goals", type: "repeatable-text" },
  { id: "secondary-goals", sectionId: "goals", name: "Secondary goals", type: "repeatable-text" },
  { id: "motivations", sectionId: "goals", name: "Motivations", type: "repeatable-text" },
  { id: "needs", sectionId: "goals", name: "Needs", type: "repeatable-text" },
  { id: "success-criteria", sectionId: "goals", name: "Success criteria", type: "repeatable-text" },
  { id: "pain-points", sectionId: "challenges", name: "Pain points", type: "repeatable-text" },
  { id: "frustrations", sectionId: "challenges", name: "Frustrations", type: "repeatable-text" },
  { id: "challenges", sectionId: "challenges", name: "Challenges", type: "repeatable-text" },
  { id: "barriers", sectionId: "challenges", name: "Barriers", type: "repeatable-text" },
  { id: "unmet-needs", sectionId: "challenges", name: "Unmet needs", type: "repeatable-text" },
  { id: "behaviours", sectionId: "behaviours", name: "Behaviours and habits", type: "repeatable-text" },
  { id: "technical-comfort", sectionId: "behaviours", name: "Technical proficiency", type: "rating" },
  { id: "digital-literacy", sectionId: "behaviours", name: "Digital confidence", type: "rating" },
  { id: "devices", sectionId: "behaviours", name: "Devices", type: "multi-select" },
  { id: "channels", sectionId: "behaviours", name: "Preferred channels", type: "multi-select" },
  { id: "accessibility-needs", sectionId: "behaviours", name: "Accessibility needs", type: "repeatable-text" },
  { id: "characteristics", sectionId: "behaviours", name: "Characteristics", type: "repeatable-text" },
  { id: "scenarios", sectionId: "context", name: "Typical scenarios", type: "repeatable-text" },
  { id: "usage-context", sectionId: "context", name: "Usage context", type: "long-text" },
  { id: "tasks", sectionId: "context", name: "Tasks", type: "repeatable-text" },
  { id: "environment", sectionId: "context", name: "Environment", type: "short-text" },
  { id: "products-used", sectionId: "context", name: "Products used", type: "tags" },
  { id: "user-journeys", sectionId: "context", name: "User journeys", type: "relationship" },
  { id: "relationships", sectionId: "context", name: "Relationships", type: "repeatable-text" },
  { id: "research-notes", sectionId: "research", name: "Research notes", type: "long-text" },
  { id: "assumptions", sectionId: "research", name: "Assumptions to validate", type: "repeatable-text" },
  { id: "validation-questions", sectionId: "research", name: "Validation questions", type: "repeatable-text" },
];
