import type { RefObject } from "react";
import {
  Box,
  Button,
  Group,
  Icon,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronDown, Plus } from "lucide-react";
import { PersonaAvatar } from "../../PersonaAvatar/index.js";
import {
  personaTemplates,
  type PersonaTemplate,
} from "../persona-recommendations.js";

export function PersonaCreateActions({
  disabled,
  triggerRef,
  onNew,
  onSelectTemplate,
}: {
  disabled: boolean;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  onNew: () => void;
  onSelectTemplate: (template: PersonaTemplate) => void;
}) {
  return (
    <Menu.Root
      positioning={{
        placement: "bottom-end",
        strategy: "fixed",
        hideWhenDetached: true,
      }}
      onSelect={(event) => {
        const template = personaTemplates.find(
          (item) => item.name === event.value,
        );
        if (template) onSelectTemplate(template);
      }}
    >
      <Group attached maxW="full">
        <Button
          ref={triggerRef}
          size="sm"
          minH="11"
          h="auto"
          py="2"
          maxW="full"
          whiteSpace="normal"
          colorPalette="blue"
          variant="outline"
          color="blue.fg"
          borderColor="blue.border"
          _hover={{ bg: "blue.subtle" }}
          focusRing="outside"
          focusRingColor="blue.focusRing"
          disabled={disabled}
          onClick={onNew}
        >
          <Icon aria-hidden="true">
            <Plus />
          </Icon>
          New persona
        </Button>
        <Menu.Trigger asChild>
          <IconButton
            size="sm"
            minH="11"
            colorPalette="blue"
            variant="outline"
            color="blue.fg"
            borderColor="blue.border"
            _hover={{ bg: "blue.subtle" }}
            focusRing="outside"
            focusRingColor="blue.focusRing"
            disabled={disabled}
            aria-label="Add persona from template"
            title="Add persona from template"
          >
            <Icon aria-hidden="true">
              <ChevronDown />
            </Icon>
          </IconButton>
        </Menu.Trigger>
      </Group>
      <Portal>
        <Menu.Positioner
          data-revisionlab-ui
          color="fg"
          colorPalette="blue"
          zIndex="popover"
        >
          <Menu.Content
            aria-label="Persona templates"
            w="96"
            maxW="calc(100vw - 2rem)"
            maxH="80"
            overflowY="auto"
            bg="bg.panel"
            color="fg"
            fontFamily="body"
          >
            {personaTemplates.map((template) => (
              <Menu.Item
                key={template.name}
                value={template.name}
                gap="3"
                alignItems="start"
              >
                <Box aria-hidden="true" flexShrink="0">
                  <PersonaAvatar
                    name={template.name}
                    avatar={template.avatar}
                  />
                </Box>
                <Stack gap="0" minW="0">
                  <Menu.ItemText fontWeight="medium" whiteSpace="normal">
                    {template.name}
                  </Menu.ItemText>
                  <Text color="fg.muted" fontSize="xs" lineClamp={2}>
                    {template.description}
                  </Text>
                </Stack>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
