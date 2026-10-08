import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Paperclip, X } from "lucide-react";
import type { CommentDraft } from "../hooks/useCommentDraft.js";

export function CommentDraftDetails({
  draft,
  disabled,
}: {
  draft: CommentDraft;
  disabled: boolean;
}) {
  return (
    <Stack gap="2">
      {draft.personas.length > 0 && (
        <Flex gap="1" wrap="wrap" role="group" aria-label="Linked personas">
          {draft.personas.map((persona) => (
            <HStack
              key={persona.id}
              gap="0"
              bg="purple.subtle"
              borderRadius="md"
              ps="2"
              maxW="full"
            >
              <Text fontSize="xs" color="purple.fg" overflowWrap="anywhere">
                {persona.name}
              </Text>
              <IconButton
                type="button"
                aria-label={`Unlink persona ${persona.name}`}
                variant="ghost"
                size="xs"
                minW="11"
                minH="11"
                disabled={disabled}
                onClick={() =>
                  draft.setPersonas((existing) =>
                    existing.filter((selected) => selected.id !== persona.id),
                  )
                }
              >
                <Icon boxSize="3">
                  <X />
                </Icon>
              </IconButton>
            </HStack>
          ))}
        </Flex>
      )}
      {draft.files.length > 0 && (
        <Stack gap="2" role="group" aria-label="Comment attachments">
          {draft.files.map((record, index) => (
            <HStack
              key={`${record.file.name}-${index}`}
              gap="2"
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              p="2"
              minW="0"
            >
              {record.data &&
              /^image\/(png|jpeg|webp)$/.test(record.file.type) ? (
                <Image
                  src={record.data}
                  alt=""
                  boxSize="10"
                  objectFit="cover"
                  borderRadius="sm"
                  flexShrink="0"
                />
              ) : (
                <Icon boxSize="4" color="fg.muted">
                  <Paperclip />
                </Icon>
              )}
              <Box flex="1" minW="0">
                <Text fontSize="sm" overflowWrap="anywhere">
                  {record.file.name}
                </Text>
                <Text
                  fontSize="xs"
                  color={record.error ? "red.fg" : "fg.muted"}
                >
                  {record.error ??
                    (record.data
                      ? `${Math.max(1, Math.round(record.file.size / 1000))} KB`
                      : "Preparing attachment…")}
                </Text>
              </Box>
              <IconButton
                type="button"
                aria-label={`Remove attachment ${record.file.name}`}
                variant="ghost"
                size="sm"
                minW="11"
                minH="11"
                disabled={disabled}
                onClick={() =>
                  draft.setFiles(
                    draft.files
                      .filter((_, fileIndex) => fileIndex !== index)
                      .map((file) => file.file),
                  )
                }
              >
                <Icon boxSize="4">
                  <X />
                </Icon>
              </IconButton>
            </HStack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
