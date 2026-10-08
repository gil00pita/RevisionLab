"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Icon,
  IconButton,
  Link,
  Popover,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Bell } from "lucide-react";
import { apiRequest } from "../../client/api.js";
import type { CommentNotification } from "../../comment-rich.js";

export function CommentNotifications({
  apiPath,
  basePath,
}: {
  apiPath: string;
  basePath: string;
}) {
  const [items, setItems] = useState<CommentNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (signal?.aborted) return;
      try {
        const inbox = await apiRequest<CommentNotification[]>(
          apiPath,
          "comments/notifications",
          { signal },
        );
        if (!signal?.aborted) {
          setItems(inbox);
          setError(null);
        }
      } catch {
        if (!signal?.aborted)
          setError("Could not load your mentions. Try again.");
      }
    },
    [apiPath],
  );
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      void refresh(controller.signal);
    });
    const interval = setInterval(() => {
      if (document.visibilityState === "visible")
        void refresh(controller.signal);
    }, 15_000);
    const onFocus = () => {
      void refresh(controller.signal);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  const unread = items.filter((item) => !item.readAt).length;
  async function markRead(id: string) {
    if (busy) return;
    setBusy(id);
    try {
      await apiRequest(apiPath, `comments/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      });
      await refresh();
    } catch {
      setError("Could not mark this mention as read. Try again.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <Popover.Root
      onOpenChange={(event) => {
        if (event.open) void refresh();
      }}
      positioning={{ placement: "top-start", fitViewport: true }}
    >
      <Popover.Trigger asChild>
        <IconButton
          aria-label={`Mention notifications${unread ? `, ${unread} unread` : ""}`}
          title="Mention notifications"
          variant="ghost"
          size="sm"
          minW="11"
          minH="11"
          alignSelf="start"
        >
          <Icon boxSize="4">
            <Bell />
          </Icon>
          {unread > 0 && (
            <Badge colorPalette="blue" size="xs">
              {unread}
            </Badge>
          )}
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner
          data-revisionlab-ui
          color="fg"
          colorPalette="blue"
          zIndex="popover"
        >
          <Popover.Content
            bg="bg.panel"
            color="fg"
            w="sm"
            maxW="calc(100vw - 2rem)"
          >
            <Popover.Header>
              <Popover.Title>Your mentions</Popover.Title>
            </Popover.Header>
            <Popover.Body>
              <Stack gap="3" maxH="60dvh" overflowY="auto">
                {error && (
                  <Stack gap="1">
                    <Text role="alert" color="red.fg" fontSize="sm">
                      {error}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void refresh()}
                    >
                      Try again
                    </Button>
                  </Stack>
                )}
                {!items.length && !error && (
                  <Text color="fg.muted" fontSize="sm">
                    Mentions in comments will appear here.
                  </Text>
                )}
                {items.map((item) => (
                  <Stack
                    key={item.id}
                    gap="1"
                    borderBottomWidth="1px"
                    borderColor="border"
                    pb="3"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight={item.readAt ? "normal" : "semibold"}
                      overflowWrap="anywhere"
                    >
                      {item.authorName} mentioned you
                      {!item.readAt && " · Unread"}
                    </Text>
                    <Text fontSize="sm" lineClamp={3} overflowWrap="anywhere">
                      {item.body}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                    <Link
                      color="blue.fg"
                      minH="11"
                      href={`${basePath}?${new URLSearchParams({ view: "comments", workspace: "local", comment: item.commentId })}`}
                    >
                      Open comment
                    </Link>
                    {!item.readAt && (
                      <Button
                        size="sm"
                        minH="11"
                        alignSelf="start"
                        variant="ghost"
                        disabled={Boolean(busy)}
                        loading={busy === item.id}
                        onClick={() => void markRead(item.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </Stack>
                ))}
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
