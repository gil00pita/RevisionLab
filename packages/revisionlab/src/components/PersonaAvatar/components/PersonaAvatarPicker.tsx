import {
  Accordion,
  Field,
  Grid,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { personaAvatarIds } from "../../../persona-avatars.js";
import { PersonaAvatar } from "../PersonaAvatar.js";

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
    <Stack gap="3">
      <PersonaAvatar name={name || "Persona"} avatar={value} size="lg" />
      <Accordion.Root collapsible lazyMount unmountOnExit defaultValue={[]}>
        <Accordion.Item value="avatars">
          <Accordion.ItemTrigger>
            <Text flex="1">Choose an avatar</Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody px="0">
              <Field.Root disabled={disabled}>
                <RadioGroup.Root
                  aria-label="Persona avatar"
                  w="full"
                  value={value ?? "initials"}
                  disabled={disabled}
                  onValueChange={(event) =>
                    onChange(event.value === "initials" ? null : event.value)
                  }
                >
                  <Grid
                    w="full"
                    templateColumns="repeat(auto-fill, minmax(64px, 1fr))"
                    gap="2"
                    maxH="64"
                    overflowY="auto"
                    p="2"
                  >
                    {["initials", ...personaAvatarIds].map((avatar) => (
                      <RadioGroup.Item
                        key={avatar}
                        value={avatar}
                        flexDirection="column"
                        gap="1"
                        p="2"
                        borderRadius="md"
                        borderWidth="2px"
                        borderColor="border"
                        _checked={{
                          borderColor: "blue.border",
                          bg: "blue.subtle",
                        }}
                        _focusVisible={{
                          outlineWidth: "2px",
                          outlineStyle: "solid",
                          outlineColor: "blue.focusRing",
                        }}
                        cursor="pointer"
                      >
                        <RadioGroup.ItemHiddenInput />
                        <PersonaAvatar
                          name={name || "Persona"}
                          avatar={avatar === "initials" ? null : avatar}
                        />
                        <RadioGroup.ItemText fontSize="xs">
                          {avatar === "initials" ? "Initials" : avatar.slice(7)}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    ))}
                  </Grid>
                </RadioGroup.Root>
              </Field.Root>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
}
