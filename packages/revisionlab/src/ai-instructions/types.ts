export interface DesignSystemResources {
  name: string;
  githubUrl: string;
  docsUrl: string;
  designUrl: string;
  skillUrl: string;
  mcpUrl: string;
}

export interface DesignSystem extends DesignSystemResources {
  id: string;
  stars: number | null;
  starsCheckedAt: string;
}

export interface AiInstructionSettings {
  instructions: string;
  designSystemEnabled: boolean;
  designSystemId: string;
  manual: DesignSystemResources;
  installSkill: boolean;
  configureMcp: boolean;
}
