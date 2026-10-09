import { EmptyStateIllustration } from "../../EmptyStateIllustration/index.js";
import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import type { ReactNode, RefObject } from "react";
import {
  Badge,
  Button,
  Flex,
  Heading,
  Icon,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowUpRight, Camera } from "lucide-react";
import type {
  RevisionLabFlow,
  RevisionLabStep,
  RevisionLabComment,
  RevisionLabPoint,
} from "../../../server/types.js";
import { safePrototypeRoute } from "../../../client/recording.js";
import { PinnedScreen, type ScreenDisplayOptions } from "../../PinnedScreen/index.js";

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
  displayOptions,
  onAddComment,
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
  displayOptions: ScreenDisplayOptions;
  onAddComment: () => void;
}) {
  return (
    <Stack gap="0" flex="1" minW="0" bg="bg.subtle">
      <Flex
        as="nav"
        aria-label="Screens in this flow"
        overflowX="auto"
        gap="3"
        p="5"
        borderBottomWidth="1px"
        borderColor="border"
      >
        {flow.steps.map((screen, index) => (
          <Button
            key={screen.id}
            variant="outline"
            flexShrink="0"
            h="auto"
            p="3"
            maxW="72"
            minW="48"
            justifyContent="start"
            textAlign="start"
            bg={screen.id === step?.id ? "blue.subtle" : "bg.panel"}
            borderColor={screen.id === step?.id ? "blue.border" : "border.emphasized"}
            color="fg"
            onClick={() => onSelect(screen.id)}
            aria-pressed={screen.id === step?.id}
          >
            <Badge colorPalette={screen.id === step?.id ? "blue" : "gray"}>
              {index + 1}
            </Badge>
            <Stack gap="1" minW="0">
              <Text truncate fontWeight="medium">{screen.title}</Text>
              <Text truncate fontFamily="mono" fontSize="xs" color="fg.muted" title={screen.route}>
                {screen.route}
              </Text>
            </Stack>
          </Button>
        ))}
        {flow.steps.length === 0 && (
          <Flex gap="2" align="center" color="fg.muted">
            <Icon>
              <Camera />
            </Icon>
            <Text>No screens captured yet.</Text>
          </Flex>
        )}
      </Flex>
      {step ? (
        <Stack gap="4" p={{ base: "4", md: "6" }}>
          {step.screenshot ? (
            <PinnedScreen
              key={step.id}
              step={step}
              displayOptions={displayOptions}
              onAddComment={onAddComment}
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
            <IllustratedEmptyState illustration="images" description={step.captureState === "pending" ? "This page visit is saved. Its image capture is pending." : step.captureState === "unavailable" ? "This page visit and its connections are saved, but its image capture is unavailable." : "This step has no captured image."} />
          )}
          <Flex align="center" gap="3" flexWrap="wrap" fontSize="xs" color="fg.muted">
            <Link
              href={
                flow.workspace && flow.workspace.id !== "local"
                  ? new URL(
                    safePrototypeRoute(step.route, flow.workspace.basePath),
                    flow.workspace.url,
                  ).toString()
                  : safePrototypeRoute(step.route, basePath)
              }
              color="blue.fg"
              fontSize="xs"
              flexShrink="0"
            >
              Open page
              <Icon>
                <ArrowUpRight />
              </Icon>
            </Link>
            {step.screenshot && (
              <Link href={step.screenshot} target="_blank" rel="noopener noreferrer" color="blue.fg" fontSize="xs" flexShrink="0">
                View full-size capture <Icon><ArrowUpRight /></Icon>
              </Link>
            )}
            <Text>
              {step.screenshot ? "Captured" : "Visited"} {new Date(step.createdAt).toLocaleString()} · {flow.persona} · version {flow.version}
            </Text>
          </Flex>
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
          <EmptyStateIllustration variant="images" />
          <Heading as="h2" size="lg">
            Continue your recording
          </Heading>
          <Text color="fg.muted" maxW="sm">
            Open the prototype and use the RevisionLab widget to capture the
            screens in this flow.
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
