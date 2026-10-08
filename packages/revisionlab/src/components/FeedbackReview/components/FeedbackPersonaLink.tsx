import { useState } from "react";
import { Button, Field, Flex, Input, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import { evidenceReviewPath, type EvidenceGroup } from "../../../feedback-review.js";
import { personaConfidenceLevels, type PersonaProfile } from "../../../persona-profile.js";
import type { RevisionLabPersona } from "../../../server/types.js";

export function FeedbackPersonaLink({ group, personas, apiPath, basePath }: {
  group: EvidenceGroup;
  personas: RevisionLabPersona[];
  apiPath: string;
  basePath: string;
}) {
  const [open, setOpen] = useState(false);
  const [personaId, setPersonaId] = useState("");
  const [sourceId, setSourceId] = useState(group.evidence[0]?.id ?? "");
  const [profile, setProfile] = useState<PersonaProfile | null>(null);
  const [target, setTarget] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [newValue, setNewValue] = useState("");
  const [confidence, setConfidence] = useState<string>("Not Assessed");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const source = group.evidence.find((item) => item.id === sourceId);
  const fields = profile?.fields.filter((field) => !field.hidden && ["short-text", "long-text", "repeatable-text"].includes(field.type)) ?? [];
  async function choosePersona(id: string) {
    setPersonaId(id); setProfile(null); setTarget(""); setStatus("");
    if (!id) return;
    try { setProfile(await apiRequest<PersonaProfile>(apiPath, `personas/${id}/profile`)); }
    catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not load persona fields."); }
  }
  async function save() {
    if (!personaId || !source) return;
    setBusy(true); setStatus("");
    try {
      let valueId = target;
      if (target === "new") {
        if (!fieldId || !newValue.trim()) { setStatus("Choose a field and enter the new attribute."); return; }
        const added = await apiRequest<{ id: string }>(apiPath, `personas/${personaId}/profile`, { method: "POST", body: JSON.stringify({ action: "value.add", fieldId, value: newValue.trim(), position: 0 }) });
        valueId = added.id;
      }
      await apiRequest(apiPath, `personas/${personaId}/profile`, { method: "POST", body: JSON.stringify({ action: "evidence.add", title: source.title.slice(0, 120), type: "Feedback", sourceReference: `${source.kind} · ${source.route}`.slice(0, 500), url: new URL(evidenceReviewPath(source, basePath), window.location.origin).toString(), date: source.capturedAt.slice(0, 10), confidence, notes: "", feedbackId: source.id, valueIds: valueId && valueId !== "new" ? [valueId] : [] }) });
      setStatus("Feedback linked. Research status is unchanged."); setOpen(false);
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not link this feedback."); }
    finally { setBusy(false); }
  }
  return <Stack gap="3" borderTopWidth="1px" borderColor="border" pt="3">
    <Button size="sm" variant="outline" alignSelf="start" onClick={() => setOpen(!open)}>{open ? "Cancel" : "Add to persona"}</Button>
    {open && <Stack gap="3" p="3" rounded="md" bg="bg.subtle">
      <Field.Root><Field.Label>Feedback source</Field.Label><NativeSelect.Root><NativeSelect.Field value={sourceId} onChange={(event) => setSourceId(event.target.value)}>{group.evidence.map((item) => <option key={item.id} value={item.id}>{item.title.slice(0, 100)} · {new Date(item.capturedAt).toLocaleDateString()}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
      <Field.Root required><Field.Label>Persona<Field.RequiredIndicator /></Field.Label><NativeSelect.Root><NativeSelect.Field value={personaId} onChange={(event) => void choosePersona(event.target.value)}><option value="">Choose a persona</option>{personas.filter((item) => !item.archivedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
      {profile && <>
        <Field.Root><Field.Label>Link to</Field.Label><NativeSelect.Root><NativeSelect.Field value={target} onChange={(event) => setTarget(event.target.value)}><option value="">Persona as a whole</option><option value="new">New attribute</option>{profile.values.map((value) => <option key={value.id} value={value.id}>{profile.fields.find((field) => field.id === value.fieldId)?.name}: {String(value.value).slice(0, 60)}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
        {target === "new" && <Flex gap="2" flexWrap="wrap"><Field.Root maxW="56"><Field.Label>Field</Field.Label><NativeSelect.Root><NativeSelect.Field value={fieldId} onChange={(event) => setFieldId(event.target.value)}><option value="">Choose a field</option>{fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root><Field.Root flex="1" minW="48"><Field.Label>New attribute</Field.Label><Input value={newValue} onChange={(event) => setNewValue(event.target.value)} maxLength={5000} /></Field.Root></Flex>}
        <Field.Root maxW="48"><Field.Label>Evidence confidence</Field.Label><NativeSelect.Root><NativeSelect.Field value={confidence} onChange={(event) => setConfidence(event.target.value)}>{personaConfidenceLevels.map((item) => <option key={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
        <Button size="sm" colorPalette="blue" alignSelf="start" loading={busy} onClick={() => void save()}>Link feedback</Button>
      </>}
    </Stack>}
    {status && <Text role="status" fontSize="sm">{status}</Text>}
  </Stack>;
}
