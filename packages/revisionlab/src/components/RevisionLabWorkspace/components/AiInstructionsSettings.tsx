import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Stack,
  Switch,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { type AiInstructionSettings } from "../../../ai-instructions/index.js";
import { useAiInstructions } from "../hooks/useAiInstructions.js";
import { DesignSystemPicker } from "./DesignSystemPicker.js";
import { ManualDesignSystem } from "./ManualDesignSystem.js";
import { DesignSystemResources } from "./DesignSystemResources.js";

export function AiInstructionsSettings({
  apiPath,
  value,
  canEdit,
  onRefresh,
}: {
  apiPath: string;
  value: AiInstructionSettings;
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}) {
  const {
    displayed,
    busy,
    error,
    status,
    dirty,
    instructions,
    needsSelection,
    disabled,
    update,
    save,
    copy,
    discard,
  } = useAiInstructions({ apiPath, value, canEdit, onRefresh });

  return (
    <Box
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Stack gap="5" aria-busy={busy}>
        <Heading as="h3" size="md">
          AI Instructions
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Your product-review prompt, ready to share with an AI agent. New
          projects start with the full review template.
        </Text>
        <Field.Root readOnly={!canEdit}>
          <Field.Label>Base instructions</Field.Label>
          <Textarea
            value={displayed.instructions}
            readOnly={disabled}
            rows={10}
            maxLength={60_000}
            borderColor="gray.500"
            fontSize="sm"
            onChange={(event) => update({ instructions: event.target.value })}
          />
          <Field.HelperText>
            Edit the template for this project. Save changes before leaving
            Settings.
          </Field.HelperText>
        </Field.Root>
        <Field.Root disabled={disabled}>
          <Switch.Root
            checked={displayed.designSystemEnabled}
            disabled={disabled}
            colorPalette="blue"
            onCheckedChange={(event) =>
              update({ designSystemEnabled: event.checked })
            }
          >
            <Switch.HiddenInput />
            <Switch.Control
              borderWidth="1px"
              borderColor="gray.500"
              _checked={{ borderColor: "blue.700" }}
            >
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Add a design system</Switch.Label>
          </Switch.Root>
          <Field.HelperText>
            Append a framework and its resources. Turning this off keeps your
            selection for later.
          </Field.HelperText>
        </Field.Root>
        {displayed.designSystemEnabled && (
          <Stack gap="5">
            <DesignSystemPicker
              value={displayed.designSystemId}
              disabled={disabled}
              onChange={(designSystemId) =>
                update({
                  designSystemId,
                  installSkill: false,
                  configureMcp: false,
                })
              }
            />
            {displayed.designSystemId === "manual" && (
              <ManualDesignSystem
                value={displayed.manual}
                disabled={disabled}
                onChange={(manual) => update({ manual })}
              />
            )}
            <DesignSystemResources
              value={displayed}
              disabled={disabled}
              onChange={update}
            />
            {needsSelection && (
              <Text fontSize="sm" color="fg.muted">
                Choose a design system, or add a manual system with a name.
              </Text>
            )}
          </Stack>
        )}
        <Flex gap="3" wrap="wrap">
          {canEdit && (
            <Button
              type="submit"
              colorPalette="blue"
              loading={busy}
              disabled={!dirty || needsSelection}
            >
              Save AI instructions
            </Button>
          )}
          {canEdit && dirty && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={discard}
            >
              Discard changes
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={needsSelection}
            onClick={() => void copy()}
          >
            Copy AI instructions
          </Button>
        </Flex>
        {error && (
          <Text role="alert" color="red.700">
            {error}
          </Text>
        )}
        <Text role="status" fontSize="sm" color="fg.muted">
          {busy
            ? "Saving AI instructions..."
            : status || (dirty ? "Unsaved changes" : "")}
        </Text>
        <Field.Root readOnly>
          <Field.Label>
            Generated AI instructions{dirty ? " (draft)" : ""}
          </Field.Label>
          <Textarea
            value={instructions}
            readOnly
            rows={8}
            borderColor="gray.500"
            fontSize="sm"
          />
          <Field.HelperText>
            The exact text copied above, including the enabled design-system
            resources.
          </Field.HelperText>
        </Field.Root>
      </Stack>
    </Box>
  );
}
