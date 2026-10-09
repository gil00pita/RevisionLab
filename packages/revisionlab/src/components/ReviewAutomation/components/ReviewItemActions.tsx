import type { RefObject } from "react";
import { Button, Flex, Menu } from "@chakra-ui/react";
import type { FeedbackTarget } from "../../../review-automation.js";
import { useAutomation } from "../context.js";

export function ReviewItemActions({ target, presentation = "buttons", returnFocusRef }: {
  target: FeedbackTarget;
  presentation?: "buttons" | "menu";
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const context = useAutomation();
  if (!context) return null;
  if (presentation === "menu") return context.canEdit ? (
    <Menu.Item value="fix-screen" onClick={(event) => context.open("fix", target, returnFocusRef?.current ?? event.currentTarget)}>
      <Menu.ItemText>Fix screen with Codex</Menu.ItemText>
    </Menu.Item>
  ) : null;
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
