import { Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";

export interface FeedbackCollectionItem {
  id: string;
  createdAt: string;
  content: ReactNode;
}

export function FeedbackCollection({ items, combined, showEmpty }: {
  items: FeedbackCollectionItem[];
  combined: boolean;
  showEmpty: boolean;
}) {
  if (!items.length) return showEmpty ? (
    <IllustratedEmptyState illustration="messages" size="sm" description="No feedback yet. Start the conversation." />
  ) : null;

  const orderedItems = combined
    ? [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
    : items;
  return (
    <Stack gap="4" aria-label={combined ? "Screen feedback items" : "Comments"}>
      {orderedItems.map((item) => <Stack key={item.id} gap="0">{item.content}</Stack>)}
    </Stack>
  );
}
