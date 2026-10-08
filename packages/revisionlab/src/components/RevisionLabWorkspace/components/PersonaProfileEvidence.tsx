import { useState } from "react";
import { Badge, Box, Button, Field, Flex, Heading, Input, Link, NativeSelect, Stack, Text, Textarea } from "@chakra-ui/react";
import { personaConfidenceLevels, type PersonaProfile } from "../../../persona-profile.js";
import type { PersonaProfileAction } from "./PersonaProfileEditor.js";

export function PersonaProfileEvidence({ profile, apiPath, canEdit, busy, onSave, onUploadFile }: {
  profile: PersonaProfile;
  apiPath: string;
  canEdit: boolean;
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
  onUploadFile: (file: File) => Promise<string>;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Interview");
  const [sourceReference, setSourceReference] = useState("");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState("");
  const [confidence, setConfidence] = useState<string>("Not Assessed");
  const [notes, setNotes] = useState("");
  const [valueId, setValueId] = useState("");
  const [linkValueIds, setLinkValueIds] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fieldNames = new Map(profile.fields.map((field) => [field.id, field.name]));
  const valueNames = new Map(profile.values.map((value) => [value.id, `${fieldNames.get(value.fieldId) ?? "Attribute"}: ${String(value.value).slice(0, 80)}`]));
  async function save() {
    if (!title.trim()) { setError("Give the evidence a title."); return; }
    try {
      await onSave({ action: "evidence.add", title, type, sourceReference, url, date: date || null, confidence, notes, feedbackId: null, valueIds: valueId ? [valueId] : [] });
      setAdding(false); setTitle(""); setSourceReference(""); setUrl(""); setDate(""); setNotes(""); setValueId(""); setError("");
    } catch { setError("Could not link this evidence. Review the message above."); }
  }
  return (
    <Stack as="section" gap="4" p="5" borderWidth="1px" borderColor="border" rounded="lg" bg="bg.panel">
      <Flex justify="space-between" gap="3" align="center" flexWrap="wrap"><Heading as="h3" size="md">Research evidence ({profile.evidence.length})</Heading>{canEdit && <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>{adding ? "Cancel" : "Add evidence"}</Button>}</Flex>
      <Text color="fg.muted" fontSize="sm">Link interviews, surveys, analytics, documents, or feedback to this persona or a specific attribute. Evidence does not change research status automatically.</Text>
      {adding && <Stack gap="3" p="4" rounded="md" bg="bg.subtle">
        <Field.Root required><Field.Label>Title<Field.RequiredIndicator /></Field.Label><Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} /></Field.Root>
        <Flex gap="3" flexWrap="wrap">
          <Field.Root maxW="44"><Field.Label>Type</Field.Label><NativeSelect.Root><NativeSelect.Field value={type} onChange={(event) => setType(event.target.value)}>{["Interview", "Survey", "Analytics", "Usability test", "Feedback", "Document", "Other"].map((item) => <option key={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
          <Field.Root maxW="48"><Field.Label>Research date</Field.Label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field.Root>
          <Field.Root maxW="48"><Field.Label>Confidence</Field.Label><NativeSelect.Root><NativeSelect.Field value={confidence} onChange={(event) => setConfidence(event.target.value)}>{personaConfidenceLevels.map((item) => <option key={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
        </Flex>
        <Field.Root><Field.Label>Source reference</Field.Label><Input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="Study or document name" maxLength={500} /></Field.Root>
        <Field.Root><Field.Label>Source URL or file reference</Field.Label><Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /></Field.Root>
        <Field.Root><Field.Label>Attach a file instead</Field.Label><Input type="file" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) { setUploading(true); void onUploadFile(file).then((reference) => { setUrl(reference); setSourceReference(file.name); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not upload the file.")).finally(() => setUploading(false)); } }} />{uploading && <Field.HelperText>Uploading file…</Field.HelperText>}{url.startsWith("artifact:") && !uploading && <Field.HelperText>File uploaded and ready to link.</Field.HelperText>}</Field.Root>
        <Field.Root><Field.Label>Link to attribute</Field.Label><NativeSelect.Root><NativeSelect.Field value={valueId} onChange={(event) => setValueId(event.target.value)}><option value="">Persona only</option>{[...valueNames].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
        <Field.Root><Field.Label>Notes</Field.Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={3} /></Field.Root>
        {error && <Text role="alert" color="red.fg" fontSize="sm">{error}</Text>}
        <Button alignSelf="start" size="sm" colorPalette="blue" loading={busy || uploading} disabled={uploading} onClick={() => void save()}>Save evidence</Button>
      </Stack>}
      {profile.evidence.length === 0 ? <Text color="fg.muted">No evidence linked yet.</Text> : <Stack gap="3">{profile.evidence.map((item) => <Box key={item.id} p="3" bg="bg.subtle" rounded="md"><Flex gap="2" align="center" flexWrap="wrap"><Text fontWeight="medium">{item.title}</Text><Badge colorPalette="blue">{item.type}</Badge><Badge>{item.confidence}</Badge></Flex><Text fontSize="sm" color="fg.muted">{item.sourceReference}{item.date ? ` · ${item.date}` : ""}</Text>{item.url && <Link fontSize="sm" color="blue.fg" overflowWrap="anywhere" href={item.url.startsWith("artifact:") ? `${apiPath}/artifacts/${item.url.slice(9)}` : item.url} target={item.url.startsWith("artifact:") ? undefined : "_blank"} rel="noopener noreferrer">{item.url.startsWith("artifact:") ? "Download evidence file" : item.url}</Link>}{item.notes && <Text fontSize="sm">{item.notes}</Text>}{item.valueIds.map((id) => <Badge key={id} mr="1" colorPalette="purple">{valueNames.get(id) ?? "Removed attribute"}</Badge>)}{canEdit && profile.values.some((value) => !item.valueIds.includes(value.id)) && <Flex mt="3" gap="2" flexWrap="wrap" align="end"><Field.Root maxW="64"><Field.Label>Attach to another attribute</Field.Label><NativeSelect.Root><NativeSelect.Field value={linkValueIds[item.id] ?? ""} onChange={(event) => setLinkValueIds((current) => ({ ...current, [item.id]: event.target.value }))}><option value="">Choose an attribute</option>{profile.values.filter((value) => !item.valueIds.includes(value.id)).map((value) => <option key={value.id} value={value.id}>{valueNames.get(value.id)}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root><Button size="sm" variant="outline" disabled={!linkValueIds[item.id] || busy} onClick={() => void onSave({ action: "evidence.link", evidenceId: item.id, valueId: linkValueIds[item.id] }).then(() => setLinkValueIds((current) => ({ ...current, [item.id]: "" }))).catch(() => undefined)}>Attach</Button></Flex>}</Box>)}</Stack>}
    </Stack>
  );
}
