import { useEffect, useState } from "react";
import { resolveElementAnchor } from "../../../client/element-anchor.js";
import type { RevisionLabComment } from "../../../server/types.js";

interface CommentTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  ids: string[];
  bounds: { x: number; y: number; width: number; height: number };
}

export function useLiveCommentTargets(comments: RevisionLabComment[]) {
  const [targets, setTargets] = useState<CommentTarget[]>([]);
  useEffect(() => {
    function update() {
      const grouped = new Map<Element, CommentTarget>();
      for (const comment of comments) {
        if (
          !comment.elementAnchor ||
          comment.parentId ||
          comment.status !== "open"
        )
          continue;
        const element = resolveElementAnchor(comment.elementAnchor);
        if (!element) continue;
        const existing = grouped.get(element);
        if (existing) {
          existing.ids.push(comment.id);
          continue;
        }
        const rect = element.getBoundingClientRect();
        if (
          rect.bottom <= 0 ||
          rect.top >= innerHeight ||
          rect.right <= 0 ||
          rect.left >= innerWidth
        )
          continue;
        grouped.set(element, {
          id: comment.id,
          label: comment.elementAnchor.label,
          x: Math.max(8, Math.min(innerWidth - 48, rect.right - 16)),
          y: Math.max(8, Math.min(innerHeight - 48, rect.top - 16)),
          ids: [comment.id],
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        });
      }
      const next = [...grouped.values()];
      setTargets((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    }
    const frame = requestAnimationFrame(update);
    const timer = setInterval(update, 500);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [comments]);
  return targets;
}
