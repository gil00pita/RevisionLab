import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  GitBranch,
  MessageSquare,
  Users,
  ContactRound,
} from "lucide-react";
import type { RefObject } from "react";
import type { RevisionLabState } from "../../../server/types.js";
import { RevisionLabLogo } from "../../RevisionLabLogo/index.js";

export type WorkspaceView = "flows" | "comments" | "people" | "personas";

export function WorkspaceNavigation({
  data,
  view,
  onViewChange,
  flowsTriggerRef,
}: {
  data: RevisionLabState;
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  flowsTriggerRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Flex
      w="full"
      minH="full"
      flexShrink="0"
      bg="blue.950"
      color="white"
      direction="column"
    >
      <Flex px="6" h="20" gap="3" align="center">
        <RevisionLabLogo decorative />
        <Heading as="h1" size="lg" letterSpacing="0">
          RevisionLab
        </Heading>
      </Flex>
      <Box px="6" pb="6" display={{ base: "none", lg: "block" }}>
        <Text fontWeight="semibold" overflowWrap="anywhere">
          {data.project.name}
        </Text>
        <Text fontSize="xs" color="gray.300" mt="1">
          Prototype review workspace
        </Text>
      </Box>
      <Stack
        as="nav"
        aria-label="Workspace"
        direction={{ base: "row", lg: "column" }}
        gap="1"
        px="3"
        pb="4"
        flexWrap="wrap"
      >
        <NavigationButton
          buttonRef={flowsTriggerRef}
          active={view === "flows"}
          onClick={() => onViewChange("flows")}
        >
          <Icon>
            <GitBranch />
          </Icon>
          Flows
          <Badge
            ml="auto"
            colorPalette="gray"
            bg="whiteAlpha.200"
            color="white"
          >
            {new Set(data.flows.map((flow) => flow.familyId)).size}
          </Badge>
        </NavigationButton>
        <NavigationButton
          active={view === "comments"}
          onClick={() => onViewChange("comments")}
        >
          <Icon>
            <MessageSquare />
          </Icon>
          Comments
          <Badge
            ml="auto"
            colorPalette="gray"
            bg="whiteAlpha.200"
            color="white"
          >
            {
              data.comments.filter(
                (comment) => !comment.parentId && comment.status === "open",
              ).length
            }
          </Badge>
        </NavigationButton>
        <NavigationButton
          active={view === "personas"}
          onClick={() => onViewChange("personas")}
        >
          <Icon>
            <ContactRound />
          </Icon>
          Personas
        </NavigationButton>
        {data.actor.role === "owner" && (
          <NavigationButton
            active={view === "people"}
            onClick={() => onViewChange("people")}
          >
            <Icon>
              <Users />
            </Icon>
            Review access
          </NavigationButton>
        )}
      </Stack>
      <Stack
        gap="4"
        mt="auto"
        p="6"
        borderTopWidth="1px"
        borderColor="whiteAlpha.200"
        display={{ base: "none", lg: "flex" }}
      >
        <Link href="/" color="gray.200" fontSize="sm">
          <Icon>
            <ArrowLeft />
          </Icon>
          Back to prototype
        </Link>
        <Box>
          <Text fontWeight="semibold" fontSize="sm">
            {data.actor.name}
          </Text>
          <Text fontSize="xs" color="gray.300" textTransform="capitalize">
            {data.actor.role}
          </Text>
        </Box>
      </Stack>
    </Flex>
  );
}

function NavigationButton({
  active,
  onClick,
  children,
  buttonRef,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      justifyContent="flex-start"
      bg={active ? "whiteAlpha.200" : "transparent"}
      color="white"
      _hover={{ bg: "whiteAlpha.300" }}
      aria-current={active ? "page" : undefined}
      fontWeight={active ? "semibold" : "normal"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
