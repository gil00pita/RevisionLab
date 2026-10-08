import { useState } from "react";
import { Button, Field, Flex, Heading, Input, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { personaConfidenceLevels, personaResearchStatuses, personaTypes } from "../../../persona-profile.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import type { PersonaProfileAction } from "./PersonaProfileEditor.js";

export function PersonaProfileMetadata({ persona, canEdit, busy, onSave }: {
  persona: RevisionLabPersona;
  canEdit: boolean;
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
}) {
  const [personaType, setPersonaType] = useState(persona.personaType ?? "Primary");
  const [researchStatus, setResearchStatus] = useState(persona.researchStatus ?? "Assumption-Based");
  const [confidenceLevel, setConfidenceLevel] = useState(persona.confidenceLevel ?? "Not Assessed");
  const [lastValidatedAt, setLastValidatedAt] = useState(persona.lastValidatedAt ?? "");
  return (
    <Stack as="section" gap="4" p="5" borderWidth="1px" borderColor="border" rounded="lg" bg="bg.panel">
      <Heading as="h3" size="md">Research and validation</Heading>
      <Text color="fg.muted" fontSize="sm">Choose a status based on research you have reviewed. Template suggestions are illustrative and do not count as evidence.</Text>
      <Flex gap="4" flexWrap="wrap">
        <Field.Root maxW="48" disabled={!canEdit || busy}>
          <Field.Label>Persona type</Field.Label>
          <NativeSelect.Root><NativeSelect.Field value={personaType} onChange={(event) => setPersonaType(event.target.value)}>{personaTypes.map((item) => <option key={item} value={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root>
        </Field.Root>
        <Field.Root maxW="56" disabled={!canEdit || busy}>
          <Field.Label>Research status</Field.Label>
          <NativeSelect.Root><NativeSelect.Field value={researchStatus} onChange={(event) => setResearchStatus(event.target.value)}>{personaResearchStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root>
        </Field.Root>
        <Field.Root maxW="48" disabled={!canEdit || busy}>
          <Field.Label>Confidence</Field.Label>
          <NativeSelect.Root><NativeSelect.Field value={confidenceLevel} onChange={(event) => setConfidenceLevel(event.target.value)}>{personaConfidenceLevels.map((item) => <option key={item} value={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root>
        </Field.Root>
        <Field.Root maxW="48" disabled={!canEdit || busy}>
          <Field.Label>Last validated</Field.Label>
          <Input type="date" value={lastValidatedAt} onChange={(event) => setLastValidatedAt(event.target.value)} />
        </Field.Root>
      </Flex>
      {canEdit && <Button alignSelf="start" size="sm" variant="outline" loading={busy} onClick={() => void onSave({ action: "metadata", personaType, researchStatus, confidenceLevel, lastValidatedAt: lastValidatedAt || null })}>Save research status</Button>}
    </Stack>
  );
}
