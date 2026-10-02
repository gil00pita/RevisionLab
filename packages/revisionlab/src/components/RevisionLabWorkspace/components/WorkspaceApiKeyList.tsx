import { useState } from "react";
import {
  Badge,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { WorkspaceApiKey } from "../../../workspace-instances.js";
export function WorkspaceApiKeyList({
  keys,
  busy,
  onRevoke,
}: {
  keys: WorkspaceApiKey[];
  busy: boolean;
  onRevoke: (id: string) => Promise<void>;
}) {
  const [revoke, setRevoke] = useState<string | null>(null);
  return (
    <Stack gap="4">
      <Heading as="h3" size="sm">
        Generated keys
      </Heading>
      {keys.length === 0 && <Text color="gray.600">No API keys yet.</Text>}
      {keys.map((key) => (
        <Stack
          key={key.id}
          gap="2"
          borderTopWidth="1px"
          borderColor="border"
          pt="4"
        >
          <Flex gap="3" justify="space-between" align="center" flexWrap="wrap">
            <Text fontWeight="medium" overflowWrap="anywhere">
              {key.name}
            </Text>
            <Badge>{key.revokedAt ? "Revoked" : key.role}</Badge>
          </Flex>
          <Text fontSize="xs" color="gray.600">
            Created {new Date(key.createdAt).toLocaleDateString()}
          </Text>
          {!key.revokedAt &&
            (revoke === key.id ? (
              <HStack flexWrap="wrap">
                <Text fontSize="sm">
                  Disconnect every workspace using this key?
                </Text>
                <Button
                  size="sm"
                  colorPalette="red"
                  disabled={busy}
                  onClick={() =>
                    void onRevoke(key.id).then(() => setRevoke(null))
                  }
                >
                  Confirm revoke
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRevoke(null)}
                >
                  Cancel
                </Button>
              </HStack>
            ) : (
              <Button
                size="sm"
                variant="outline"
                alignSelf="start"
                disabled={busy}
                onClick={() => setRevoke(key.id)}
              >
                Revoke {key.name}
              </Button>
            ))}
        </Stack>
      ))}
    </Stack>
  );
}
