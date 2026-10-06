import type { EvidenceGroup, ReviewTicket } from "../../feedback-review.js";

export type FeedbackSort =
  "newest" | "oldest" | "priority-high" | "priority-low";
export type FeedbackPriority = ReviewTicket["priority"];
export interface FeedbackTimelineEntry {
  group: EvidenceGroup;
  capturedAt: string | null;
  priority: FeedbackPriority | null;
}
const priorityRank: Record<FeedbackPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

export function sortFeedbackTimeline(
  groups: EvidenceGroup[],
  tickets: ReviewTicket[],
  sort: FeedbackSort,
): FeedbackTimelineEntry[] {
  const priorities = new Map<string, FeedbackPriority>();
  for (const ticket of tickets) {
    if (ticket.status === "fixed") continue;
    for (const item of ticket.evidence) {
      const previous = priorities.get(item.id);
      if (!previous || priorityRank[ticket.priority] < priorityRank[previous])
        priorities.set(item.id, ticket.priority);
    }
  }
  return groups
    .map((group) => {
      let capturedAt: string | null = null;
      let priority: FeedbackPriority | null = null;
      for (const item of group.evidence) {
        if (
          Number.isFinite(Date.parse(item.capturedAt)) &&
          (!capturedAt || Date.parse(item.capturedAt) > Date.parse(capturedAt))
        )
          capturedAt = item.capturedAt;
        const assigned = priorities.get(item.id);
        if (
          assigned &&
          (!priority || priorityRank[assigned] < priorityRank[priority])
        )
          priority = assigned;
      }
      return { group, capturedAt, priority };
    })
    .sort((a, b) => {
      if (sort.startsWith("priority")) {
        if (!a.priority && b.priority) return 1;
        if (a.priority && !b.priority) return -1;
        if (a.priority && b.priority) {
          const difference =
            priorityRank[a.priority] - priorityRank[b.priority];
          if (difference)
            return sort === "priority-low" ? -difference : difference;
        }
      }
      if (!a.capturedAt && b.capturedAt) return 1;
      if (a.capturedAt && !b.capturedAt) return -1;
      const difference =
        Date.parse(b.capturedAt ?? "") - Date.parse(a.capturedAt ?? "");
      return Number.isFinite(difference) && difference
        ? sort === "oldest"
          ? -difference
          : difference
        : a.group.id.localeCompare(b.group.id);
    });
}
