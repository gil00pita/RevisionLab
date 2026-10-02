import {
  Box,
  Field,
  Flex,
  Heading,
  RadioGroup,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import {
  commentBubbleTokens,
  type RevisionLabSettings,
} from "../../comment-settings.js";
import { BubbleColorPicker } from "./components/BubbleColorPicker.js";

export function AppearanceSettings({
  section,
  value,
  disabled = false,
  onChange,
}: {
  section: "widget" | "comments" | "accessibility";
  value: RevisionLabSettings;
  disabled?: boolean;
  onChange: (patch: Partial<RevisionLabSettings>) => void;
}) {
  const toggle = (
    key:
      | "showWidget"
      | "showCommentBubbles"
      | "auditLivePages"
      | "auditRecordings",
    label: string,
  ) => (
    <Field.Root disabled={disabled}>
      <Switch.Root
        checked={value[key]}
        disabled={disabled}
        onCheckedChange={(event) => onChange({ [key]: event.checked })}
        colorPalette="blue"
      >
        <Switch.HiddenInput />
        <Switch.Control
          borderWidth="1px"
          borderColor="gray.500"
          _checked={{ borderColor: "blue.700" }}
        >
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label>{label}</Switch.Label>
      </Switch.Root>
    </Field.Root>
  );
  return (
    <Stack gap="6">
      {section === "widget" && (
        <>
          <BubbleColorPicker
            label="Widget color"
            value={value.widgetColor}
            disabled={disabled}
            readOnly={false}
            onChange={(widgetColor) => onChange({ widgetColor })}
          />
          <Field.Root disabled={disabled}>
            <Field.Label>Widget position</Field.Label>
            <RadioGroup.Root
              value={value.widgetPosition}
              disabled={disabled}
              aria-label="Widget position"
              onValueChange={({ value: position }) => {
                if (position === "bottom-right" || position === "bottom-left")
                  onChange({ widgetPosition: position });
              }}
            >
              <Flex gap="4" wrap="wrap">
                {(["bottom-right", "bottom-left"] as const).map((position) => (
                  <RadioGroup.Item key={position} value={position}>
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText textTransform="capitalize">
                      {position.replace("-", " ")}
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                ))}
              </Flex>
            </RadioGroup.Root>
          </Field.Root>
          {toggle("showWidget", "Show the RevisionLab widget")}
          <Text color="gray.600" fontSize="sm">
            You can always open the workspace directly to change these settings.
          </Text>
          <Box
            position="relative"
            h="40"
            bg="gray.50"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            aria-label="Widget preview"
          >
            <Text p="4" color="gray.600" fontSize="sm">
              Prototype preview
            </Text>
            {value.showWidget && (
              <Box
                position="absolute"
                px="4"
                py="2"
                borderRadius="full"
                bottom="4"
                left={value.widgetPosition.endsWith("left") ? "4" : undefined}
                right={value.widgetPosition.endsWith("right") ? "4" : undefined}
                bg={commentBubbleTokens(value.widgetColor).solid}
                color={commentBubbleTokens(value.widgetColor).contrast}
              >
                RevisionLab
              </Box>
            )}
          </Box>
        </>
      )}
      {section === "comments" && (
        <>
          {toggle("showCommentBubbles", "Show live comments on the prototype")}
          <BubbleColorPicker
            label="Comment color"
            value={value.commentBubbleColor}
            disabled={disabled}
            readOnly={false}
            onChange={(commentBubbleColor) => onChange({ commentBubbleColor })}
          />
          <Box
            alignSelf="start"
            px="4"
            py="3"
            borderRadius="lg"
            bg={commentBubbleTokens(value.commentBubbleColor).solid}
            color={commentBubbleTokens(value.commentBubbleColor).contrast}
          >
            This is how your live comments will look.
          </Box>
        </>
      )}
      {section === "accessibility" && (
        <>
          <Heading as="h3" size="md">
            Automated accessibility checks
          </Heading>
          {toggle("auditLivePages", "Audit live prototype pages")}
          {toggle("auditRecordings", "Audit recorded screens")}
          <Text color="gray.600">
            Run the existing WCAG A/AA checks on live pages and new recordings.
            Automated checks support manual review; they do not certify
            compliance. Saved reports stay unchanged.
          </Text>
        </>
      )}
    </Stack>
  );
}
