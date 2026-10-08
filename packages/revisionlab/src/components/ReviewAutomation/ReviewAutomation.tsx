"use client";

import { useRef, useState, type ReactNode } from "react";
import { CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";
import {
  feedbackContext,
  type FeedbackTarget,
} from "../../review-automation.js";
import type {
  RevisionLabComment,
  RevisionLabFlow,
  RevisionLabStep,
} from "../../server/types.js";
import { AutomationContext } from "./context.js";
import { JiraTicket } from "./components/JiraTicket.js";
import { CodexFix } from "./components/CodexFix.js";

export function ReviewAutomation({
  flow,
  step,
  comments,
  apiPath,
  canEdit,
  children,
}: {
  flow: RevisionLabFlow;
  step?: RevisionLabStep;
  comments: RevisionLabComment[];
  apiPath: string;
  canEdit: boolean;
  children: ReactNode;
}) {
  const [selection, setSelection] = useState<{
    mode: "fix" | "ticket";
    target: FeedbackTarget;
    reviewUrl: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  let context = null;
  try {
    context =
      step && selection
        ? feedbackContext(flow, step, comments, selection.target)
        : null;
  } catch {
    /* Feedback may have been removed by another reviewer. */
  }
  return (
    <AutomationContext.Provider
      value={
        step
          ? {
              canEdit,
              open: (mode, target, element) => {
                trigger.current = element;
                const reviewUrl = new URL(
                  window.location.pathname,
                  window.location.origin,
                );
                reviewUrl.searchParams.set("view", "flows");
                reviewUrl.searchParams.set("flow", flow.id);
                reviewUrl.searchParams.set("screen", step.id);
                setSelection({ mode, target, reviewUrl: reviewUrl.href });
                setOpen(true);
              },
            }
          : null
      }
    >
      {children}
      <Dialog.Root
        open={open}
        onOpenChange={(event) => setOpen(event.open)}
        unmountOnExit={false}
        size="xl"
        scrollBehavior="inside"
        finalFocusEl={() => trigger.current}
      >
        <Portal>
          <Dialog.Backdrop data-revisionlab-ui />
          <Dialog.Positioner data-revisionlab-ui color="fg" colorPalette="blue">
            <Dialog.Content
              mx="3"
              maxW="3xl"
              bg="bg.panel"
              color="fg"
              fontFamily="body"
              colorPalette="blue"
            >
              <Dialog.Header>
                <Dialog.Title>
                  {selection?.mode === "ticket"
                    ? "Jira ticket draft"
                    : "Codex suggested fix"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pb="6">
                {context && selection ? (
                  selection.mode === "ticket" ? (
                    <JiraTicket
                      key={JSON.stringify(selection)}
                      context={context}
                      reviewUrl={selection.reviewUrl}
                    />
                  ) : (
                    <CodexFix
                      key={JSON.stringify(selection)}
                      apiPath={apiPath}
                      context={context}
                      target={selection.target}
                    />
                  )
                ) : (
                  <Text>This screen is no longer available.</Text>
                )}
              </Dialog.Body>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" aria-label="Close review action" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </AutomationContext.Provider>
  );
}
