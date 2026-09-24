import { useEffect, useState } from "react";
import { Button, Icon, Portal } from "@chakra-ui/react";
import { MessageSquare } from "lucide-react";
import { resolveElementAnchor } from "../../../client/element-anchor.js";
import type { RevisionLabComment } from "../../../server/types.js";

interface Pin {
  id: string;
  label: string;
  x: number;
  y: number;
  count: number;
}

export function LiveElementPins({
  comments,
  onSelect,
}: {
  comments: RevisionLabComment[];
  onSelect: (id: string) => void;
}) {
  const [pins, setPins] = useState<Pin[]>([]);
  useEffect(() => {
    function update() {
      const groups = new Map<Element, Pin>();
      for (const comment of comments) {
        if (
          !comment.elementAnchor ||
          comment.parentId ||
          comment.status !== "open"
        )
          continue;
        const element = resolveElementAnchor(comment.elementAnchor);
        if (!element) continue;
        const existing = groups.get(element);
        if (existing) {
          existing.count++;
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
        groups.set(element, {
          id: comment.id,
          label: comment.elementAnchor.label,
          count: 1,
          x: Math.max(4, Math.min(innerWidth - 64, rect.right - 16)),
          y: Math.max(4, Math.min(innerHeight - 40, rect.top - 16)),
        });
      }
      const next = [...groups.values()];
      setPins((previous) =>
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
  return (
    <Portal>
      {pins.map((pin) => (
        <Button
          key={pin.id}
          data-revisionlab-ui
          position="fixed"
          left={`${pin.x}px`}
          top={`${pin.y}px`}
          zIndex="docked"
          size="xs"
          minW="8"
          h="8"
          colorPalette="blue"
          borderRadius="full"
          shadow="sm"
          aria-label={`Open element comments: ${pin.label}`}
          title={`Comments: ${pin.label}`}
          onClick={() => onSelect(pin.id)}
        >
          <Icon>
            <MessageSquare />
          </Icon>
          {pin.count}
        </Button>
      ))}
    </Portal>
  );
}
