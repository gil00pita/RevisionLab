import type {
  RevisionLabComment,
  RevisionLabPoint,
  RevisionLabElementAnchor,
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
  elementAnchor?: RevisionLabElementAnchor | null;
  selectedCommentId?: string | null;
  onSelectComment?: (id: string | null) => void;
  onCancelAnchor?: () => void;
  onAnchorChange?: (point: RevisionLabPoint) => void;
  onCommentCreated?: (id: string) => void;
}
