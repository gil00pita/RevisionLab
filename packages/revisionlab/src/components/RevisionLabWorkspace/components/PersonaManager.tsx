import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { useState } from "react";
import {
  Badge,
  Accordion,
  Button,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PersonaActions } from "./PersonaActions.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { PersonaTable } from "./PersonaTable.js";
import { PersonaForm } from "./PersonaForm.js";
import type { PersonaTemplate } from "../persona-recommendations.js";
import { PersonaProfileEditor } from "./PersonaProfileEditor.js";
import { PersonaTemplateManager } from "./PersonaTemplateManager.js";

import {
  usePersonaCollection,
  initialPersonaFilters,
} from "../hooks/usePersonaCollection.js";
import { PersonaCollectionToolbar } from "./personas/PersonaCollectionToolbar.js";
import { PersonaCards } from "./personas/PersonaCards.js";
import { PersonaProfilePreview } from "./personas/PersonaProfilePreview.js";
import { usePersonaMutations } from "../hooks/usePersonaMutations.js";
import { PersonaChangeNotice } from "./personas/PersonaChangeNotice.js";

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
  layout = "workspace",
}: {
  onBusyChange?: (busy: boolean) => void;
  apiPath: string;
  personas: RevisionLabPersona[];
  canEdit: boolean;
  canManageCredentials: boolean;
  onRefresh: () => Promise<void>;
  editor?: PersonaEditorControl;
  layout?: "workspace" | "wizard";
}) {
  const [inlineForm, setInlineForm] = useState<{
    persona?: RevisionLabPersona;
    template?: PersonaTemplate;
  } | null>(null);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const collection = usePersonaCollection(apiPath, personas, Boolean(editor));
  const [previewId, setPreviewId] = useState<string | null>(null);
  const editing = editor ? editor.form?.persona : inlineForm?.persona;
  const template = editor ? editor.form?.template : inlineForm?.template;
  const formOpen = editor ? editor.form !== null : inlineForm !== null;
  const {
    busy,
    error,
    notice,
    undoPersona,
    setNotice,
    archive,
    removeAccount,
  } = usePersonaMutations(apiPath, onRefresh, onBusyChange);
  const actionsDisabled = Boolean(busy) || Boolean(editor?.disabled);
  function closeEditor() {
    if (editor) editor.onChange(null);
    else setInlineForm(null);
  }
  const viewed = personas.find((persona) => persona.id === viewedId);
  const preview = personas.find((persona) => persona.id === previewId);
  const { filtered } = collection;
  function renderActions(persona: RevisionLabPersona) {
    return (
      <PersonaActions
        compact={layout === "wizard"}
        persona={persona}
        disabled={actionsDisabled}
        loading={busy === persona.id}
        canEdit={canEdit}
        canManageCredentials={canManageCredentials}
        onView={() =>
          editor ? setPreviewId(persona.id) : setViewedId(persona.id)
        }
        onEdit={() => {
          if (editor) editor.onChange({ persona });
          else setInlineForm({ persona });
          setNotice("");
        }}
        onArchive={() => void archive(persona)}
        onRemoveAccount={() => void removeAccount(persona.id)}
      />
    );
  }
  if (viewed && !formOpen)
    return (
      <PersonaProfileEditor
        persona={viewed}
        apiPath={apiPath}
        canEdit={canEdit && !viewed.archivedAt}
        onBack={() => setViewedId(null)}
        onRefresh={onRefresh}
      />
    );
  return (
    <Stack
      p={editor ? { base: "4", md: "6" } : "0"}
      gap="6"
      w="full"
      minW="0"
      maxW={editor ? "full" : "5xl"}
      bg={editor ? "bg.subtle" : undefined}
    >
      {!editor && (
        <Badge alignSelf="start">
          {personas.filter((persona) => !persona.archivedAt).length} active
        </Badge>
      )}
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
      <PersonaChangeNotice
        notice={notice}
        canUndo={Boolean(undoPersona)}
        disabled={actionsDisabled}
        onUndo={() => {
          if (undoPersona) void archive(undoPersona, false);
        }}
      />
      {personas.length > 0 && (
        <PersonaCollectionToolbar
          collection={collection}
          personas={personas}
          layout={layout}
        />
      )}
      {(collection.search ||
        Object.entries(collection.filters).some(
          ([key, value]) =>
            value !==
            initialPersonaFilters[key as keyof typeof initialPersonaFilters],
        )) && (
        <Text role="status" fontSize="sm" color="fg.muted">
          {filtered.length} {filtered.length === 1 ? "persona" : "personas"}{" "}
          found
        </Text>
      )}
      <Stack as="section" gap="0" aria-label="Saved personas">
        {personas.length === 0 && (
          <IllustratedEmptyState
            illustration="personas"
            description="No personas yet."
          />
        )}
        {personas.length > 0 && filtered.length === 0 && (
          <Stack
            align="center"
            gap="3"
            py="12"
            bg="bg.panel"
            rounded="xl"
            borderWidth="1px"
            borderColor="border"
          >
            <Text fontWeight="medium">No personas match these filters.</Text>
            <Button
              variant="outline"
              onClick={() => {
                collection.setSearch("");
                collection.setFilters(initialPersonaFilters);
              }}
            >
              Clear search and filters
            </Button>
          </Stack>
        )}
        {filtered.length > 0 &&
          (editor && collection.view === "cards" ? (
            <PersonaCards personas={filtered} actions={renderActions} />
          ) : (
            <PersonaTable
              layout={layout}
              personas={filtered}
              actions={renderActions}
            />
          ))}
      </Stack>
      {preview && !formOpen && (
        <PersonaProfilePreview
          key={preview.id}
          persona={preview}
          apiPath={apiPath}
          onClose={() => setPreviewId(null)}
          onOpenProfile={() => {
            setViewedId(preview.id);
            setPreviewId(null);
          }}
        />
      )}
      {editor && canEdit && (
        <Accordion.Root collapsible lazyMount unmountOnExit defaultValue={[]}>
          <Accordion.Item value="templates">
            <Accordion.ItemTrigger>
              <Text flex="1" fontSize="sm" color="fg.muted">
                Manage persona templates
              </Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody px="0">
                <PersonaTemplateManager apiPath={apiPath} />
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      )}
    </Stack>
  );
}
