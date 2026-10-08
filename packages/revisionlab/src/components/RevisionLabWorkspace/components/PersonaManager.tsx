import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { useEffect, useState } from "react";
import {
  Badge,
  Accordion,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PersonaActions } from "./PersonaActions.js";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { PersonaTable } from "./PersonaTable.js";
import { PersonaForm } from "./PersonaForm.js";
import type { PersonaTemplate } from "../persona-recommendations.js";
import { PersonaProfileEditor } from "./PersonaProfileEditor.js";
import { personaConfidenceLevels, personaResearchStatuses, personaTypes } from "../../../persona-profile.js";
import { personaTemplates } from "../persona-recommendations.js";
import { PersonaTemplateManager } from "./PersonaTemplateManager.js";

export interface PersonaEditorControl {
  form: { persona?: RevisionLabPersona; template?: PersonaTemplate } | null;
  disabled: boolean;
  onChange: (
    form: { persona?: RevisionLabPersona; template?: PersonaTemplate } | null,
  ) => void;
}

export function PersonaManager({
  onBusyChange,
  apiPath,
  personas,
  canEdit,
  canManageCredentials,
  onRefresh,
  editor,
}: {
  onBusyChange?: (busy: boolean) => void;
  apiPath: string;
  personas: RevisionLabPersona[];
  canEdit: boolean;
  canManageCredentials: boolean;
  onRefresh: () => Promise<void>;
  editor?: PersonaEditorControl;
}) {
  const [inlineForm, setInlineForm] = useState<{
    persona?: RevisionLabPersona;
    template?: PersonaTemplate;
  } | null>(null);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [createdSince, setCreatedSince] = useState("");
  const [updatedSince, setUpdatedSince] = useState("");
  const [sharedFields, setSharedFields] = useState<{ id: string; name: string; type: string }[]>([]);
  const [sharedFieldId, setSharedFieldId] = useState("");
  const [sharedOperator, setSharedOperator] = useState("contains");
  const [sharedValue, setSharedValue] = useState("");
  const [matchingIds, setMatchingIds] = useState<string[] | null>(null);
  const [sharedError, setSharedError] = useState("");
  const hasEditor = Boolean(editor);
  useEffect(() => {
    if (!hasEditor) return;
    let active = true;
    const query = new URLSearchParams();
    if (sharedFieldId && sharedValue.trim()) {
      query.set("fieldId", sharedFieldId);
      query.set("operator", sharedOperator);
      query.set("value", sharedValue.trim());
    }
    const timer = setTimeout(() => {
      void apiRequest<{ fields: { id: string; name: string; type: string }[]; personaIds: string[] | null }>(apiPath, `personas/filters${query.size ? `?${query}` : ""}`)
        .then((result) => { if (active) { setSharedFields(result.fields); setMatchingIds(result.personaIds); setSharedError(""); } })
        .catch((cause) => { if (active) { setMatchingIds(null); setSharedError(cause instanceof Error ? cause.message : "Could not filter shared fields."); } });
    }, query.size ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [apiPath, hasEditor, sharedFieldId, sharedOperator, sharedValue]);
  const editing = editor ? editor.form?.persona : inlineForm?.persona;
  const template = editor ? editor.form?.template : inlineForm?.template;
  const formOpen = editor ? editor.form !== null : inlineForm !== null;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const actionsDisabled = Boolean(busy) || Boolean(editor?.disabled);
  function closeEditor() {
    if (editor) editor.onChange(null);
    else setInlineForm(null);
  }
  async function archive(persona: RevisionLabPersona) {
    if (busy) return;
    setBusy(persona.id);
    onBusyChange?.(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(apiPath, `personas/${persona.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: !persona.archivedAt }),
      });
      await onRefresh();
      setNotice(
        persona.archivedAt
          ? "Persona restored."
          : "Persona archived. Existing recordings are unchanged.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update the persona.",
      );
    } finally {
      setBusy(null);
      onBusyChange?.(false);
    }
  }
  async function removeAccount(id: string) {
    if (busy) return;
    setBusy(id);
    onBusyChange?.(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(apiPath, `personas/${id}/credentials`, {
        method: "DELETE",
        body: "{}",
      });
      await onRefresh();
      setNotice("Persona test account removed.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not remove the test account.",
      );
    } finally {
      setBusy(null);
      onBusyChange?.(false);
    }
  }
  const viewed = personas.find((persona) => persona.id === viewedId);
  const filtered = personas.filter((persona) =>
    `${persona.name} ${persona.description}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
    (!typeFilter || (persona.personaType ?? "Primary") === typeFilter) &&
    (!statusFilter || (persona.researchStatus ?? "Assumption-Based") === statusFilter) &&
    (!confidenceFilter || (persona.confidenceLevel ?? "Not Assessed") === confidenceFilter) &&
    (!templateFilter || (templateFilter === "none" ? !persona.templateId : persona.templateId === templateFilter)) &&
    (!createdSince || persona.createdAt.slice(0, 10) >= createdSince) &&
    (!updatedSince || persona.updatedAt.slice(0, 10) >= updatedSince) &&
    (matchingIds === null || matchingIds.includes(persona.id)),
  );
  if (viewed && !formOpen) return <PersonaProfileEditor persona={viewed} apiPath={apiPath} canEdit={canEdit && !viewed.archivedAt} onBack={() => setViewedId(null)} onRefresh={onRefresh} />;
  return (
    <Stack
      p={editor ? { base: "5", md: "8" } : "0"}
      gap="6"
      w="full"
      minW="0"
      maxW={editor ? "full" : "5xl"}
    >
      <Flex
        align="center"
        justify="space-between"
        gap="3"
        flexWrap="wrap"
        minW="0"
      >
        {editor && (
          <Heading as="h2" size="xl">
            Personas
          </Heading>
        )}
        <Badge colorPalette="gray" whiteSpace="normal" overflowWrap="anywhere">
          {personas.filter((persona) => !persona.archivedAt).length} active
        </Badge>
      </Flex>
      {canEdit && !editor && !formOpen && (
        <Button
          alignSelf="start"
          variant="outline"
          disabled={actionsDisabled}
          onClick={() => setInlineForm({})}
        >
          Add persona
        </Button>
      )}
      {canEdit && formOpen && (
        <PersonaForm
          onBusyChange={onBusyChange}
          key={editing?.id ?? template?.name ?? "new"}
          apiPath={apiPath}
          persona={editing}
          template={template}
          onCancel={closeEditor}
          cancelable
          canManageCredentials={canManageCredentials}
          onSaved={async () => {
            await onRefresh();
            closeEditor();
            setNotice("Persona saved.");
          }}
        />
      )}
      {canEdit && formOpen && <Separator />}
      {error && (
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      {notice && (
        <Text role="status" color="green.fg" fontSize="sm">
          {notice}
        </Text>
      )}
      {personas.length > 0 && <Stack gap="2">
        <Field.Root maxW="sm"><Field.Label>Search personas</Field.Label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or description" /></Field.Root>
        <Accordion.Root collapsible defaultValue={[]}><Accordion.Item value="filters"><Accordion.ItemTrigger><Text flex="1">Filters</Text><Accordion.ItemIndicator /></Accordion.ItemTrigger><Accordion.ItemContent><Accordion.ItemBody px="0"><Flex gap="3" flexWrap="wrap">
          <Field.Root maxW="44"><Field.Label>Persona type</Field.Label><NativeSelect.Root><NativeSelect.Field value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Any type</option>{personaTypes.map((item) => <option key={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
          <Field.Root maxW="52"><Field.Label>Research status</Field.Label><NativeSelect.Root><NativeSelect.Field value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Any status</option>{personaResearchStatuses.map((item) => <option key={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
          <Field.Root maxW="48"><Field.Label>Confidence</Field.Label><NativeSelect.Root><NativeSelect.Field value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value)}><option value="">Any confidence</option>{personaConfidenceLevels.map((item) => <option key={item}>{item}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
          <Field.Root maxW="52"><Field.Label>Template</Field.Label><NativeSelect.Root><NativeSelect.Field value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)}><option value="">Any template</option><option value="none">Created without template</option>{personaTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}{[...new Set(personas.map((item) => item.templateId).filter((id): id is string => Boolean(id) && !personaTemplates.some((template) => template.id === id)))].map((id) => <option key={id} value={id}>Saved template · {id.slice(0, 8)}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>
          <Field.Root maxW="48"><Field.Label>Created since</Field.Label><Input type="date" value={createdSince} onChange={(event) => setCreatedSince(event.target.value)} /></Field.Root>
          <Field.Root maxW="48"><Field.Label>Updated since</Field.Label><Input type="date" value={updatedSince} onChange={(event) => setUpdatedSince(event.target.value)} /></Field.Root>
          {editor && sharedFields.length > 0 && <Field.Root maxW="56"><Field.Label>Shared field</Field.Label><NativeSelect.Root><NativeSelect.Field value={sharedFieldId} onChange={(event) => { const field = sharedFields.find((item) => item.id === event.target.value); setSharedFieldId(event.target.value); setSharedOperator(field && ["number", "rating"].includes(field.type) ? "lte" : "contains"); setSharedValue(""); setMatchingIds(null); }}><option value="">Any shared field</option>{sharedFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root>}
          {sharedFieldId && <><Field.Root maxW="40"><Field.Label>Comparison</Field.Label><NativeSelect.Root><NativeSelect.Field value={sharedOperator} onChange={(event) => { setSharedOperator(event.target.value); setMatchingIds(null); }}>{["number", "rating"].includes(sharedFields.find((item) => item.id === sharedFieldId)?.type ?? "") ? <><option value="lte">At most</option><option value="gte">At least</option><option value="equals">Equals</option></> : <><option value="contains">Contains</option><option value="equals">Equals</option></>}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root></Field.Root><Field.Root maxW="40"><Field.Label>Field value</Field.Label><Input type={["number", "rating"].includes(sharedFields.find((item) => item.id === sharedFieldId)?.type ?? "") ? "number" : "text"} value={sharedValue} onChange={(event) => { setSharedValue(event.target.value); setMatchingIds(null); }} /></Field.Root></>}
        </Flex></Accordion.ItemBody></Accordion.ItemContent></Accordion.Item></Accordion.Root>
        {sharedError && <Text role="alert" color="red.fg" fontSize="sm">{sharedError}</Text>}
        <Text fontSize="sm" color="fg.muted">{filtered.length} of {personas.length} personas</Text>
      </Stack>}
      <Stack as="section" gap="0" aria-label="Saved personas">
        {personas.length === 0 && (
          <IllustratedEmptyState
            illustration="documents"
            description="No personas yet."
          />
        )}
        {personas.length > 0 && (
          <PersonaTable
            personas={filtered}
            actions={
                (persona) => (
                    <PersonaActions
                      persona={persona}
                      disabled={actionsDisabled}
                      loading={busy === persona.id}
                      canEdit={canEdit}
                      canManageCredentials={canManageCredentials}
                      onView={() => setViewedId(persona.id)}
                      onEdit={() => {
                        if (editor) editor.onChange({ persona });
                        else setInlineForm({ persona });
                        setNotice("");
                      }}
                      onArchive={() => void archive(persona)}
                      onRemoveAccount={() => void removeAccount(persona.id)}
                    />
                  )
            }
          />
        )}
      </Stack>
      {editor && canEdit && <Accordion.Root collapsible lazyMount unmountOnExit defaultValue={[]}><Accordion.Item value="templates"><Accordion.ItemTrigger><Text flex="1">Manage persona templates</Text><Accordion.ItemIndicator /></Accordion.ItemTrigger><Accordion.ItemContent><Accordion.ItemBody px="0"><PersonaTemplateManager apiPath={apiPath} /></Accordion.ItemBody></Accordion.ItemContent></Accordion.Item></Accordion.Root>}
    </Stack>
  );
}
