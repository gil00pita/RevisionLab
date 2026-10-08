import {
  Button,
  FileUpload,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AtSign, Paperclip } from "lucide-react";
import { CommentPersonaPicker } from "./CommentPersonaPicker.js";
import { CommentDraftDetails } from "./CommentDraftDetails.js";
import type { RefObject } from "react";
import {
  MAX_COMMENT_FILES,
  MAX_COMMENT_FILE_BYTES,
} from "../../../comment-rich.js";
import type { CommentDraft } from "../hooks/useCommentDraft.js";

export function CommentComposerTools({
  draft,
  disabled,
  inputRef,
  onMentionRequested,
}: {
  draft: CommentDraft;
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onMentionRequested: () => void;
}) {
  return (
    <Stack gap="2">
      <HStack gap="1" wrap="wrap" role="group" aria-label="Comment tools">
        <FileUpload.Root
          preventDocumentDrop={false}
          w="auto"
          flexShrink="0"
          acceptedFiles={draft.files.map((record) => record.file)}
          disabled={disabled || !draft.supported}
          maxFiles={MAX_COMMENT_FILES}
          maxFileSize={MAX_COMMENT_FILE_BYTES}
          onFileChange={(event) => draft.setFiles(event.acceptedFiles)}
          onFileReject={() =>
            draft.setError(
              "Attach up to 5 files, 3 MB each and 10 MB combined.",
            )
          }
        >
          <FileUpload.HiddenInput aria-label="Upload comment attachments" />
          <FileUpload.Trigger asChild>
            <IconButton
              type="button"
              aria-label="Attach files"
              title="Attach files or paste from clipboard"
              variant="ghost"
              size="sm"
              minW="11"
              minH="11"
            >
              <Icon boxSize="4">
                <Paperclip />
              </Icon>
            </IconButton>
          </FileUpload.Trigger>
        </FileUpload.Root>
        <CommentPersonaPicker draft={draft} disabled={disabled} />
        <IconButton
          type="button"
          aria-label="Mention a user or persona"
          title="Mention a user or persona"
          variant="ghost"
          size="sm"
          minW="11"
          minH="11"
          disabled={disabled || !draft.supported}
          onClick={() => {
            onMentionRequested();
            const input = inputRef.current;
            const start = input?.selectionStart ?? draft.body.length;
            const end = input?.selectionEnd ?? start;
            const prefix =
              start > 0 && !/\s/.test(draft.body[start - 1]) ? " @" : "@";
            draft.setBody(
              `${draft.body.slice(0, start)}${prefix}${draft.body.slice(end)}`,
            );
            requestAnimationFrame(() => {
              input?.focus();
              input?.setSelectionRange(
                start + prefix.length,
                start + prefix.length,
              );
            });
          }}
        >
          <Icon boxSize="4">
            <AtSign />
          </Icon>
        </IconButton>
        <Text fontSize="xs" color="fg.muted">
          Attach, paste, or @mention
        </Text>
      </HStack>
      <CommentDraftDetails draft={draft} disabled={disabled} />
      {draft.error && (
        <Text role="alert" fontSize="sm" color="red.fg">
          {draft.error}
        </Text>
      )}
      {draft.optionsError && (
        <HStack gap="2" wrap="wrap">
          <Text fontSize="xs" color="fg.muted">
            {draft.optionsError}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            type="button"
            onClick={draft.retryOptions}
            disabled={disabled}
          >
            Retry
          </Button>
        </HStack>
      )}
    </Stack>
  );
}
