import {
  Box,
  Field,
  HStack,
  Portal,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { personaAvatarIds } from "../../../persona-avatars.js";
import { PersonaAvatar } from "../PersonaAvatar.js";

const avatarOptions = createListCollection({
  items: [
    { label: "Initials", value: "initials" },
    ...personaAvatarIds.map((avatar) => ({
      label: `Avatar ${avatar.slice(7)}`,
      value: avatar,
    })),
  ],
});

export function PersonaAvatarPicker({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: string | null;
  disabled: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <Field.Root disabled={disabled}>
      <Select.Root
        collection={avatarOptions}
        value={[value ?? "initials"]}
        onValueChange={(event) =>
          onChange(event.value[0] === "initials" ? null : event.value[0])
        }
        disabled={disabled}
        lazyMount
        unmountOnExit
        positioning={{
          strategy: "fixed",
          hideWhenDetached: true,
          sameWidth: true,
        }}
      >
        <Select.HiddenSelect />
        <Select.Label>Persona avatar</Select.Label>
        <Select.Control>
          <Select.Trigger minH="12" py="2">
            <HStack minW="0" gap="3" flex="1">
              <Box aria-hidden="true">
                <PersonaAvatar name={name || "Persona"} avatar={value} />
              </Box>
              <Select.ValueText truncate />
            </HStack>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner
            data-revisionlab-ui
            color="fg"
            colorPalette="blue"
            zIndex="popover"
          >
            <Select.Content
              maxH="64"
              overflowY="auto"
              bg="bg.panel"
              color="fg"
              fontFamily="body"
            >
              {avatarOptions.items.map((option) => (
                <Select.Item item={option} key={option.value}>
                  <HStack minW="0" gap="3">
                    <Box aria-hidden="true">
                      <PersonaAvatar
                        name={name || "Persona"}
                        avatar={
                          option.value === "initials" ? null : option.value
                        }
                      />
                    </Box>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </HStack>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Field.Root>
  );
}
