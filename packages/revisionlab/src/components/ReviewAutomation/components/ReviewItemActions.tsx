import { Button, Flex } from "@chakra-ui/react";
import type { FeedbackTarget } from "../../../review-automation.js";
import { useAutomation } from "../context.js";

export function ReviewItemActions({ target }: { target: FeedbackTarget }) {
  const context = useAutomation();
  if (!context) return null;
  return (
    <Flex gap="2" flexWrap="wrap">
      {context.canEdit && (
        <Button
          size="xs"
          variant="outline"
          onClick={(event) => context.open("fix", target, event.currentTarget)}
        >
          Fix with Codex
        </Button>
      )}
      {target.kind !== "screen" && (
        <Button
          size="xs"
          variant="ghost"
          onClick={(event) =>
            context.open("ticket", target, event.currentTarget)
          }
        >
          Generate Jira ticket
        </Button>
      )}
    </Flex>
  );
}
