"use client";

import { useEffect, useState } from "react";
import { Button, Flex, Grid, Stack, Text } from "@chakra-ui/react";
import { boardBounds } from "./geometry.js";
import { useBoardDraft } from "./hooks/useBoardDraft.js";
import { useBoardViewport } from "./hooks/useBoardViewport.js";
import { BoardCanvas } from "./components/BoardCanvas.js";
import { BoardConnectionPanel } from "./components/BoardConnectionPanel.js";
import {
  BoardEditDialog,
  type BoardConfirmation,
} from "./components/BoardEditDialog.js";
import { BoardToolbar } from "./components/BoardToolbar.js";
import { BoardSaveStatus } from "./components/BoardSaveStatus.js";
import type { FlowBoardProps } from "./types.js";

export function FlowBoard(props: FlowBoardProps) {
  const {
    flow,
    comments,
    canEdit,
    navigationPending = false,
    selectedStepId,
    onOpenScreen,
    apiPath,
    onRefresh,
    onBeforeLeaveChange,
  } = props;
  const draft = useBoardDraft(props);
  const bounds = boardBounds(draft.board.nodes);
  const camera = useBoardViewport(bounds.width, bounds.height);
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BoardConfirmation | null>(
    null,
  );
  const selectedEdge = draft.board.edges.find(
    (edge) => edge.id === selectedEdgeId,
  );
  const disabled =
    leaving || navigationPending || draft.conflict || draft.reloading;
  const hiddenScreens = flow.steps.filter((step) =>
    draft.board.hiddenStepIds?.includes(step.id),
  );

  useEffect(() => {
    onBeforeLeaveChange?.(draft.flush);
    return () => onBeforeLeaveChange?.(null);
  }, [onBeforeLeaveChange, draft.flush]);

  function finishEditing() {
    setEditing(false);
    setConnectionSource(null);
    setConfirmation(null);
  }

  async function toggleEditing() {
    if (navigationPending) return;
    if (!editing) {
      setEditing(true);
      return;
    }
    if (leaving) return;
    setLeaving(true);
    try {
      if (await draft.flush()) finishEditing();
    } finally {
      setLeaving(false);
    }
  }

  function connect(stepId: string) {
    if (disabled) return;
    if (!connectionSource) setConnectionSource(stepId);
    else if (connectionSource === stepId) setConnectionSource(null);
    else {
      const id = draft.addEdge(connectionSource, stepId, "");
      if (id) {
        setSelectedEdgeId(id);
        setConnectionSource(null);
      }
    }
  }

  function removeConfirmed() {
    if (disabled || !confirmation) return;
    if (confirmation.kind === "screen") {
      draft.removeScreen(confirmation.id);
      setConnectionSource(null);
    } else if (confirmation.kind === "connection") {
      draft.removeEdge(confirmation.id);
      setSelectedEdgeId(null);
    }
    setConfirmation(null);
  }

  return (
    <Stack
      as="section"
      aria-label="Flow board editor"
      gap="0"
      minW="0"
      flex="1"
    >
      <BoardToolbar
        zoom={camera.zoom}
        minZoom={camera.minZoom}
        canEdit={canEdit}
        canUndo={draft.canUndo}
        leaving={leaving || navigationPending}
        conflict={draft.conflict || draft.reloading}
        editing={editing}
        onZoom={camera.changeZoom}
        onFit={camera.fit}
        onArrange={draft.arrange}
        onUndo={() => {
          draft.undo();
          setConnectionSource(null);
        }}
        onConnections={() => void toggleEditing()}
      />
      <BoardSaveStatus
        state={draft}
        screenCount={draft.board.nodes.length}
        pathCount={draft.board.edges.length}
        connecting={Boolean(connectionSource)}
        onRetry={draft.retry}
        onReload={draft.discard}
      />
      {editing && hiddenScreens.length > 0 && (
        <Flex
          p="3"
          gap="2"
          flexWrap="wrap"
          align="center"
          bg="gray.50"
          aria-label="Removed screens"
        >
          <Text fontSize="sm">Removed from this board:</Text>
          {hiddenScreens.map((step) => (
            <Button
              key={step.id}
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => draft.restoreScreen(step.id)}
              whiteSpace="normal"
              h="auto"
              minH="9"
              py="2"
            >
              Restore {step.title}
            </Button>
          ))}
        </Flex>
      )}
      {draft.board.nodes.length === 0 && (
        <Text p="6" color="gray.600">
          {flow.steps.length
            ? "All screens are removed from this board. Enter Paths to restore a screen. Captures and comments are still available in Screen & comments."
            : "Record a screen in the prototype to begin this flow."}
        </Text>
      )}
      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          xl: selectedEdge ? "minmax(0, 1fr) 360px" : "minmax(0, 1fr)",
        }}
        alignItems="start"
        minW="0"
      >
        <BoardCanvas
          flow={flow}
          board={draft.board}
          comments={comments}
          camera={camera}
          editing={editing && canEdit && !disabled}
          selectedStepId={selectedStepId}
          selectedEdgeId={selectedEdgeId}
          connectionSource={connectionSource}
          onMove={draft.moveNode}
          onMoveStart={draft.beginMove}
          onMoveEnd={draft.endMove}
          onOpen={onOpenScreen}
          onConnection={setSelectedEdgeId}
          onConnect={connect}
          onRemove={(id) => {
            const step = flow.steps.find((item) => item.id === id)!;
            setConfirmation({
              kind: "screen",
              id,
              title: step.title,
              connections: draft.board.edges.filter(
                (edge) => edge.sourceStepId === id || edge.targetStepId === id,
              ).length,
            });
          }}
        />
        {selectedEdge && (
          <BoardConnectionPanel
            key={selectedEdge.id}
            edge={selectedEdge}
            flow={flow}
            savedBoard={draft.savedBoard}
            comments={comments}
            apiPath={apiPath}
            editing={editing && canEdit}
            canResolve={canEdit}
            disabled={disabled}
            onRefresh={onRefresh}
            onLabel={(label) => draft.labelEdge(selectedEdge.id, label)}
            onClose={() => setSelectedEdgeId(null)}
            onRemove={() =>
              setConfirmation({ kind: "connection", id: selectedEdge.id })
            }
          />
        )}
      </Grid>
      <BoardEditDialog
        action={confirmation}
        disabled={disabled}
        onCancel={() => setConfirmation(null)}
        onRemove={removeConfirmed}
      />
    </Stack>
  );
}
