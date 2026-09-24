import { useEffect, useState } from "react";
import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { Eye, EyeOff, MousePointer2 } from "lucide-react";
import { resolveElementAnchor } from "../../../client/element-anchor.js";
import type {
  RevisionLabComment,
  RevisionLabElementAnchor,
} from "../../../server/types.js";
import { FeedbackThread } from "../../FeedbackThread/index.js";
import type { useLiveFeedback } from "../hooks/useLiveFeedback.js";

function ElementTargetStatus({ anchor }: { anchor: RevisionLabElementAnchor }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    const update = () => setAvailable(Boolean(resolveElementAnchor(anchor)));
    const timer = setInterval(update, 500);
    const frame = requestAnimationFrame(update);
    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
    };
  }, [anchor]);
  return available === false ? (
    <Text role="status" fontSize="sm" color="orange.800">
      Annotation target changed or is unavailable. The discussion is preserved.
    </Text>
  ) : null;
}

export function LiveFeedback({
  apiPath,
  route,
  comments,
  canResolve,
  onRefresh,
  live,
  onPick,
}: {
  apiPath: string;
  route: string;
  comments: RevisionLabComment[];
  canResolve: boolean;
  onRefresh: () => Promise<void>;
  live: ReturnType<typeof useLiveFeedback>;
  onPick: () => void;
}) {
  const selected = comments.find((comment) => comment.id === live.selected);
  return (
    <Stack gap="4">
      <Flex gap="2" flexWrap="wrap">
        <Button size="sm" variant="outline" onClick={onPick}>
          <Icon>
            <MousePointer2 />
          </Icon>
          Comment on an element
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={live.showPins}
          onClick={() => live.setShowPins(!live.showPins)}
        >
          <Icon>{live.showPins ? <EyeOff /> : <Eye />}</Icon>
          {live.showPins ? "Hide pins" : "Show pins"}
        </Button>
      </Flex>
      {selected?.elementAnchor && (
        <ElementTargetStatus anchor={selected.elementAnchor} />
      )}
      <FeedbackThread
        apiPath={apiPath}
        route={route}
        comments={comments}
        canResolve={canResolve}
        onRefresh={onRefresh}
        elementAnchor={live.anchor}
        selectedCommentId={live.selected}
        onSelectComment={(id) => {
          live.setSelected(id);
          live.setAnchor(null);
        }}
        onCancelAnchor={() => live.setAnchor(null)}
        onCommentCreated={(id) => {
          live.setAnchor(null);
          live.setSelected(id);
        }}
      />
    </Stack>
  );
}
