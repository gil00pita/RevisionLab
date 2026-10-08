import { Badge, Button, Flex, Link, Stack, Text } from "@chakra-ui/react";
import type {
  FeedbackContext,
  FeedbackTarget,
} from "../../../review-automation.js";
import { useCodexFix } from "../hooks/useCodexFix.js";
import { ProposedChanges } from "./ProposedChanges.js";

export function CodexFix({
  apiPath,
  context,
  target,
}: {
  apiPath: string;
  context: FeedbackContext;
  target: FeedbackTarget;
}) {
  const { proposal, busy, error, request, cancel } = useCodexFix(
    apiPath,
    context.flowId,
    context.stepId,
    target,
  );
  const changes = proposal?.changes.length ?? 0;
  return (
    <Stack gap="4">
      <Text color="fg.muted" fontSize="sm">
        Run your signed-in local Codex CLI on this screen’s feedback and saved
        workspace AI instructions. Relevant code and feedback are sent through
        your Codex account. Review the proposed changes before applying or
        publishing them.
      </Text>
      <Text fontSize="sm">
        {context.comments.filter((comment) => !comment.parentId).length}{" "}
        comments · {context.issues.length} accessibility rules ·{" "}
        {context.screen} · version {context.version}
      </Text>
      {!proposal && (
        <Button
          colorPalette="blue"
          onClick={() => void request()}
          disabled={Boolean(busy)}
          loading={busy === "generate"}
        >
          Run Codex
        </Button>
      )}
      {busy === "generate" && (
        <>
          <Text role="status">
            Codex is inspecting the local project. This may take a few minutes.
          </Text>
          <Button variant="outline" onClick={cancel}>
            Cancel run
          </Button>
        </>
      )}
      {error && (
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      {proposal && (
        <Button
          alignSelf="start"
          variant="outline"
          disabled={Boolean(busy)}
          onClick={() => void request()}
        >
          Generate another fix
        </Button>
      )}
      {proposal && (
        <>
          <Badge alignSelf="start">{proposal.status}</Badge>
          <Text whiteSpace="pre-wrap">{proposal.summary}</Text>
          {proposal.warnings.map((warning, index) => (
            <Text key={index} fontSize="sm" color="orange.fg">
              {warning}
            </Text>
          ))}
          <ProposedChanges changes={proposal.changes} />
          {!changes && <Text>No source changes were proposed.</Text>}
          <Text fontSize="sm" color="fg.muted">
            Source matching and JavaScript/TypeScript syntax are checked. Run
            your project tests and recheck the live screen after applying.
            Historical comments and accessibility reports remain unchanged.
          </Text>
          <Flex gap="2" flexWrap="wrap">
            {proposal.status === "proposed" && (
              <>
                <Button
                  colorPalette="blue"
                  disabled={!changes || Boolean(busy)}
                  loading={busy === "apply"}
                  onClick={() => void request("apply")}
                >
                  Apply locally
                </Button>
                <Button
                  variant="outline"
                  disabled={Boolean(busy)}
                  onClick={() => void request("discard")}
                >
                  Discard fix
                </Button>
              </>
            )}
            {proposal.status === "applied" && (
              <Button
                variant="outline"
                disabled={Boolean(busy)}
                loading={busy === "undo"}
                onClick={() => void request("undo")}
              >
                Undo local fix
              </Button>
            )}
            {changes > 0 &&
              ["proposed", "applied"].includes(proposal.status) &&
              !proposal.prUrl && (
                <Button
                  variant="outline"
                  disabled={Boolean(busy)}
                  loading={busy === "pr"}
                  onClick={() => void request("pr")}
                >
                  Create draft PR
                </Button>
              )}
            {proposal.prUrl && (
              <Link
                href={proposal.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="blue.fg"
              >
                Open draft PR
              </Link>
            )}
          </Flex>
          {changes > 0 && !proposal.prUrl && (
            <Text fontSize="xs" color="fg.muted">
              Create draft PR publishes only this fix on a separate GitHub
              branch. Requires GitHub CLI sign-in and matching source files on
              the default branch.
            </Text>
          )}
          {busy && busy !== "generate" && (
            <Text role="status">
              {busy === "pr" ? "Creating draft PR..." : "Updating fix..."}
            </Text>
          )}
        </>
      )}
    </Stack>
  );
}
