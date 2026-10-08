import {
  Field,
  Flex,
  Icon,
  Link,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ExternalLink, Star } from "lucide-react";
import { designSystems } from "../../../ai-instructions/index.js";

export function DesignSystemPicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field.Root disabled={disabled}>
      <Field.Label>Design system</Field.Label>
      <RadioGroup.Root
        aria-label="Design system"
        value={value}
        disabled={disabled}
        onValueChange={(event) => onChange(event.value ?? "")}
        colorPalette="blue"
        w="full"
      >
        <Stack
          gap="0"
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
        >
          {designSystems.map((system) => (
            <Flex
              key={system.id}
              align="center"
              gap="2"
              px="3"
              py="2"
              bg={value === system.id ? "blue.subtle" : "bg"}
            >
              <RadioGroup.Item
                value={system.id}
                flex="1"
                minW="0"
                cursor="pointer"
              >
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator
                  borderColor="fg.muted"
                  _checked={{ borderColor: "blue.border" }}
                />
                <RadioGroup.ItemText fontSize="sm">
                  {system.name}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
              <Text
                fontSize="xs"
                color="fg.muted"
                whiteSpace="nowrap"
                title={
                  system.starsCheckedAt
                    ? `GitHub stars checked ${system.starsCheckedAt}`
                    : "GitHub star count unavailable"
                }
              >
                <Icon boxSize="3" mr="1" aria-hidden="true">
                  <Star />
                </Icon>
                {system.stars === null
                  ? "Unavailable"
                  : `${system.stars.toLocaleString("en-GB")} stars`}
              </Text>
              <Link
                href={system.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                p="2"
                color="blue.fg"
                aria-label={`Open ${system.name} documentation (new tab)`}
                focusRing="outside"
              >
                <Icon boxSize="4">
                  <ExternalLink />
                </Icon>
              </Link>
            </Flex>
          ))}
          <RadioGroup.Item
            value="manual"
            px="3"
            py="3"
            cursor="pointer"
            bg={value === "manual" ? "blue.subtle" : "bg"}
          >
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemIndicator
              borderColor="fg.muted"
              _checked={{ borderColor: "blue.border" }}
            />
            <RadioGroup.ItemText fontSize="sm">
              Add a manual design system
            </RadioGroup.ItemText>
          </RadioGroup.Item>
        </Stack>
      </RadioGroup.Root>
      <Field.HelperText>
        GitHub stars are a bundled snapshot ({designSystems[0]?.starsCheckedAt}
        ), not live counts.
      </Field.HelperText>
    </Field.Root>
  );
}
