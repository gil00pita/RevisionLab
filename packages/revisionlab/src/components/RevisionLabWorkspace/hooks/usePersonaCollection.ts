import { useEffect, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import { usePersonaView } from "../../../client/persona-view.js";
import type { RevisionLabPersona } from "../../../server/types.js";

export const initialPersonaFilters = {
  type: "",
  status: "",
  confidence: "",
  template: "",
  created: "",
  updated: "",
  availability: "active",
  field: "",
  operator: "contains",
  value: "",
};
export type PersonaFilters = typeof initialPersonaFilters;

export function usePersonaCollection(
  apiPath: string,
  personas: RevisionLabPersona[],
  shared: boolean,
) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialPersonaFilters);
  const [sort, setSort] = useState("updated");
  const { view, changeView } = usePersonaView();
  const [sharedFields, setSharedFields] = useState<
    { id: string; name: string; type: string }[]
  >([]);
  const [matches, setMatches] = useState<{
    query: string;
    ids: string[] | null;
  } | null>(null);
  const [sharedError, setSharedError] = useState("");
  const query = new URLSearchParams();
  if (filters.field && filters.value.trim()) {
    query.set("fieldId", filters.field);
    query.set("operator", filters.operator);
    query.set("value", filters.value.trim());
  }
  const sharedQuery = query.toString();
  useEffect(() => {
    if (!shared) return;
    let active = true;
    const timer = setTimeout(
      () => {
        void apiRequest<{
          fields: { id: string; name: string; type: string }[];
          personaIds: string[] | null;
        }>(apiPath, `personas/filters${sharedQuery ? `?${sharedQuery}` : ""}`)
          .then((result) => {
            if (active) {
              setSharedFields(result.fields);
              setMatches({ query: sharedQuery, ids: result.personaIds });
              setSharedError("");
            }
          })
          .catch((cause) => {
            if (active) {
              setMatches(null);
              setSharedError(
                cause instanceof Error
                  ? cause.message
                  : "Could not filter shared fields.",
              );
            }
          });
      },
      sharedQuery ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [apiPath, shared, sharedQuery]);
  const filtered = personas
    .filter(
      (persona) =>
        `${persona.name} ${persona.description}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()) &&
        (!filters.type ||
          (persona.personaType ?? "Primary") === filters.type) &&
        (!filters.status ||
          (persona.researchStatus ?? "Assumption-Based") === filters.status) &&
        (!filters.confidence ||
          (persona.confidenceLevel ?? "Not Assessed") === filters.confidence) &&
        (!filters.template ||
          (filters.template === "none"
            ? !persona.templateId
            : persona.templateId === filters.template)) &&
        (!filters.created ||
          persona.createdAt.slice(0, 10) >= filters.created) &&
        (!filters.updated ||
          persona.updatedAt.slice(0, 10) >= filters.updated) &&
        (filters.availability === "all" ||
          (filters.availability === "archived"
            ? Boolean(persona.archivedAt)
            : !persona.archivedAt)) &&
        (!sharedQuery ||
          !matches ||
          matches.query !== sharedQuery ||
          matches.ids === null ||
          matches.ids.includes(persona.id)),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "created"
          ? b.createdAt.localeCompare(a.createdAt)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
  return {
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    setSort,
    view,
    changeView,
    filtered,
    sharedFields,
    sharedError,
    filtering: Boolean(
      sharedQuery && matches?.query !== sharedQuery && !sharedError,
    ),
  };
}
