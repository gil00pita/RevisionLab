import type {
  RevisionLabComment,
  RevisionLabPoint,
} from "../../server/types.js";

export interface FeedbackThreadProps {
  presentation?: "panel" | "bubble";
  apiPath: string;
  comments: RevisionLabComment[];
  route: string;
  flowId?: string;
  stepId?: string;
  edgeId?: string;
  allowNewComments?: boolean;
  canResolve: boolean;
  onRefresh: () => Promise<void>;
  anchor?: RevisionLabPoint | null;
  selectedCommentId?: string | null;
  onSelectComment?: (id: string | null) => void;
  onCancelAnchor?: () => void;
  onAnchorChange?: (point: RevisionLabPoint) => void;
  onCommentCreated?: (id: string) => void;
}
