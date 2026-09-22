import type {
  RevisionLabComment,
  RevisionLabFlow,
} from "../../server/types.js";

export interface FlowBoardProps {
  flow: RevisionLabFlow;
  comments: RevisionLabComment[];
  apiPath: string;
  canEdit: boolean;
  navigationPending?: boolean;
  selectedStepId?: string;
  onOpenScreen: (stepId: string) => void;
  onRefresh: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onBeforeLeaveChange?: (handler: (() => Promise<boolean>) | null) => void;
}

export type FlowBoardData = RevisionLabFlow["board"];
export type BoardNode = FlowBoardData["nodes"][number];
export type BoardEdge = FlowBoardData["edges"][number];
