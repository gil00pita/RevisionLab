import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  List,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { RevisionLabInvitation } from "../../../server/types.js";

interface InvitationListProps {
  invitations: RevisionLabInvitation[];
  revoking: string | null;
  onRevoke: (id: string) => Promise<void>;
}

export function InvitationList({
  invitations,
  revoking,
  onRevoke,
}: InvitationListProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Box borderTopWidth="1px" borderColor="gray.200" pt="6">
      <Heading as="h3" size="md" mb="4">
        Invitations
      </Heading>
      {invitations.length === 0 ? (
        <Text color="gray.600" fontSize="sm">
          No invitations yet. Create one above to bring someone into the review.
        </Text>
      ) : (
        <List.Root listStyleType="none" gap="0">
          {invitations.map((invitation) => {
            const expired = Date.parse(invitation.expiresAt) <= now;
            const status = invitation.revokedAt
              ? "Revoked"
              : expired
                ? "Expired"
                : "Active";
            return (
              <List.Item
                key={invitation.id}
                py="4"
                borderBottomWidth="1px"
                borderColor="gray.200"
              >
                <Flex
                  gap="3"
                  justify="space-between"
                  align="start"
                  flexWrap="wrap"
                >
                  <Stack gap="1" minW="0">
                    <Text fontWeight="medium" overflowWrap="anywhere">
                      {invitation.email ?? "Anyone with the link"}
                    </Text>
                    <HStack gap="2" flexWrap="wrap">
                      <Badge
                        colorPalette={status === "Active" ? "green" : "gray"}
                      >
                        {status}
                      </Badge>
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        textTransform="capitalize"
                      >
                        {invitation.role}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      Expires {new Date(invitation.expiresAt).toLocaleString()}
                    </Text>
                  </Stack>
                  {status === "Active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="red"
                      loading={revoking === invitation.id}
                      disabled={revoking !== null && revoking !== invitation.id}
                      onClick={() => void onRevoke(invitation.id)}
                      aria-label={`Revoke invitation for ${invitation.email ?? "anyone with the link"}`}
                    >
                      Revoke
                    </Button>
                  )}
                </Flex>
              </List.Item>
            );
          })}
        </List.Root>
      )}
    </Box>
  );
}
