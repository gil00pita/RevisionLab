import { Box, Button, Flex } from "@chakra-ui/react";
import type {
  RevisionLabComment,
  RevisionLabFlow,
} from "../../../server/types.js";
import {
  boardBounds,
  clickPreviewRect,
  connectionLanes,
  type ClickPreviewRect,
} from "../geometry.js";
import type { useBoardViewport } from "../hooks/useBoardViewport.js";
import type { FlowBoardData } from "../types.js";
import { BoardConnector } from "./BoardConnector.js";
import { BoardConnectionTarget } from "./BoardConnectionTarget.js";
import { BoardScreen } from "./BoardScreen.js";
import { BoardViewportControls } from "./BoardViewportControls.js";

export function BoardCanvas({
  flow,
  board,
  comments,
  camera: {
    viewport,
    zoom,
    minZoom,
    changeZoom,
    fit,
    offset,
    revealFocus,
    startPan,
    pan,
    endPan,
    keyPan,
  },
  editing,
  selectedStepId,
  selectedEdgeId,
  connectionSource,
  onMove,
  onMoveStart,
  onMoveEnd,
  onOpen,
  onConnection,
  onConnect,
  onRemove,
  showCursor,
}: {
  flow: RevisionLabFlow;
  board: FlowBoardData;
  comments: RevisionLabComment[];
  camera: ReturnType<typeof useBoardViewport>;
  editing: boolean;
  selectedStepId?: string;
  selectedEdgeId: string | null;
  connectionSource: string | null;
  onMove: (id: string, x: number, y: number) => void;
  onMoveStart: (id: string) => void;
  onMoveEnd: () => void;
  onOpen: (id: string) => void;
  onConnection: (id: string) => void;
  onConnect: (id: string) => void;
  onRemove: (id: string) => void;
  showCursor: boolean;
}) {
  const bounds = boardBounds(board.nodes, board.edges);
  const lanes = connectionLanes(board.nodes, board.edges);
  const nodes = new Map(board.nodes.map((node) => [node.stepId, node]));
  const names = new Map(flow.steps.map((step) => [step.id, step.title]));
  const steps = new Map(flow.steps.map((step) => [step.id, step]));
  const clickTargets = new Map<string, {
    rect: ClickPreviewRect;
    label: string;
  }>();
  const clickTargetsByStep = new Map<
    string,
    { edgeId: string; rect: ClickPreviewRect; label: string }[]
  >();
  for (const edge of board.edges) {
    if (edge.kind !== "recorded") continue;
    const source = steps.get(edge.sourceStepId);
    if (!source) continue;
    for (const visit of flow.transitions ?? []) {
      if (
        visit.sourceStepId !== edge.sourceStepId ||
        visit.targetStepId !== edge.targetStepId
      )
        continue;
      const rect = clickPreviewRect(source, visit.interaction);
      if (!rect || !visit.interaction) continue;
      const target = {
        edgeId: edge.id,
        rect,
        label: visit.interaction.target.label,
      };
      clickTargets.set(edge.id, target);
      clickTargetsByStep.set(edge.sourceStepId, [
        ...(clickTargetsByStep.get(edge.sourceStepId) ?? []),
        target,
      ]);
      break;
    }
  }
  const screenCounts = new Map<string, number>();
  const edgeCounts = new Map<string, number>();
  for (const comment of comments) {
    if (
      comment.flowId !== flow.id ||
      comment.parentId ||
      comment.status !== "open"
    )
      continue;
    if (comment.stepId)
      screenCounts.set(
        comment.stepId,
        (screenCounts.get(comment.stepId) ?? 0) + 1,
      );
    if (comment.edgeId)
      edgeCounts.set(comment.edgeId, (edgeCounts.get(comment.edgeId) ?? 0) + 1);
  }
  return (
    <Flex position="relative" minW="0" alignSelf="stretch">
      <Box
        ref={viewport}
        role="region"
        aria-label={`Flow whiteboard: ${flow.name}`}
        tabIndex={0}
        overflow="clip"
        onFocusCapture={revealFocus}
        overscrollBehavior="contain"
        w="full"
        flex="1"
        minW="0"
        minH={{ base: "420px", md: "560px" }}
        alignSelf="stretch"
        bg="bg.subtle"
        focusRing="inset"
        borderTopWidth="1px"
        borderColor="border"
      >
        <Box position="relative" w="full" h="full">
          <Button
            aria-label="Pan flow board with arrow keys or drag"
            position="absolute"
            inset="0"
            w="full"
            h="full"
            minW="full"
            minH="full"
            variant="plain"
            borderRadius="0"
            cursor="grab"
            touchAction="none"
            bg="bg.subtle"
            _active={{ cursor: "grabbing" }}
            onPointerDown={startPan}
            onPointerMove={pan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onLostPointerCapture={endPan}
            onKeyDown={keyPan}
          />
          <Box
            position="absolute"
            left="0"
            top="0"
            w={`${bounds.width}px`}
            h={`${bounds.height}px`}
            transform={`translate(${offset.x}px, ${offset.y}px) scale(${zoom})`}
            transformOrigin="top left"
            pointerEvents="none"
          >
            {flow.steps.map((step, index) => {
              const node = nodes.get(step.id);
              return node ? (
                <Box key={step.id} pointerEvents="auto">
                  <BoardScreen
                    step={step}
                    showCursor={showCursor}
                    clickTargets={clickTargetsByStep.get(step.id) ?? []}
                    node={node}
                    number={index + 1}
                    comments={screenCounts.get(step.id) ?? 0}
                    canEdit={editing}
                    selected={selectedStepId === step.id}
                    zoom={zoom}
                    onMove={onMove}
                    onMoveStart={onMoveStart}
                    onMoveEnd={onMoveEnd}
                    onOpen={() => onOpen(step.id)}
                    connectionSource={connectionSource}
                    onConnect={() => onConnect(step.id)}
                    onRemove={() => onRemove(step.id)}
                  />
                </Box>
              ) : null;
            })}
            {board.edges.map((edge) => {
              const source = nodes.get(edge.sourceStepId);
              const target = nodes.get(edge.targetStepId);
              if (!source || !target) return null;
              const clickTarget = clickTargets.get(edge.id);
              return (
                <Box key={edge.id}>
                  <BoardConnector
                    edge={edge}
                    source={source}
                    target={target}
                    click={clickTarget?.rect}
                    lane={lanes.get(edge.id)}
                  />
                  <BoardConnectionTarget
                    lane={lanes.get(edge.id)}
                    edge={edge}
                    source={source}
                    target={target}
                    name={`${names.get(edge.sourceStepId)} to ${names.get(edge.targetStepId)}${clickTarget ? ` via recorded click on ${clickTarget.label}` : ""}`}
                    comments={edgeCounts.get(edge.id) ?? 0}
                    selected={selectedEdgeId === edge.id}
                    onSelect={() => onConnection(edge.id)}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
      <BoardViewportControls
        zoom={zoom}
        minZoom={minZoom}
        onZoom={changeZoom}
        onFit={fit}
      />
    </Flex>
  );
}
