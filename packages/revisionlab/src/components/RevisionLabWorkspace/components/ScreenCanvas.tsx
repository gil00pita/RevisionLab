import type { ReactNode, RefObject } from "react";
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
import { ArrowUpRight, Camera, ImageOff } from "lucide-react";
import type {
  RevisionLabFlow,
  RevisionLabStep,
  RevisionLabComment,
  RevisionLabPoint,
} from "../../../server/types.js";
import { safePrototypeRoute } from "../../../client/recording.js";
import { PinnedScreen } from "../../PinnedScreen/index.js";

export function ScreenCanvas({
  flow,
  step,
  onSelect,
  basePath,
  comments,
  anchor,
  selectedCommentId,
  bubbleOpen,
  onBubbleOpenChange,
  discussion,
  pinElements,
  onImageReadyChange,
  onPlace,
  onSelectComment,
}: {
  flow: RevisionLabFlow;
  step?: RevisionLabStep;
  onSelect: (id: string) => void;
  basePath: string;
  comments: RevisionLabComment[];
  anchor: RevisionLabPoint | null;
  selectedCommentId: string | null;
  bubbleOpen: boolean;
  onBubbleOpenChange: (open: boolean) => void;
  discussion: ReactNode;
  pinElements: RefObject<Map<string, HTMLButtonElement>>;
  onImageReadyChange: (ready: boolean) => void;
  onPlace: (point: RevisionLabPoint) => void;
  onSelectComment: (id: string) => void;
}) {
  return (
    <Stack gap="0" flex="1" minW="0" bg="gray.50">
      <Flex
        as="nav"
        aria-label="Screens in this flow"
        overflowX="auto"
        gap="3"
        p="5"
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        {flow.steps.map((screen, index) => (
          <Button
            key={screen.id}
            variant="outline"
            flexShrink="0"
            h="auto"
            p="3"
            maxW="60"
            bg={screen.id === step?.id ? "blue.50" : "white"}
            borderColor={screen.id === step?.id ? "blue.600" : "gray.300"}
            color="gray.900"
            onClick={() => onSelect(screen.id)}
            aria-pressed={screen.id === step?.id}
          >
            <Badge colorPalette={screen.id === step?.id ? "blue" : "gray"}>
              {index + 1}
            </Badge>
            <Text truncate>{screen.title}</Text>
          </Button>
        ))}
        {flow.steps.length === 0 && (
          <Flex gap="2" align="center" color="gray.600">
            <Icon>
              <Camera />
            </Icon>
            <Text>No screens captured yet.</Text>
          </Flex>
        )}
      </Flex>
      {step ? (
        <Stack gap="4" p={{ base: "4", md: "6" }}>
          <Flex justify="space-between" align="start" gap="4" flexWrap="wrap">
            <Box minW="0">
              <Heading as="h2" size="lg" overflowWrap="anywhere">
                {step.title}
              </Heading>
              <Text
                color="gray.600"
                fontFamily="mono"
                fontSize="xs"
                mt="2"
                overflowWrap="anywhere"
              >
                {step.route}
              </Text>
            </Box>
            <Link
              href={safePrototypeRoute(step.route, basePath)}
              color="blue.700"
              fontSize="sm"
              flexShrink="0"
            >
              Open page
              <Icon>
                <ArrowUpRight />
              </Icon>
            </Link>
          </Flex>
          {step.screenshot ? (
            <PinnedScreen
              key={step.id}
              step={step}
              comments={comments}
              anchor={anchor}
              selectedCommentId={selectedCommentId}
              bubbleOpen={bubbleOpen}
              onBubbleOpenChange={onBubbleOpenChange}
              discussion={discussion}
              pinElements={pinElements}
              onImageReadyChange={onImageReadyChange}
              onPlace={onPlace}
              onSelectComment={onSelectComment}
            />
          ) : (
            <Flex
              minH="64"
              align="center"
              justify="center"
              direction="column"
              gap="3"
              color="gray.600"
            >
              <Icon size="xl">
                <ImageOff />
              </Icon>
              <Text>This step has no captured image.</Text>
            </Flex>
          )}
          {step.screenshot && (
            <Link
              href={step.screenshot}
              target="_blank"
              rel="noopener noreferrer"
              color="blue.700"
              fontSize="sm"
              alignSelf="start"
            >
              View full-size capture
              <Icon>
                <ArrowUpRight />
              </Icon>
            </Link>
          )}
          <Text fontSize="xs" color="gray.600">
            Captured {new Date(step.createdAt).toLocaleString()} ·{" "}
            {flow.persona} · version {flow.version}
          </Text>
        </Stack>
      ) : (
        <Stack
          align="center"
          justify="center"
          minH="80"
          p="8"
          textAlign="center"
          gap="3"
        >
          <Icon size="2xl" color="gray.500">
            <Camera />
          </Icon>
          <Heading as="h2" size="lg">
            Continue your recording
          </Heading>
          <Text color="gray.600" maxW="sm">
            Open the prototype and use the RevisionLab widget to capture the
            screens in this flow.
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
