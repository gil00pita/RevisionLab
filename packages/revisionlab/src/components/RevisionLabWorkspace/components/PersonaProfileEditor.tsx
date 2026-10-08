import { useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Flex, Heading, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "../../../client/api.js";
import type { PersonaProfile } from "../../../persona-profile.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { PersonaAvatar } from "../../PersonaAvatar/index.js";
import { PersonaProfileMetadata } from "./PersonaProfileMetadata.js";
import { PersonaProfileSections } from "./PersonaProfileSections.js";
import { PersonaProfileEvidence } from "./PersonaProfileEvidence.js";
import { PersonaProfileTemplateSave } from "./PersonaProfileTemplateSave.js";
import { PersonaProfileTemplateReset } from "./PersonaProfileTemplateReset.js";
import { personaTemplates } from "../persona-recommendations.js";

export type PersonaProfileAction = { action: string; [key: string]: unknown };

export function PersonaProfileEditor({ persona, apiPath, canEdit, onBack, onRefresh }: {
  persona: RevisionLabPersona;
  apiPath: string;
  canEdit: boolean;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [profile, setProfile] = useState<PersonaProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sourceTemplate = personaTemplates.find((item) => item.id === persona.templateId);
  const load = useCallback(async () => {
    const next = await apiRequest<PersonaProfile>(apiPath, `personas/${persona.id}/profile`);
    setProfile(next);
  }, [apiPath, persona.id]);
  useEffect(() => {
    let active = true;
    void apiRequest<PersonaProfile>(apiPath, `personas/${persona.id}/profile`)
      .then((next) => { if (active) setProfile(next); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load this profile."); });
    return () => { active = false; };
  }, [apiPath, persona.id]);
  const runAction = useCallback(async (action: PersonaProfileAction) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, `personas/${persona.id}/profile`, { method: "POST", body: JSON.stringify(action) });
      await Promise.all([load(), onRefresh()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this profile change.");
      throw cause;
    } finally { setBusy(false); }
  }, [apiPath, busy, load, onRefresh, persona.id]);
  const uploadFile = useCallback(async (file: File) => {
    if (file.size > 3_000_000) throw new Error("Files must be 3 MB or smaller.");
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read the file."));
      reader.readAsDataURL(file);
    });
    const result = await apiRequest<{ artifactId: string }>(apiPath, `personas/${persona.id}/files`, { method: "POST", body: JSON.stringify({ name: file.name, data }) });
    return `artifact:${result.artifactId}`;
  }, [apiPath, persona.id]);

  return (
    <Stack gap="6" p={{ base: "5", md: "8" }} minW="0" maxW="6xl">
      <Button variant="ghost" size="sm" alignSelf="start" onClick={onBack}>
        <Icon><ArrowLeft /></Icon> All personas
      </Button>
      <Flex gap="4" align="center" flexWrap="wrap">
        <PersonaAvatar name={persona.name} avatar={persona.avatar} />
        <Box minW="0" flex="1">
          <Heading as="h2" size="xl" overflowWrap="anywhere">{persona.name}</Heading>
          <Text color="fg.muted">{persona.description || "Add a description to give this persona context."}</Text>
        </Box>
        <Stack gap="1" align="end"><Badge colorPalette={persona.researchStatus === "Research-Backed" ? "green" : "orange"}>{persona.researchStatus ?? "Assumption-Based"}</Badge>{persona.templateId && <Badge variant="outline" colorPalette="blue">From {sourceTemplate?.name ?? "saved template"}</Badge>}</Stack>
      </Flex>
      {error && <Text role="alert" color="red.fg">{error}</Text>}
      {!profile ? <Spinner aria-label="Loading persona profile" /> : (
        <>
          <PersonaProfileMetadata key={persona.updatedAt} persona={persona} canEdit={canEdit} busy={busy} onSave={runAction} />
          <PersonaProfileSections profile={profile} apiPath={apiPath} canEdit={canEdit} busy={busy} onSave={runAction} onUploadFile={uploadFile} />
          <PersonaProfileEvidence profile={profile} apiPath={apiPath} canEdit={canEdit} busy={busy} onSave={runAction} onUploadFile={uploadFile} />
          {canEdit && <PersonaProfileTemplateSave persona={persona} apiPath={apiPath} />}
          {canEdit && persona.templateId && <PersonaProfileTemplateReset busy={busy} onSave={runAction} />}
          <Box as="section" borderTopWidth="1px" borderColor="border" pt="5">
            <Heading as="h3" size="md" mb="3">Profile activity</Heading>
            {profile.activity.length === 0 ? <Text color="fg.muted">No changes recorded yet.</Text> : (
              <Stack as="ol" gap="2" pl="5">
                {profile.activity.map((item) => (
                  <Text as="li" key={item.id} fontSize="sm" color="fg.muted">
                    {item.action} · {item.actorName} · {new Date(item.createdAt).toLocaleString()}
                  </Text>
                ))}
              </Stack>
            )}
          </Box>
        </>
      )}
    </Stack>
  );
}
