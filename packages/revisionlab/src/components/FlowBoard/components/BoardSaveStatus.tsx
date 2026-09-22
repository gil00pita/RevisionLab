import { Button, Flex, Text } from "@chakra-ui/react";

interface SaveState {
  dirty: boolean;
  saving: boolean;
  reloading: boolean;
  conflict: boolean;
  error: string;
}

export function BoardSaveStatus({
  state,
  screenCount,
  pathCount,
  connecting,
  onRetry,
  onReload,
}: {
  state: SaveState;
  screenCount: number;
  pathCount: number;
  connecting: boolean;
  onRetry: () => Promise<boolean>;
  onReload: () => Promise<unknown>;
}) {
  const status = state.reloading
    ? "Loading saved board…"
    : state.conflict
      ? "Autosave paused — board changed elsewhere"
      : state.error && state.dirty
        ? "Changes not saved"
        : state.saving
          ? "Saving changes…"
          : state.dirty
            ? "Waiting to save…"
            : "All changes saved";

  return (
    <>
      {(state.error || state.conflict) && (
        <Flex px="4" py="3" gap="3" align="center" bg="red.50" flexWrap="wrap">
          <Text role="alert" color="red.700" flex="1" minW="40">
            {state.error ||
              "A newer board is available. Your pending changes have not overwritten it. Load the saved board to continue."}
          </Text>
          {state.conflict ? (
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              disabled={state.saving}
              loading={state.reloading}
              onClick={() => {
                if (
                  window.confirm(
                    "Discard your unsaved changes and load the latest board?",
                  )
                ) {
                  void onReload();
                }
              }}
            >
              Load saved board
            </Button>
          ) : (
            state.dirty && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                loading={state.saving}
                disabled={state.reloading}
                onClick={() => void onRetry()}
              >
                Retry autosave
              </Button>
            )
          )}
        </Flex>
      )}
      <Text
        role="status"
        aria-live="polite"
        px="4"
        py="2"
        fontSize="xs"
        color="gray.600"
      >
        {status}
        {` · ${screenCount} screens · ${pathCount} paths`}
        {connecting
          ? " · Select Connect here on the destination screen, or Cancel on the source."
          : " · Solid arrows: recorded sequence. Dashed arrows: manual paths."}
      </Text>
    </>
  );
}
