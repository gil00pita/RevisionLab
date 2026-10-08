import type { ReactNode } from "react";
import {
  Badge,
  Flex,
  HStack,
  Icon,
  Image,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Paperclip, Users } from "lucide-react";
import type { RevisionLabComment } from "../../server/types.js";

export function CommentContent({
  comment,
  apiPath,
  compact = false,
}: {
  comment: RevisionLabComment;
  apiPath: string;
  compact?: boolean;
}) {
  const segments: ReactNode[] = [];
  let position = 0;
  for (const mention of [...(comment.mentions ?? [])].sort(
    (a, b) => a.start - b.start,
  )) {
    if (
      mention.start < position ||
      comment.body.slice(mention.start, mention.end) !== `@${mention.label}`
    )
      continue;
    segments.push(comment.body.slice(position, mention.start));
    segments.push(
      <Text
        key={`${mention.start}-${mention.id}`}
        as="span"
        fontWeight="semibold"
        color={mention.kind === "persona" ? "purple.fg" : "blue.fg"}
        title={mention.kind === "persona" ? "Persona" : "Mentioned user"}
      >
        {comment.body.slice(mention.start, mention.end)}
      </Text>,
    );
    position = mention.end;
  }
  segments.push(comment.body.slice(position));
  return (
    <Stack gap="3" minW="0">
      <Text
        fontSize={compact ? "sm" : "md"}
        lineHeight="tall"
        color="fg"
        whiteSpace="pre-wrap"
        overflowWrap="anywhere"
      >
        {segments}
      </Text>
      {Boolean(comment.personas?.length) && (
        <Flex gap="1" wrap="wrap" role="group" aria-label="Linked personas">
          {comment.personas!.map((persona) => (
            <Badge
              key={persona.id}
              colorPalette="purple"
              whiteSpace="normal"
              overflowWrap="anywhere"
            >
              <Icon boxSize="3">
                <Users />
              </Icon>
              {persona.name}
            </Badge>
          ))}
        </Flex>
      )}
      {Boolean(comment.attachments?.length) && (
        <Stack gap="2" role="group" aria-label="Comment attachments">
          {comment.attachments!.map((file) => {
            const href = `${apiPath}/artifacts/${file.id.split("~").at(-1)}`;
            return (
              <Link
                key={file.id}
                href={href}
                download={file.name}
                color="blue.fg"
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                p="2"
                minH="11"
                display="flex"
                flexWrap="wrap"
                alignItems="center"
                gap="2"
                minW="0"
                overflowWrap="anywhere"
                focusRing="outside"
              >
                {file.contentType.startsWith("image/") ? (
                  <Image
                    src={href}
                    alt=""
                    boxSize={compact ? "10" : "16"}
                    objectFit="cover"
                    borderRadius="sm"
                    flexShrink="0"
                  />
                ) : (
                  <Icon boxSize="4" flexShrink="0">
                    <Paperclip />
                  </Icon>
                )}
                <HStack gap="1" wrap="wrap" minW="0">
                  <Text as="span">{file.name}</Text>
                  <Text as="span" fontSize="xs" color="fg.muted">
                    {Math.max(1, Math.round(file.size / 1000))} KB · Download
                  </Text>
                </HStack>
              </Link>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
