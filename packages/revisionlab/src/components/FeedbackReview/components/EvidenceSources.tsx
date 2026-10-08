import { EvidenceScreenshot } from "./EvidencePreviewProvider.js";
import { Checkbox, Link, List, Stack, Text } from "@chakra-ui/react";
import type { ReviewEvidence } from "../../../feedback-review.js";
import { evidenceReviewPath } from "../../../feedback-review.js";

export function EvidenceSources({
  evidence,
  basePath,
  selection,
  unavailableFlowIds,
}: {
  evidence: ReviewEvidence[];
  basePath: string;
  unavailableFlowIds?: Set<string>;
  selection?: {
    ids: Set<string>;
    disabled: boolean;
    onCheck: (id: string, checked: boolean) => void;
  };
}) {
  return (
    <List.Root listStyle="none" gap="3">
      {evidence.map((item) => (
        <List.Item key={item.id}>
          <Stack gap="1" fontSize="sm">
            {selection && (
              <Checkbox.Root
                checked={selection.ids.has(item.id)}
                disabled={selection.disabled}
                colorPalette="blue"
                onCheckedChange={(event) =>
                  selection.onCheck(item.id, event.checked === true)
                }
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  borderColor={
                    selection.ids.has(item.id) ? "blue.border" : "fg.muted"
                  }
                >
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>
                  Include this occurrence · {item.screen ?? item.title} ·{" "}
                  {item.flowName ?? item.route}
                </Checkbox.Label>
              </Checkbox.Root>
            )}
            {item.kind !== "test" &&
            item.flowId &&
            unavailableFlowIds?.has(item.flowId) ? (
              <Text color="fg.muted">
                {item.screen ?? item.title} · Source recording removed; saved
                evidence retained.
              </Text>
            ) : (
              <Link
                href={evidenceReviewPath(item, basePath)}
                color="blue.fg"
                overflowWrap="anywhere"
              >
                {item.kind === "test"
                  ? item.title
                  : (item.screen ?? item.route)}
                {item.flowName && ` · ${item.flowName} · v${item.version}`}
              </Link>
            )}
            <Text color="fg.muted" fontSize="xs" overflowWrap="anywhere">
              {item.route} · {new Date(item.capturedAt).toLocaleString()}
            </Text>
            <EvidenceScreenshot item={item} />
            {item.attachments?.map((file) => (
              <Link
                key={file.id}
                href={file.href}
                download={file.name}
                color="blue.fg"
                minH="11"
                overflowWrap="anywhere"
              >
                Attachment: {file.name}
              </Link>
            ))}
            <Text whiteSpace="pre-wrap" overflowWrap="anywhere">
              {item.body}
            </Text>
          </Stack>
        </List.Item>
      ))}
    </List.Root>
  );
}
