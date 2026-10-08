import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Stack, Text } from "@chakra-ui/react";
import type { ReviewEvidence } from "../../../feedback-review.js";
import { EvidenceZoomDialog } from "./EvidenceZoomDialog.js";
import { ScreenshotImage } from "./ScreenshotImage.js";

const PreviewContext = createContext<
  (item: ReviewEvidence, trigger: HTMLElement) => void
>(() => undefined);

export function EvidencePreviewProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ReviewEvidence | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <PreviewContext.Provider
      value={(next, button) => {
        trigger.current = button;
        setItem(next);
      }}
    >
      {children}
      <EvidenceZoomDialog
        item={item}
        onClose={() => setItem(null)}
        returnFocus={() => trigger.current}
      />
    </PreviewContext.Provider>
  );
}

export function EvidenceScreenshot({ item }: { item: ReviewEvidence }) {
  const preview = useContext(PreviewContext);
  return (
    <Stack gap="2" minW="0">
      <ScreenshotImage
        key={item.screenshot ?? item.id}
        item={item}
        thumbnail
        onZoom={(trigger) => preview(item, trigger)}
      />
      {item.anchor ? (
        <Text fontSize="xs" color="fg.muted">
          Comment pin · {Math.round(item.anchor.x * 100)}%,{" "}
          {Math.round(item.anchor.y * 100)}%
        </Text>
      ) : item.target ? (
        <Text fontSize="xs" color="fg.muted" overflowWrap="anywhere">
          Target: {item.target}
        </Text>
      ) : null}
    </Stack>
  );
}
