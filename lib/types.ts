export type AppView =
  | "dashboard"
  | "overview"
  | "preview"
  | "flows"
  | "history"
  | "compare"
  | "access"
  | "account";

export type ReplayState = "healthy" | "attention" | "not-run";

export type Prototype = {
  id: string;
  name: string;
  description: string;
  screens: number;
  flows: number;
  version: string;
  updated: string;
  role: "Owner" | "Manager" | "Viewer";
  privacy: "Private";
  replay: ReplayState;
  members: string[];
};

export type RecordedStep = {
  id: string;
  order: number;
  from: string;
  to: string;
  label: string;
  flowId: string;
};
