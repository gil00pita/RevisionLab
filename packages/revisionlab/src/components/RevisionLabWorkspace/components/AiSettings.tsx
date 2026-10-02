import {
  Button,
  Field,
  Flex,
  Heading,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { AI_INSTRUCTIONS_MAX_LENGTH } from "../../../ai-instructions.js";
import { useAiInstructions } from "../hooks/useAiInstructions.js";

export function AiSettings({
  apiPath,
  canEdit,
}: {
  apiPath: string;
  canEdit: boolean;
}) {
  const state = useAiInstructions(apiPath, canEdit);

  return (
    <Stack gap="4" aria-busy={state.loading || state.saving}>
      <Heading as="h3" size="md">
        AI
      </Heading>
      <Text fontSize="sm" color="gray.600">
        Keep project context and guidance for your AI tools in a local Markdown
        file.
      </Text>
      {state.document && (
        <>
          <Field.Root readOnly={!canEdit || state.saving}>
            <Field.Label>AI instructions</Field.Label>
            <Textarea
              value={state.draft}
              onChange={(event) => state.edit(event.target.value)}
              placeholder="Describe the project, conventions, and how AI should help."
              rows={10}
              maxLength={AI_INSTRUCTIONS_MAX_LENGTH}
              resize="vertical"
              fontFamily="mono"
              fontSize="sm"
              borderColor="gray.500"
              focusRing="inside"
              focusRingColor="blue.600"
            />
            <Field.HelperText color="gray.600">
              Markdown supported. Up to 32,000 characters. Save before leaving
              Settings.
            </Field.HelperText>
          </Field.Root>
          <Stack gap="1">
            <Text fontSize="sm" fontWeight="medium">
              Local file
            </Text>
            <Text
              fontFamily="mono"
              fontSize="sm"
              overflowWrap="anywhere"
              userSelect="text"
            >
              {state.document.filePath}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Saved on the machine running this project. Reference this file in
              your AI tool.
            </Text>
          </Stack>
          {canEdit && (
            <Flex gap="3" flexWrap="wrap">
              <Button
                colorPalette="blue"
                disabled={!state.dirty || state.saving}
                loading={state.saving}
                loadingText="Saving"
                onClick={() => void state.save()}
              >
                Save instructions
              </Button>
              <Button
                variant="outline"
                disabled={!state.dirty || state.saving}
                onClick={() => state.edit(state.document!.instructions)}
              >
                Discard changes
              </Button>
            </Flex>
          )}
        </>
      )}
      {state.error && (
        <Text role="alert" color="red.700">
          {state.error}
        </Text>
      )}
      {!state.document && !state.loading && (
        <Button alignSelf="start" variant="outline" onClick={state.retry}>
          Retry loading instructions
        </Button>
      )}
      <Text role="status" fontSize="sm" color="gray.600" minH="5">
        {state.loading
          ? "Loading AI instructions..."
          : state.saving
            ? "Saving AI instructions..."
            : state.saved
              ? "AI instructions saved."
              : state.dirty
                ? "Unsaved changes."
                : ""}
      </Text>
    </Stack>
  );
}
