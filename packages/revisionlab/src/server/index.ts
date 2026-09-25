export { defineRevisionLabConfig } from "./config.js";
export { createRevisionLabHandler } from "./route-handler.js";
export { authorizeRevisionLabRequest } from "./authentication.js";
export { protectRevisionLab } from "./protection.js";
export { HttpError } from "./security.js";
export type {
  RevisionLabActor,
  RevisionLabArtifactStorage,
  RevisionLabBoard,
  RevisionLabComment,
  RevisionLabConfig,
  RevisionLabElementAnchor,
  RevisionLabFlow,
  RevisionLabInvitation,
  RevisionLabPoint,
  RevisionLabPersona,
  RevisionLabRole,
  RevisionLabRouteContext,
  RevisionLabRouteHandler,
  RevisionLabState,
  RevisionLabSettings,
  CommentBubbleColor,
  RevisionLabStep,
  RevisionLabCapture,
} from "./types.js";
