import { useRef, useState } from "react";
import { Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabPersona } from "../../../server/types.js";
import { personaRecommendations } from "../persona-recommendations.js";

export function PersonaRecommendations({
  apiPath,
  personas,
  onRefresh,
  onBusyChange,
}: {
  apiPath: string;
  personas: RevisionLabPersona[];
  onRefresh: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState("");
  async function add(persona: (typeof personaRecommendations)[number]) {
    if (pending.current) return;
    pending.current = true;
    setBusy(persona.name);
    onBusyChange(true);
    setError("");
    try {
      await apiRequest(apiPath, "personas", {
        method: "POST",
        body: JSON.stringify(persona),
      });
      setAdded((previous) => [...previous, persona.name]);
      await onRefresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add this persona.",
      );
    } finally {
      pending.current = false;
      setBusy("");
      onBusyChange(false);
    }
  }
  return (
    <Stack gap="4">
      <Heading as="h3" size="md">
        Recommended personas
      </Heading>
      <Text color="fg.muted">
        Start with an empty list. Add only the perspectives you want to review.
      </Text>
      {error && (
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      {personaRecommendations.map((persona) => {
        const exists =
          added.includes(persona.name) ||
          personas.some(
            (saved) => saved.name.toLowerCase() === persona.name.toLowerCase(),
          );
        return (
          <Flex
            key={persona.name}
            gap="4"
            align="start"
            justify="space-between"
            py="3"
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Stack gap="1">
              <Text fontWeight="semibold">{persona.name}</Text>
              <Text color="fg.muted" fontSize="sm">
                {persona.description}
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              flexShrink="0"
              aria-label={`${exists ? "Added" : "Add"} ${persona.name}`}
              disabled={Boolean(busy) || exists}
              loading={busy === persona.name}
              onClick={() => void add(persona)}
            >
              {exists ? "Added" : "Add"}
            </Button>
          </Flex>
        );
      })}
    </Stack>
  );
}
