import {
  Button,
  Field,
  Flex,
  Icon,
  Input,
  InputGroup,
  RadioGroup,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { LayoutGrid, List, Search } from "lucide-react";
import type { PersonaCollectionState } from "./types.js";
import type { RevisionLabPersona } from "../../../../server/types.js";
import { initialPersonaFilters } from "../../hooks/usePersonaCollection.js";
import { PersonaFilterPanel } from "./PersonaFilterPanel.js";
import { PersonaSelectField } from "./PersonaSelectField.js";
import { personaTemplates } from "../../persona-recommendations.js";

export function PersonaCollectionToolbar({
  collection,
  personas,
  layout = "workspace",
}: {
  collection: PersonaCollectionState;
  personas: RevisionLabPersona[];
  layout?: "workspace" | "wizard";
}) {
  const { filters, setFilters } = collection;
  const labels = {
    type: "Type",
    status: "Research",
    confidence: "Confidence",
    template: "Template",
    created: "Created since",
    updated: "Updated since",
    availability: "Availability",
    field: "Shared field",
    value: "Value",
  };
  const chips = Object.entries(labels).flatMap(([key, label]) => {
    const field = key as keyof typeof labels;
    const value = filters[field];
    if (!value || (field === "availability" && value === "active")) return [];
    const text =
      field === "template"
        ? value === "none"
          ? "No template"
          : (personaTemplates.find((template) => template.id === value)?.name ??
            "Saved template")
        : field === "field"
          ? (collection.sharedFields.find((item) => item.id === value)?.name ??
            "Shared field")
          : value;
    return [{ key: field, label: `${label}: ${text}` }];
  });
  return (
    <Stack gap="3">
      <Flex gap="3" align="center" flexWrap="wrap">
        <Field.Root flex="1" minW={{ base: "full", sm: "56" }}>
          <Field.Label srOnly>Search personas</Field.Label>
          <InputGroup
            startElement={
              <Icon color="fg.muted">
                <Search />
              </Icon>
            }
          >
            <Input
              value={collection.search}
              onChange={(event) => collection.setSearch(event.target.value)}
              placeholder="Search personas"
              bg="bg.panel"
              rounded="lg"
              h="11"
            />
          </InputGroup>
        </Field.Root>
        <PersonaFilterPanel
          filters={filters}
          onChange={setFilters}
          personas={personas}
          sharedFields={collection.sharedFields}
          count={chips.length}
        />
        <PersonaSelectField
          compact
          label="Sort personas"
          value={collection.sort}
          options={[
            { value: "updated", label: "Recently updated" },
            { value: "created", label: "Recently created" },
            { value: "name", label: "Name A–Z" },
          ]}
          onChange={collection.setSort}
        />
        {layout === "workspace" && (
          <RadioGroup.Root
            aria-label="Persona view"
            value={collection.view}
            onValueChange={(event) => {
              if (event.value === "cards" || event.value === "list")
                collection.changeView(event.value);
            }}
            colorPalette="blue"
          >
            <Flex
              gap="1"
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border"
              rounded="lg"
              p="1"
            >
              {[
                { value: "cards", label: "Cards", icon: LayoutGrid },
                { value: "list", label: "List", icon: List },
              ].map((item) => (
                <RadioGroup.Item
                  key={item.value}
                  value={item.value}
                  cursor="pointer"
                  minH="9"
                  px="3"
                  rounded="md"
                  bg={
                    collection.view === item.value ? "blue.subtle" : "bg.panel"
                  }
                  color={
                    collection.view === item.value ? "blue.fg" : "fg.muted"
                  }
                  _focusWithin={{
                    outlineWidth: "2px",
                    outlineStyle: "solid",
                    outlineColor: "blue.focusRing",
                  }}
                >
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemText>
                    <Icon aria-hidden="true">
                      <item.icon />
                    </Icon>
                    <Text as="span" srOnly>
                      {item.label}
                    </Text>
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              ))}
            </Flex>
          </RadioGroup.Root>
        )}
      </Flex>
      {chips.length > 0 && (
        <Flex gap="2" flexWrap="wrap" align="center">
          {chips.map((chip) => (
            <Tag.Root
              key={chip.key}
              size="lg"
              rounded="full"
              maxW="full"
              colorPalette="blue"
            >
              <Tag.Label whiteSpace="normal" overflowWrap="anywhere">
                {chip.label}
              </Tag.Label>
              <Tag.EndElement>
                <Tag.CloseTrigger
                  aria-label={`Remove ${chip.label}`}
                  onClick={() =>
                    setFilters(
                      chip.key === "field"
                        ? {
                            ...filters,
                            field: "",
                            value: "",
                            operator: "contains",
                          }
                        : {
                            ...filters,
                            [chip.key]: initialPersonaFilters[chip.key],
                          },
                    )
                  }
                />
              </Tag.EndElement>
            </Tag.Root>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilters(initialPersonaFilters)}
          >
            Clear filters
          </Button>
        </Flex>
      )}
      {collection.sharedError && (
        <Text role="alert" fontSize="sm" color="red.fg">
          {collection.sharedError}
        </Text>
      )}
      {collection.filtering && (
        <Text role="status" fontSize="sm" color="fg.muted">
          Updating shared-field results…
        </Text>
      )}
    </Stack>
  );
}
