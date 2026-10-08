import { useState } from "react";
import { Button, Checkbox, Field, Flex, Input, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { personaFieldTypes, type PersonaField, type PersonaSection } from "../../../persona-profile.js";
import type { PersonaProfileAction } from "./PersonaProfileEditor.js";

export function PersonaFieldDefinitionForm({ field, sectionId, sections, busy, onSave, onCancel, allowShared = true }: {
  field?: PersonaField;
  sectionId: string;
  sections: PersonaSection[];
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
  onCancel: () => void;
  allowShared?: boolean;
}) {
  const [name, setName] = useState(field?.name ?? "");
  const [description, setDescription] = useState(field?.description ?? "");
  const [type, setType] = useState<PersonaField["type"]>(field?.type ?? "short-text");
  const [targetSection, setTargetSection] = useState(field?.sectionId ?? sectionId);
  const [options, setOptions] = useState(field?.options.join(", ") ?? "");
  const [placeholder, setPlaceholder] = useState(field?.placeholder ?? "");
  const [required, setRequired] = useState(field?.required ?? false);
  const [hidden, setHidden] = useState(field?.hidden ?? false);
  const [position, setPosition] = useState(field?.position ?? 100);
  const [defaultValue, setDefaultValue] = useState(field?.validation.defaultValue == null ? "" : String(field.validation.defaultValue));
  const [minimum, setMinimum] = useState(field?.validation.min == null ? "" : String(field.validation.min));
  const [maximum, setMaximum] = useState(field?.validation.max == null ? "" : String(field.validation.max));
  const [maxLength, setMaxLength] = useState(field?.validation.maxLength == null ? "" : String(field.validation.maxLength));
  const [shared, setShared] = useState(field?.personaId === null);
  const [error, setError] = useState("");
  async function submit() {
    if (!name.trim()) { setError("Enter a field name."); return; }
    try {
      const validation = {
        ...(defaultValue ? { defaultValue: type === "number" || type === "rating" ? Number(defaultValue) : type === "boolean" ? defaultValue === "true" : type === "tags" || type === "multi-select" ? defaultValue.split(",").map((item) => item.trim()).filter(Boolean) : defaultValue } : {}),
        ...(minimum ? { min: Number(minimum) } : {}),
        ...(maximum ? { max: Number(maximum) } : {}),
        ...(maxLength ? { maxLength: Number(maxLength) } : {}),
      };
      await onSave({ action: field ? "field.update" : "field.add", id: field?.id, name, description, type, sectionId: targetSection, shared, options: options.split(",").map((item) => item.trim()).filter(Boolean), placeholder, required, hidden, position, validation });
      onCancel();
    } catch { setError("Could not save this field. Review the message above."); }
  }
  return (
    <Stack gap="3" p="4" borderWidth="1px" borderColor="border" rounded="md" bg="bg.subtle">
      <Field.Root required disabled={busy}><Field.Label>Field name<Field.RequiredIndicator /></Field.Label><Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></Field.Root>
      <Field.Root disabled={busy}><Field.Label>Description</Field.Label><Input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="What should this field capture?" /></Field.Root>
      <Flex gap="3" flexWrap="wrap">
        <Field.Root maxW="56" disabled={busy}><Field.Label>Type</Field.Label><NativeSelect.Root><NativeSelect.Field value={type} onChange={(event) => setType(event.target.value as PersonaField["type"])}>{personaFieldTypes.map((item) => <option key={item} value={item}>{item.replaceAll("-", " ")}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
        <Field.Root maxW="56" disabled={busy}><Field.Label>Section</Field.Label><NativeSelect.Root><NativeSelect.Field value={targetSection} onChange={(event) => setTargetSection(event.target.value)}>{sections.filter((item) => !item.hidden).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
      </Flex>
      {(type === "single-select" || type === "multi-select") && <Field.Root disabled={busy}><Field.Label>Options, separated by commas</Field.Label><Input value={options} onChange={(event) => setOptions(event.target.value)} /></Field.Root>}
      <Field.Root disabled={busy}><Field.Label>Placeholder</Field.Label><Input value={placeholder} onChange={(event) => setPlaceholder(event.target.value)} maxLength={200} /></Field.Root>
      {type !== "file" && <Field.Root disabled={busy}><Field.Label>Default value</Field.Label><Input value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} placeholder="Optional starting value" /></Field.Root>}
      {(type === "number" || type === "rating") && <Flex gap="3"><Field.Root maxW="32"><Field.Label>Minimum</Field.Label><Input type="number" value={minimum} onChange={(event) => setMinimum(event.target.value)} /></Field.Root><Field.Root maxW="32"><Field.Label>Maximum</Field.Label><Input type="number" value={maximum} onChange={(event) => setMaximum(event.target.value)} /></Field.Root></Flex>}
      {["short-text", "long-text", "repeatable-text", "url", "relationship"].includes(type) && <Field.Root maxW="40"><Field.Label>Maximum length</Field.Label><Input type="number" min={1} max={5000} value={maxLength} onChange={(event) => setMaxLength(event.target.value)} /></Field.Root>}
      <Field.Root maxW="32" disabled={busy}><Field.Label>Order</Field.Label><Input type="number" min={0} max={10000} value={position} onChange={(event) => setPosition(Number(event.target.value))} /></Field.Root>
      <Flex gap="4" flexWrap="wrap">
        <Checkbox.Root checked={required} onCheckedChange={(event) => setRequired(event.checked === true)}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>Required</Checkbox.Label></Checkbox.Root>
        <Checkbox.Root checked={hidden} onCheckedChange={(event) => setHidden(event.checked === true)}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>Hide field</Checkbox.Label></Checkbox.Root>
        {!field && allowShared && <Checkbox.Root checked={shared} disabled={sections.find((section) => section.id === targetSection)?.personaId != null} onCheckedChange={(event) => setShared(event.checked === true)}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>Reuse across personas</Checkbox.Label></Checkbox.Root>}
      </Flex>
      {error && <Text role="alert" color="red.fg" fontSize="sm">{error}</Text>}
      <Flex gap="2"><Button size="sm" colorPalette="blue" loading={busy} onClick={() => void submit()}>Save field</Button><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button></Flex>
      {field && <Button size="xs" variant="ghost" colorPalette="red" alignSelf="start" onClick={() => void onSave({ action: "field.delete", id: field.id }).then(onCancel).catch(() => setError("Fields with values or history cannot be deleted. Hide this field instead."))}>Delete empty field</Button>}
    </Stack>
  );
}
