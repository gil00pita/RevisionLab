export type AppView =
  | "dashboard"
  | "project"
  | "new-project"
  | "overview"
  | "preview"
  | "flows"
  | "history"
  | "compare"
  | "access"
  | "account";

export type ReplayState = "healthy" | "attention" | "not-run";

export type ProjectBuildState = "ready" | "attention" | "awaiting-runner";

export type EnvironmentVariableMeta = {
  id: string;
  key: string;
  secret: boolean;
  phase: "build" | "runtime";
  target: "preview" | "replay" | "both";
};

export type PrototypeRuntime = {
  installCommand: string;
  buildCommand: string;
  startCommand: string;
  port: number;
  healthPath: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  repository: string;
  branch: string;
  provider: "GitHub";
  role: "Owner" | "Manager" | "Viewer";
  members: string[];
  prototypeIds: string[];
  environmentVariables: EnvironmentVariableMeta[];
  buildState: ProjectBuildState;
  lastBuild: string;
};

export type Prototype = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  rootDirectory: string;
  framework: string;
  runtime: PrototypeRuntime;
  environmentVariables: EnvironmentVariableMeta[];
  buildState: ProjectBuildState;
  screenNames: string[];
  screens: number;
  flows: number;
  version: string;
  updated: string;
  role: "Owner" | "Manager" | "Viewer";
  privacy: "Private";
  replay: ReplayState;
  members: string[];
};

export type PrototypeImportInput = {
  project?: {
    name: string;
    description: string;
    repository: string;
    branch: string;
    environmentVariables: EnvironmentVariableMeta[];
  };
  prototype: {
    name: string;
    rootDirectory: string;
    framework: string;
    installCommand: string;
    buildCommand: string;
    startCommand: string;
    port: number;
    healthPath: string;
    environmentVariables: EnvironmentVariableMeta[];
  };
};

export type RecordedStep = {
  id: string;
  order: number;
  from: string;
  to: string;
  label: string;
  flowId: string;
};
