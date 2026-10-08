import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import type {
  RevisionLabMembership,
  RevisionLabRole,
} from "../../../server/types.js";

export function MembershipList({
  memberships,
  busy,
  onRoleChange,
  onStatusToggle,
}: {
  memberships: RevisionLabMembership[];
  busy: string;
  onRoleChange: (member: RevisionLabMembership, role: RevisionLabRole) => void;
  onStatusToggle: (member: RevisionLabMembership) => void;
}) {
  return (
    <Stack gap="3">
      <Heading as="h3" size="md">
        Workspace members
      </Heading>
      {memberships.length === 0 && (
        <IllustratedEmptyState illustration="documents" size="sm" description="No managed members yet." />
      )}
      {memberships.map((member) => (
        <Flex
          key={member.id}
          as="article"
          gap="3"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          py="3"
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Box flex="1" minW="0">
            <Text fontWeight="medium" overflowWrap="anywhere">
              {member.name ?? member.email}
            </Text>
            <Text color="fg.muted" fontSize="sm" overflowWrap="anywhere">
              {member.email}
            </Text>
          </Box>
          <Badge
            colorPalette={
              member.status === "active"
                ? "green"
                : member.status === "suspended"
                  ? "orange"
                  : "gray"
            }
          >
            {member.status}
          </Badge>
          <NativeSelect.Root
            size="sm"
            w={{ base: "full", md: "40" }}
            disabled={Boolean(busy)}
          >
            <NativeSelect.Field
              aria-label={`Role for ${member.email}`}
              value={member.role}
              onChange={(event) =>
                onRoleChange(member, event.target.value as RevisionLabRole)
              }
            >
              <option value="commenter">Commenter</option>
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Button
            size="sm"
            variant="outline"
            colorPalette={member.status === "active" ? "orange" : "green"}
            loading={busy === member.id}
            onClick={() => onStatusToggle(member)}
          >
            {member.status === "active" ? "Suspend" : "Activate"}
          </Button>
        </Flex>
      ))}
    </Stack>
  );
}
