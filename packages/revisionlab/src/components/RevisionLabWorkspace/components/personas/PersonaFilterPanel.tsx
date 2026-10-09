import {
  Button,
  CloseButton,
  Drawer,
  Field,
  Icon,
  Input,
  Portal,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";
import { SlidersHorizontal } from "lucide-react";
import {
  personaConfidenceLevels,
  personaResearchStatuses,
  personaTypes,
} from "../../../../persona-profile.js";
import { personaTemplates } from "../../persona-recommendations.js";
import type { PersonaFilters } from "../../hooks/usePersonaCollection.js";
import { initialPersonaFilters } from "../../hooks/usePersonaCollection.js";
import { PersonaSelectField } from "./PersonaSelectField.js";
import type { RevisionLabPersona } from "../../../../server/types.js";

export function PersonaFilterPanel({
  filters,
  onChange,
  personas,
  sharedFields,
  count,
}: {
  filters: PersonaFilters;
  onChange: (filters: PersonaFilters) => void;
  personas: RevisionLabPersona[];
  sharedFields: { id: string; name: string; type: string }[];
  count: number;
}) {
  function update(key: keyof PersonaFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }
  const numeric = ["number", "rating"].includes(
    sharedFields.find((field) => field.id === filters.field)?.type ?? "",
  );
  const templates = [
    ...personaTemplates.map((template) => ({
      value: template.id,
      label: template.name,
    })),
    ...[
      ...new Set(
        personas
          .map((persona) => persona.templateId)
          .filter(
            (id): id is string =>
              Boolean(id) &&
              !personaTemplates.some((template) => template.id === id),
          ),
      ),
    ].map((id) => ({ value: id, label: `Saved template · ${id.slice(0, 8)}` })),
  ];
  const options = (items: readonly string[], any: string) => [
    { value: "", label: any },
    ...items.map((value) => ({ value, label: value })),
  ];
  return (
    <Drawer.Root placement="end" size="md">
      <Drawer.Trigger asChild>
        <Button
          variant="outline"
          colorPalette="gray"
          minH="11"
          rounded="lg"
          bg="bg.panel"
        >
          <Icon>
            <SlidersHorizontal />
          </Icon>
          Filters{count ? ` (${count})` : ""}
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop
          data-revisionlab-ui
          _motionReduce={{ animation: "none" }}
        />
        <Drawer.Positioner
          data-revisionlab-ui
          color="fg"
          fontFamily="body"
          fontSize="sm"
          lineHeight="1.6"
          colorPalette="blue"
        >
          <Drawer.Content
            bg="bg.panel"
            w="full"
            maxW="md"
            _motionReduce={{ animation: "none" }}
          >
            <Drawer.Header>
              <Drawer.Title>Filter personas</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
                <PersonaSelectField
                  label="Availability"
                  value={filters.availability}
                  options={[
                    { value: "active", label: "Active personas" },
                    { value: "all", label: "All personas" },
                    { value: "archived", label: "Archived personas" },
                  ]}
                  onChange={(value) => update("availability", value)}
                />
                <PersonaSelectField
                  label="Persona type"
                  value={filters.type}
                  options={options(personaTypes, "Any type")}
                  onChange={(value) => update("type", value)}
                />
                <PersonaSelectField
                  label="Research status"
                  value={filters.status}
                  options={options(personaResearchStatuses, "Any status")}
                  onChange={(value) => update("status", value)}
                />
                <PersonaSelectField
                  label="Confidence"
                  value={filters.confidence}
                  options={options(personaConfidenceLevels, "Any confidence")}
                  onChange={(value) => update("confidence", value)}
                />
                <PersonaSelectField
                  label="Template"
                  value={filters.template}
                  options={[
                    { value: "", label: "Any template" },
                    { value: "none", label: "Created without template" },
                    ...templates,
                  ]}
                  onChange={(value) => update("template", value)}
                />
                {(
                  [
                    ["created", "Created since"],
                    ["updated", "Updated since"],
                  ] as const
                ).map(([key, label]) => (
                  <Field.Root key={key} minW="0">
                    <Field.Label>{label}</Field.Label>
                    <Input
                      type="date"
                      value={filters[key]}
                      onChange={(event) => update(key, event.target.value)}
                    />
                  </Field.Root>
                ))}
                {sharedFields.length > 0 && (
                  <Stack gap="3" minW="0">
                    <PersonaSelectField
                      label="Shared field"
                      value={filters.field}
                      options={[
                        { value: "", label: "Any shared field" },
                        ...sharedFields.map((field) => ({
                          value: field.id,
                          label: field.name,
                        })),
                      ]}
                      onChange={(value) => {
                        const field = sharedFields.find(
                          (item) => item.id === value,
                        );
                        onChange({
                          ...filters,
                          field: value,
                          operator:
                            field && ["number", "rating"].includes(field.type)
                              ? "lte"
                              : "contains",
                          value: "",
                        });
                      }}
                    />
                    {filters.field && (
                      <>
                        <PersonaSelectField
                          label="Comparison"
                          value={filters.operator}
                          options={
                            numeric
                              ? [
                                  { value: "lte", label: "At most" },
                                  { value: "gte", label: "At least" },
                                  { value: "equals", label: "Equals" },
                                ]
                              : [
                                  { value: "contains", label: "Contains" },
                                  { value: "equals", label: "Equals" },
                                ]
                          }
                          onChange={(value) => update("operator", value)}
                        />
                        <Field.Root>
                          <Field.Label>Field value</Field.Label>
                          <Input
                            type={numeric ? "number" : "text"}
                            value={filters.value}
                            onChange={(event) =>
                              update("value", event.target.value)
                            }
                          />
                        </Field.Root>
                      </>
                    )}
                  </Stack>
                )}
              </SimpleGrid>
            </Drawer.Body>
            <Drawer.Footer flexWrap="wrap">
              <Button
                variant="ghost"
                onClick={() => onChange(initialPersonaFilters)}
              >
                Reset filters
              </Button>
              <Drawer.CloseTrigger asChild>
                <Button colorPalette="blue">Show results</Button>
              </Drawer.CloseTrigger>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Close filters" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
