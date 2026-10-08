import { useState } from "react";
import { Button, Field, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";

export function PersonaProfileTemplateSave({ persona, apiPath }: { persona: RevisionLabPersona; apiPath: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${persona.name} template`);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function save() {
    setBusy(true); setStatus("");
    try {
      await apiRequest(apiPath, "personas/templates", { method: "POST", body: JSON.stringify({ name, description: persona.description, sourcePersonaId: persona.id }) });
      setStatus("Template saved. It is available under New persona."); setOpen(false);
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not save the template."); }
    finally { setBusy(false); }
  }
  return <Stack as="section" gap="3" p="5" borderWidth="1px" borderColor="border" rounded="lg" bg="bg.panel"><Text fontWeight="semibold">Reuse this structure</Text><Text color="fg.muted" fontSize="sm">Save these sections, custom fields, and attributes as an illustrative starting point for another persona. Evidence stays with this persona.</Text>{open ? <Flex gap="2" align="end" flexWrap="wrap"><Field.Root maxW="64" required><Field.Label>Template name<Field.RequiredIndicator /></Field.Label><Input value={name} onChange={(event) => setName(event.target.value)} /></Field.Root><Button size="sm" colorPalette="blue" disabled={!name.trim()} loading={busy} onClick={() => void save()}>Save template</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></Flex> : <Button size="sm" variant="outline" alignSelf="start" onClick={() => setOpen(true)}>Save as template</Button>}{status && <Text role="status" fontSize="sm">{status}</Text>}</Stack>;
}
