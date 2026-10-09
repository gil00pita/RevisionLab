import { useRef, useState } from "react";
import { Box, Flex, Stack } from "@chakra-ui/react";
import { FeedbackThread } from "../../FeedbackThread/index.js";
import type {
  RevisionLabComment,
  RevisionLabFlow,
  RevisionLabPoint,
  RevisionLabStep,
} from "../../../server/types.js";
import { ScreenCanvas } from "./ScreenCanvas.js";
import { ScreenFeedbackControls, type ScreenFeedbackFilter } from "./ScreenFeedbackControls.js";
import { ScreenAccessibility } from "./ScreenAccessibility.js";
import { ScreenAccessibilityIssue } from "./ScreenAccessibilityIssue.js";
import type { ScreenDisplayOptions } from "../../PinnedScreen/index.js";
import { ReviewItemActions } from "../../ReviewAutomation/index.js";

export function ScreenReview({
  flow,
  step,
  comments,
  onSelectStep,
  apiPath,
  basePath,
  canResolve,
  onRefresh,
}: {
  flow: RevisionLabFlow;
  step?: RevisionLabStep;
  comments: RevisionLabComment[];
  onSelectStep: (id: string) => void;
  apiPath: string;
  basePath: string;
  canResolve: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [anchor, setAnchor] = useState<RevisionLabPoint | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [displayOptions, setDisplayOptions] = useState<ScreenDisplayOptions>({ showBubbles: true, showResolved: false, showCursor: false });
  const [feedbackFilter, setFeedbackFilter] = useState<ScreenFeedbackFilter>("all");
  const feedback = useRef<HTMLDivElement>(null);
  const pinElements = useRef(new Map<string, HTMLButtonElement>());
  const selectedPin = comments.find(
    (comment) => comment.id === selected && comment.anchor && !comment.parentId,
  );

  const report = step?.capture?.accessibility;
  const showComments = feedbackFilter !== "accessibility";
  const accessibilityItems = feedbackFilter === "comments" || report?.status === "unavailable"
    ? []
    : (report?.issues ?? []).map((issue) => ({
      id: `accessibility-${issue.id}`,
      createdAt: report?.checkedAt ?? step?.createdAt ?? "",
      content: <ScreenAccessibilityIssue issue={issue} />,
    }));

  function selectComment(id: string | null) {
    if (feedbackFilter === "accessibility") setFeedbackFilter("comments");
    setAnchor(null);
    setSelected(id);
    setBubbleOpen(
      Boolean(comments.find((comment) => comment.id === id)?.anchor),
    );
  }

  function revealFeedback() {
    // On a narrow screen the discussion follows the capture in document order.
    if (window.matchMedia("(max-width: 1279px)").matches)
      feedback.current?.scrollIntoView({ block: "start" });
  }

  function revealComment(id: string | null) {
    selectComment(id);
    // Selecting a hidden resolved thread first mounts its pin.
    if (id)
      requestAnimationFrame(() =>
        pinElements.current
          .get(id)
          ?.scrollIntoView({ block: "center", inline: "nearest" }),
      );
  }

  return (
    <Flex flex="1" minW="0" direction={{ base: "column", xl: "row" }}>
      <ScreenCanvas
        flow={flow}
        step={step}
        displayOptions={displayOptions}
        onAddComment={() => {
          setFeedbackFilter("comments");
          selectComment(null);
        }}
        onSelect={onSelectStep}
        basePath={basePath}
        comments={comments}
        anchor={anchor}
        selectedCommentId={selected}
        pinElements={pinElements}
        onImageReadyChange={setImageReady}
        bubbleOpen={Boolean(selectedPin) && bubbleOpen}
        onBubbleOpenChange={setBubbleOpen}
        discussion={
          selectedPin && (
            <FeedbackThread
              key={selectedPin.id}
              presentation="bubble"
              apiPath={apiPath}
              flowId={flow.id}
              stepId={step?.id}
              route={step?.route ?? flow.route}
              comments={comments}
              canResolve={canResolve}
              onRefresh={onRefresh}
              selectedCommentId={selectedPin.id}
              renderActions={(comment) => (
                <ReviewItemActions
                  target={{ kind: "comment", commentId: comment.id }}
                />
              )}
            />
          )
        }
        onPlace={(point) => {
          setFeedbackFilter("comments");
          setSelected(null);
          setBubbleOpen(false);
          setAnchor(point);
          revealFeedback();
          requestAnimationFrame(() => feedback.current?.querySelector("textarea")?.focus());
        }}
        onSelectComment={selectComment}
      />
      <Box
        ref={feedback}
        as="aside"
        aria-label="Screen feedback"
        w={{ base: "full", xl: "80", "2xl": "96" }}
        flexShrink="0"
        bg="bg.subtle"
        borderLeftWidth={{ base: "0", xl: "1px" }}
        borderTopWidth={{ base: "1px", xl: "0" }}
        borderColor="border"
        p="5"
      >
        <Stack gap="4">
          <ScreenFeedbackControls
            value={feedbackFilter}
            onChange={setFeedbackFilter}
            displayOptions={displayOptions}
            onDisplayOptionsChange={setDisplayOptions}
            hasCapture={Boolean(step?.screenshot)}
            hasCursor={Boolean(step?.capture?.cursor.length)}
          />
          {feedbackFilter !== "comments" && <ScreenAccessibility report={report} />}
          <FeedbackThread
            presentation="collection"
            collectionItems={accessibilityItems}
            showComposer={showComments}
            apiPath={apiPath}
            flowId={flow.id}
            stepId={step?.id}
            route={step?.route ?? flow.route}
            comments={showComments ? comments : []}
            canResolve={canResolve}
            onRefresh={onRefresh}
            anchor={anchor}
            onAnchorChange={setAnchor}
            onCancelAnchor={() => setAnchor(null)}
            selectedCommentId={selectedPin && imageReady ? null : selected}
            renderActions={(comment) => (
              <ReviewItemActions
                target={{ kind: "comment", commentId: comment.id }}
              />
            )}
            onSelectComment={revealComment}
            onCommentCreated={(id) => {
              setSelected(id);
              setBubbleOpen(Boolean(anchor));
              setAnchor(null);
              // The refreshed comment's pin mounts after this state update.
              requestAnimationFrame(() =>
                pinElements.current
                  .get(id)
                  ?.scrollIntoView({ block: "center", inline: "nearest" }),
              );
            }}
          />
        </Stack>
      </Box>
    </Flex>
  );
}
