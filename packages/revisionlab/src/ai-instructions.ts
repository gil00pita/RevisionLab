export const AI_INSTRUCTIONS_MAX_LENGTH = 32_000;

export interface RevisionLabAiInstructions {
  instructions: string;
  filePath: string;
  exists: boolean;
}
