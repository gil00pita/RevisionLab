import { useRef, useState } from "react";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { FeedbackThread } from "../../FeedbackThread/index.js";
import type {
  RevisionLabComment,
  RevisionLabFlow,
  RevisionLabPoint,
  RevisionLabStep,
} from "../../../server/types.js";
import { ScreenCanvas } from "./ScreenCanvas.js";

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
  const feedback = useRef<HTMLDivElement>(null);
  const pinElements = useRef(new Map<string, HTMLButtonElement>());
  const selectedPin = comments.find(
    (comment) => comment.id === selected && comment.anchor && !comment.parentId,
  );

  function selectComment(id: string | null) {
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
            />
          )
        }
        onPlace={(point) => {
          setSelected(null);
          setBubbleOpen(false);
          setAnchor(point);
          revealFeedback();
        }}
        onSelectComment={selectComment}
      />
      <Box
        ref={feedback}
        as="aside"
        aria-label="Screen feedback"
        w={{ base: "full", xl: "80", "2xl": "96" }}
        flexShrink="0"
        bg="gray.50"
        borderLeftWidth={{ base: "0", xl: "1px" }}
        borderTopWidth={{ base: "1px", xl: "0" }}
        borderColor="gray.200"
        p="5"
      >
        {selectedPin && imageReady ? (
          <Stack gap="4">
            <Heading as="h2" size="md">
              Screen feedback
            </Heading>
            <Text color="gray.600">
              This discussion opens beside its pin on the screen. Read and reply
              there without losing the location.
            </Text>
            <Button variant="outline" onClick={() => revealComment(selected)}>
              Open pinned discussion
            </Button>
            <Button variant="ghost" onClick={() => selectComment(null)}>
              All screen comments
            </Button>
          </Stack>
        ) : (
          <FeedbackThread
            apiPath={apiPath}
            flowId={flow.id}
            stepId={step?.id}
            route={step?.route ?? flow.route}
            comments={comments}
            canResolve={canResolve}
            onRefresh={onRefresh}
            anchor={anchor}
            onAnchorChange={setAnchor}
            onCancelAnchor={() => setAnchor(null)}
            selectedCommentId={selected}
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
        )}
      </Box>
    </Flex>
  );
}
