import { useState } from "react";
import { Accordion, Badge, Box, Button, Checkbox, Field, Flex, Heading, Input, Link, NativeSelect, Stack, Text } from "@chakra-ui/react";
import type { PersonaField, PersonaProfile, PersonaSection, PersonaValue } from "../../../persona-profile.js";
import { PersonaAttributeEditor } from "./PersonaAttributeEditor.js";
import { PersonaFieldDefinitionForm } from "./PersonaFieldDefinitionForm.js";
import type { PersonaProfileAction } from "./PersonaProfileEditor.js";

export function PersonaProfileSections({ profile, apiPath, canEdit, busy, onSave, onUploadFile, allowShared = true }: {
  profile: PersonaProfile;
  apiPath?: string;
  canEdit: boolean;
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
  onUploadFile?: (file: File) => Promise<string>;
  allowShared?: boolean;
}) {
  const [newSection, setNewSection] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [shared, setShared] = useState(false);
  const sections = profile.sections.filter((section) => !section.hidden).sort((a, b) => a.position - b.position);
  const hiddenSections = profile.sections.filter((section) => section.hidden && !section.id.startsWith("standard:"));
  return (
    <Stack as="section" gap="4">
      <Heading as="h3" size="lg">Profile</Heading>
      <Text color="fg.muted">Start with the sections that matter. Suggested attributes remain unvalidated until you check them against research.</Text>
      <Accordion.Root multiple collapsible defaultValue={["standard:basic", "standard:goals"]}>
        {sections.map((section) => <PersonaSectionPanel key={section.id} section={section} sections={sections} profile={profile} apiPath={apiPath} canEdit={canEdit} busy={busy} onSave={onSave} onUploadFile={onUploadFile} allowShared={allowShared} />)}
      </Accordion.Root>
      {canEdit && hiddenSections.length > 0 && <Stack gap="2"><Text fontSize="sm" color="fg.muted">Hidden sections</Text><Flex gap="2" flexWrap="wrap">{hiddenSections.map((section) => <Button key={section.id} size="xs" variant="outline" onClick={() => void onSave({ action: "section.update", id: section.id, name: section.name, position: section.position, hidden: false }).catch(() => undefined)}>Show {section.name}</Button>)}</Flex></Stack>}
      {canEdit && (newSection ? (
        <Stack gap="3" p="4" borderWidth="1px" borderColor="border" rounded="md" maxW="lg">
          <Field.Root required><Field.Label>Section name<Field.RequiredIndicator /></Field.Label><Input value={sectionName} onChange={(event) => setSectionName(event.target.value)} maxLength={120} /></Field.Root>
          <Field.Root><Field.Label>Description</Field.Label><Input value={sectionDescription} onChange={(event) => setSectionDescription(event.target.value)} maxLength={500} /></Field.Root>
          {allowShared && <Checkbox.Root checked={shared} onCheckedChange={(event) => setShared(event.checked === true)}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>Show this section for all personas</Checkbox.Label></Checkbox.Root>}
          <Flex gap="2"><Button size="sm" colorPalette="blue" disabled={!sectionName.trim() || busy} onClick={() => void onSave({ action: "section.add", name: sectionName, description: sectionDescription, shared, position: sections.length + 100 }).then(() => { setSectionName(""); setSectionDescription(""); setNewSection(false); }).catch(() => undefined)}>Save section</Button><Button size="sm" variant="ghost" onClick={() => setNewSection(false)}>Cancel</Button></Flex>
        </Stack>
      ) : <Button alignSelf="start" variant="outline" size="sm" onClick={() => setNewSection(true)}>Add custom section</Button>)}
    </Stack>
  );
}

function PersonaSectionPanel({ section, sections, profile, apiPath, canEdit, busy, onSave, onUploadFile, allowShared }: {
  section: PersonaSection;
  sections: PersonaSection[];
  profile: PersonaProfile;
  apiPath?: string;
  canEdit: boolean;
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
  onUploadFile?: (file: File) => Promise<string>;
  allowShared: boolean;
}) {
  const [selectedField, setSelectedField] = useState("");
  const [addingField, setAddingField] = useState(false);
  const [showUnused, setShowUnused] = useState(false);
  const [editingSection, setEditingSection] = useState(false);
  const [movingFields, setMovingFields] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState("");
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description);
  const customSections = sections.filter((item) => !item.id.startsWith("standard:"));
  const customIndex = customSections.findIndex((item) => item.id === section.id);
  const fields = profile.fields.filter((field) => field.sectionId === section.id && !field.hidden);
  const hiddenFields = profile.fields.filter((field) => field.sectionId === section.id && field.hidden && !field.id.startsWith("standard:"));
  const used = fields.filter((field) => profile.values.some((value) => value.fieldId === field.id));
  const unused = fields.filter((field) => !used.includes(field));
  return (
    <Accordion.Item value={section.id} borderWidth="1px" borderColor="border" rounded="lg" mb="3" bg="bg.panel">
      <Accordion.ItemTrigger px="5" py="4"><Box flex="1" textAlign="start"><Text fontWeight="semibold">{section.name}</Text><Text fontSize="sm" color="fg.muted">{used.length} filled {used.length === 1 ? "field" : "fields"}</Text></Box><Accordion.ItemIndicator /></Accordion.ItemTrigger>
      <Accordion.ItemContent><Accordion.ItemBody px="5" pb="5"><Stack gap="5">
        {section.description && <Text fontSize="sm" color="fg.muted">{section.description}</Text>}
        {!section.id.startsWith("standard:") && canEdit && (editingSection ? <Flex gap="2" flexWrap="wrap"><Input value={name} onChange={(event) => setName(event.target.value)} maxW="64" aria-label="Section name" /><Input value={description} onChange={(event) => setDescription(event.target.value)} maxW="96" aria-label="Section description" /><Button size="sm" onClick={() => void onSave({ action: "section.update", id: section.id, name, description, position: section.position, hidden: false }).then(() => setEditingSection(false)).catch(() => undefined)}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditingSection(false)}>Cancel</Button></Flex> : <Flex gap="2" flexWrap="wrap"><Button size="xs" variant="ghost" onClick={() => setEditingSection(true)}>Rename section</Button><Button size="xs" variant="ghost" disabled={customIndex <= 0} onClick={() => void onSave({ action: "section.move", id: section.id, direction: "up" }).catch(() => undefined)}>Move up</Button><Button size="xs" variant="ghost" disabled={customIndex >= customSections.length - 1} onClick={() => void onSave({ action: "section.move", id: section.id, direction: "down" }).catch(() => undefined)}>Move down</Button><Button size="xs" variant="ghost" onClick={() => void onSave({ action: "section.update", id: section.id, name: section.name, position: section.position, hidden: true }).catch(() => undefined)}>Hide section</Button><Button size="xs" variant="ghost" colorPalette="red" disabled={profile.fields.some((field) => field.sectionId === section.id)} onClick={() => void onSave({ action: "section.delete", id: section.id }).catch(() => undefined)}>Delete empty section</Button></Flex>)}
        {canEdit && !section.id.startsWith("standard:") && profile.fields.some((field) => field.sectionId === section.id) && (movingFields ? <Flex gap="2" align="end" flexWrap="wrap"><Field.Root maxW="64"><Field.Label>Move fields to</Field.Label><NativeSelect.Root><NativeSelect.Field value={targetSectionId} onChange={(event) => setTargetSectionId(event.target.value)}><option value="">Choose a section</option>{sections.filter((item) => item.id !== section.id && (section.personaId !== null || item.personaId === null)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root><Button size="sm" colorPalette="red" disabled={!targetSectionId || busy} onClick={() => void onSave({ action: "section.move-fields", id: section.id, targetSectionId }).then(() => setMovingFields(false)).catch(() => undefined)}>Move fields and delete section</Button><Button size="sm" variant="ghost" onClick={() => setMovingFields(false)}>Cancel</Button></Flex> : <Button size="xs" variant="ghost" alignSelf="start" onClick={() => setMovingFields(true)}>Move fields and delete section</Button>)}
        {used.length === 0 && <Text color="fg.muted" fontSize="sm">No attributes yet. Choose a field below to add one.</Text>}
        {used.map((field) => <PersonaFieldValues key={field.id} field={field} profile={profile} apiPath={apiPath} canEdit={canEdit} busy={busy} onSave={onSave} onUploadFile={onUploadFile} allowShared={allowShared} />)}
        {canEdit && unused.length > 0 && <Stack gap="2" align="start"><Button size="xs" variant="ghost" onClick={() => setShowUnused(!showUnused)}>{showUnused ? "Hide" : "Show"} {unused.length} unused fields</Button>{showUnused && <Flex gap="2" flexWrap="wrap">{unused.map((field) => <Button key={field.id} size="xs" variant="outline" onClick={() => setSelectedField(field.id)}>{field.name}</Button>)}</Flex>}</Stack>}
        {canEdit && hiddenFields.length > 0 && <Flex gap="2" flexWrap="wrap">{hiddenFields.map((field) => <Button key={field.id} size="xs" variant="outline" onClick={() => void onSave({ action: "field.update", id: field.id, name: field.name, type: field.type, sectionId: field.sectionId, shared: false, options: field.options, placeholder: field.placeholder, required: field.required, hidden: false, position: field.position, validation: field.validation }).catch(() => undefined)}>Show {field.name}</Button>)}</Flex>}
        {canEdit && <Flex gap="2" flexWrap="wrap" align="end"><Field.Root maxW="64"><Field.Label>Add an attribute</Field.Label><NativeSelect.Root><NativeSelect.Field value={selectedField} onChange={(event) => setSelectedField(event.target.value)}><option value="">Choose a field</option>{fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root><Button size="sm" variant="outline" disabled={!selectedField} onClick={() => setSelectedField(`add:${selectedField}`)}>Add value</Button></Flex>}
        {selectedField.startsWith("add:") && <PersonaAttributeEditor key={selectedField} field={fields.find((field) => field.id === selectedField.slice(4))!} busy={busy} onSave={onSave} onUploadFile={onUploadFile} onCancel={() => setSelectedField("")} />}
        {canEdit && (addingField ? <PersonaFieldDefinitionForm sectionId={section.id} sections={sections} busy={busy} onSave={onSave} onCancel={() => setAddingField(false)} allowShared={allowShared} /> : <Button size="sm" variant="ghost" alignSelf="start" onClick={() => setAddingField(true)}>Create custom field</Button>)}
      </Stack></Accordion.ItemBody></Accordion.ItemContent>
    </Accordion.Item>
  );
}

function PersonaFieldValues({ field, profile, apiPath, canEdit, busy, onSave, onUploadFile, allowShared }: {
  field: PersonaField;
  profile: PersonaProfile;
  apiPath?: string;
  canEdit: boolean;
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
  onUploadFile?: (file: File) => Promise<string>;
  allowShared: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editDefinition, setEditDefinition] = useState(false);
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);
  const values = profile.values.filter((value) => value.fieldId === field.id);
  const linked = (value: PersonaValue) => profile.evidence.filter((item) => item.valueIds.includes(value.id));
  return (
    <Stack gap="2" borderTopWidth="1px" borderColor="border" pt="3">
      <Flex justify="space-between" align="center" gap="2" flexWrap="wrap"><Text fontWeight="medium">{field.name}{field.personaId === null && !field.id.startsWith("standard:") ? " · Shared" : ""}</Text>{canEdit && <Flex gap="1"><Button size="xs" variant="ghost" onClick={() => setEditing("new")}>Add</Button>{!field.id.startsWith("standard:") && <Button size="xs" variant="ghost" onClick={() => setEditDefinition(!editDefinition)}>Edit field</Button>}</Flex>}</Flex>
      {field.description && <Text fontSize="sm" color="fg.muted">{field.description}</Text>}
      {editDefinition && <PersonaFieldDefinitionForm field={field} sectionId={field.sectionId} sections={profile.sections} busy={busy} onSave={onSave} onCancel={() => setEditDefinition(false)} allowShared={allowShared} />}
      {values.map((value, index) => (
        <Box key={value.id} p="3" rounded="md" bg="bg.subtle">
          {editing === value.id ? <PersonaAttributeEditor field={field} value={value} busy={busy} onSave={onSave} onUploadFile={onUploadFile} onCancel={() => setEditing(null)} /> : (<>
            <Flex justify="space-between" gap="2" align="start" flexWrap="wrap">
              <Stack gap="1" flex="1" minW="40">{field.type === "file" && typeof value.value === "string" && value.value.startsWith("artifact:") && apiPath ? <Link color="blue.fg" href={`${apiPath}/artifacts/${value.value.slice(9)}`}>Download attached file</Link> : <Text whiteSpace="pre-wrap" overflowWrap="anywhere">{Array.isArray(value.value) ? value.value.join(", ") : typeof value.value === "boolean" ? value.value ? "Yes" : "No" : String(value.value)}</Text>}<Flex gap="2" align="center" flexWrap="wrap">{value.illustrative && <Badge colorPalette="orange">Illustrative suggestion</Badge>}{linked(value).length > 0 && <Button size="xs" variant="outline" aria-expanded={openEvidenceId === value.id} onClick={() => setOpenEvidenceId(openEvidenceId === value.id ? null : value.id)}>{linked(value).length} supporting {linked(value).length === 1 ? "source" : "sources"}</Button>}</Flex></Stack>
              {canEdit && <Flex gap="1" flexWrap="wrap"><Button size="xs" variant="ghost" disabled={busy || index === 0} onClick={() => void onSave({ action: "value.move", id: value.id, direction: "up" }).catch(() => undefined)}>Move up</Button><Button size="xs" variant="ghost" disabled={busy || index === values.length - 1} onClick={() => void onSave({ action: "value.move", id: value.id, direction: "down" }).catch(() => undefined)}>Move down</Button><Button size="xs" variant="ghost" onClick={() => setEditing(value.id)}>Edit</Button><Button size="xs" variant="ghost" colorPalette="red" onClick={() => void onSave({ action: "value.delete", id: value.id }).catch(() => undefined)}>Remove</Button></Flex>}
            </Flex>
            {openEvidenceId === value.id && <Stack gap="2" mt="3" borderTopWidth="1px" borderColor="border" pt="3">{linked(value).map((item) => <Stack key={item.id} gap="1"><Text fontSize="sm" fontWeight="semibold">{item.title} · {item.type}</Text><Text fontSize="sm" color="fg.muted">{item.confidence}{item.date ? ` · ${item.date}` : ""}{item.sourceReference ? ` · ${item.sourceReference}` : ""}</Text>{item.notes && <Text fontSize="sm">{item.notes}</Text>}{item.url && <Link fontSize="sm" color="blue.fg" href={item.url.startsWith("artifact:") && apiPath ? `${apiPath}/artifacts/${item.url.slice(9)}` : item.url}>Open source</Link>}</Stack>)}</Stack>}
          </>)}
        </Box>
      ))}
      {editing === "new" && <PersonaAttributeEditor field={field} busy={busy} onSave={onSave} onUploadFile={onUploadFile} onCancel={() => setEditing(null)} />}
    </Stack>
  );
}
