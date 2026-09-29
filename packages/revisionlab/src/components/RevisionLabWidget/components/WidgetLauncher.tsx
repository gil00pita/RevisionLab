import {
  Badge,
  Box,
  Flex,
  Icon,
  IconButton,
  Image,
  Link,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { Camera, MessageSquarePlus, Square } from "lucide-react";
import type { PageAccessibility } from "../hooks/usePageAccessibility.js";
import { AccessibilityControl } from "./AccessibilityControl.js";
import { ToolHint } from "./ToolHint.js";

const markUrl = new URL("../../../../assets/widget-mark.svg", import.meta.url)
  .href;

export function WidgetLauncher({
  recording,
  canRecord,
  commenting,
  commentCount,
  busy,
  accessibility,
  onRerun,
  workspaceHref,
  onRecord,
  onComment,
  authorized,
}: {
  recording: boolean;
  canRecord: boolean;
  commenting: boolean;
  commentCount: number;
  busy: boolean;
  accessibility: PageAccessibility;
  authorized: boolean;
  onRerun: () => void;
  workspaceHref: string;
  onRecord: () => void;
  onComment: () => void;
}) {
  const recordLabel = recording ? "Stop recording" : "Record prototype";
  const commentLabel = commenting ? "Stop commenting" : "Comment on an element";
  return (
    <Flex
      data-revisionlab-ui
      role="group"
      aria-label="RevisionLab toolbar"
      position="fixed"
      bottom={{ base: "4", md: "6" }}
      right={{ base: "3", md: "6" }}
      zIndex="popover"
      align="center"
      bg="blue.600"
      color="white"
      borderRadius="full"
      shadow="lg"
      maxW="calc(100vw - 1.5rem)"
    >
      <ToolHint label="Open RevisionLab workspace">
        <Link
          asChild
          aria-label="Open RevisionLab workspace"
          variant="plain"
          display="inline-flex"
          alignItems="center"
          flexShrink="0"
          color="white"
          h="14"
          gap="2"
          px={{ base: "3", md: "5" }}
          borderRadius="0"
          borderLeftRadius="full"
          _hover={{ bg: "blackAlpha.200", textDecoration: "none" }}
          focusRing="inset"
        >
          <NextLink href={workspaceHref} prefetch={false}>
            <Image src={markUrl} alt="" w="18px" h="20px" flexShrink="0" />
            <Text
              fontSize={{ base: "md", md: "xl" }}
              fontWeight="semibold"
              letterSpacing="0"
            >
              RevisionLab
            </Text>
          </NextLink>
        </Link>
      </ToolHint>
      <Box borderLeftWidth="1px" borderColor="whiteAlpha.400">
        <AccessibilityControl
          result={accessibility}
          onRerun={onRerun}
          disabled={!authorized}
        />
      </Box>
      {canRecord && (
        <Box borderLeftWidth="1px" borderColor="whiteAlpha.400">
          <ToolHint label={recordLabel}>
            <IconButton
              aria-label={recordLabel}
              aria-pressed={recording}
              onClick={onRecord}
              disabled={busy}
              variant="plain"
              color="white"
              bg={recording ? "red.700" : "transparent"}
              h="14"
              w={{ base: "12", md: "14" }}
              borderRadius="0"
              _hover={{ bg: recording ? "red.800" : "blackAlpha.200" }}
              focusRing="inset"
            >
              <Icon boxSize="7">{recording ? <Square /> : <Camera />}</Icon>
            </IconButton>
          </ToolHint>
        </Box>
      )}
      <Box
        borderLeftWidth="1px"
        borderColor="whiteAlpha.400"
        position="relative"
      >
        <ToolHint label={commentLabel}>
          <IconButton
            aria-label={commentLabel}
            aria-pressed={commenting}
            onClick={onComment}
            disabled={!authorized}
            variant="plain"
            color="white"
            bg={commenting ? "blue.800" : "transparent"}
            h="14"
            w={{ base: "12", md: "14" }}
            borderRadius="0"
            borderRightRadius="full"
            _hover={{ bg: "blackAlpha.200" }}
            focusRing="inset"
          >
            <Icon boxSize="7">
              {commenting ? <Square /> : <MessageSquarePlus />}
            </Icon>
          </IconButton>
        </ToolHint>
        {commentCount > 0 && (
          <Badge
            position="absolute"
            top="1"
            right="1"
            pointerEvents="none"
            borderRadius="full"
            bg="white"
            color="blue.800"
            minW="4"
            justifyContent="center"
            fontSize="10px"
            aria-label={`${commentCount} open page comments`}
          >
            {commentCount > 99 ? "99+" : commentCount}
          </Badge>
        )}
      </Box>
    </Flex>
  );
}
