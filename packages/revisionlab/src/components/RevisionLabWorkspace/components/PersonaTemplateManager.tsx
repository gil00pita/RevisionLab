import { useCallback, useEffect, useState } from "react";
import { Button, Field, Flex, Heading, Input, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { PersonaSavedTemplate } from "../../../persona-profile.js";
import { personaTemplates } from "../persona-recommendations.js";
import { PersonaTemplateEditor } from "./PersonaTemplateEditor.js";

export function PersonaTemplateManager({ apiPath }: { apiPath: string }) {
  const [saved, setSaved] = useState<PersonaSavedTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const load = useCallback(async () => {
    const result = await apiRequest<{ saved: PersonaSavedTemplate[] }>(apiPath, "personas/templates");
    setSaved(result.saved);
  }, [apiPath]);
  useEffect(() => {
    let active = true;
    void apiRequest<{ saved: PersonaSavedTemplate[] }>(apiPath, "personas/templates")
      .then((result) => { if (active) setSaved(result.saved); })
      .catch((cause) => { if (active) setStatus(cause instanceof Error ? cause.message : "Could not load templates."); });
    return () => { active = false; };
  }, [apiPath]);
  async function create() {
    if (!newName.trim()) return;
    setBusy(true); setStatus("");
    try {
      const result = await apiRequest<{ id: string }>(apiPath, "personas/templates", { method: "POST", body: JSON.stringify({ name: newName.trim(), description: "", ...(sourceId ? { sourceTemplateId: sourceId } : {}) }) });
      await load(); setSelectedId(result.id); setNewName(""); setStatus("Template created. Add fields or suggested attributes below.");
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not create the template."); }
    finally { setBusy(false); }
  }
  const selected = saved.find((item) => item.id === selectedId);
  return <Stack gap="4" p="5" rounded="lg" borderWidth="1px" borderColor="border" bg="bg.panel">
    <Heading as="h3" size="md">Persona templates</Heading>
    <Text fontSize="sm" color="fg.muted">Built-in examples stay unchanged. Duplicate one or start blank to make a reusable template for this workspace.</Text>
    <Flex gap="3" flexWrap="wrap" align="end">
      <Field.Root maxW="56"><Field.Label>Starting point</Field.Label><NativeSelect.Root><NativeSelect.Field value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Blank template</option>{personaTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}{saved.map((item) => <option key={item.id} value={item.id}>Saved · {item.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
      <Field.Root maxW="64" required><Field.Label>New template name<Field.RequiredIndicator /></Field.Label><Input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={120} /></Field.Root>
      <Button size="sm" colorPalette="blue" disabled={!newName.trim()} loading={busy} onClick={() => void create()}>Create template</Button>
    </Flex>
    {saved.length > 0 && <Field.Root maxW="72"><Field.Label>Edit saved template</Field.Label><NativeSelect.Root><NativeSelect.Field value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Choose a template</option>{saved.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>}
    {status && <Text role="status" fontSize="sm">{status}</Text>}
    {selected && <PersonaTemplateEditor key={`${selected.id}:${selected.updatedAt}`} template={selected} apiPath={apiPath} onChange={async () => { await load(); }} onDelete={async () => { setSelectedId(""); await load(); }} />}
  </Stack>;
}
