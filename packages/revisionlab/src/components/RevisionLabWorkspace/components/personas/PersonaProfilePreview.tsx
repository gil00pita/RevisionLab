import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Drawer,
  Flex,
  Heading,
  Portal,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { RevisionLabPersona } from "../../../../server/types.js";
import type { PersonaProfile } from "../../../../persona-profile.js";
import { apiRequest } from "../../../../client/api.js";
import { PersonaAvatar } from "../../../PersonaAvatar/index.js";
import { PersonaResearchMetadata } from "./PersonaResearchMetadata.js";

export function PersonaProfilePreview({
  persona,
  apiPath,
  onClose,
  onOpenProfile,
}: {
  persona: RevisionLabPersona;
  apiPath: string;
  onClose: () => void;
  onOpenProfile: () => void;
}) {
  const [profile, setProfile] = useState<PersonaProfile | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void apiRequest<PersonaProfile>(apiPath, `personas/${persona.id}/profile`)
      .then((result) => {
        if (active) {
          setProfile(result);
          setError("");
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the profile.",
          );
      });
    return () => {
      active = false;
    };
  }, [apiPath, persona.id, retry]);
  const goals = profile
    ? profile.fields
        .filter(
          (field) =>
            !field.hidden &&
            ["Goals", "Needs", "Behaviours"].includes(field.name),
        )
        .flatMap((field) =>
          profile.values
            .filter(
              (value) =>
                value.fieldId === field.id && typeof value.value === "string",
            )
            .map((value) => ({
              id: value.id,
              label: field.name,
              value: String(value.value),
              illustrative: value.illustrative,
            })),
        )
        .slice(0, 3)
    : [];
  return (
    <Drawer.Root
      open
      placement="end"
      size="md"
      onOpenChange={(event) => {
        if (!event.open) onClose();
      }}
    >
      <Portal>
        <Drawer.Backdrop
          data-revisionlab-ui
          _motionReduce={{ animation: "none" }}
        />
        <Drawer.Positioner
          data-revisionlab-ui
          color="fg"
          fontFamily="body"
          fontSize="sm"
          lineHeight="1.6"
          colorPalette="blue"
        >
          <Drawer.Content bg="bg.panel" w="full" maxW="md" _motionReduce={{ animation: "none" }}>
            <Drawer.Header>
              <Drawer.Title>Persona overview</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="6">
                <Flex gap="4" align="center" minW="0">
                  <PersonaAvatar
                    name={persona.name}
                    avatar={persona.avatar}
                    size="lg"
                  />
                  <Heading as="h2" size="lg" overflowWrap="anywhere">
                    {persona.name}
                  </Heading>
                </Flex>
                <Text color="fg.muted" overflowWrap="anywhere">
                  {persona.description ||
                    "Add a behavioural summary in the full profile."}
                </Text>
                <PersonaResearchMetadata persona={persona} explain />
                {error ? (
                  <Stack>
                    <Text role="alert" color="red.fg">
                      {error}
                    </Text>
                    <Button
                      variant="outline"
                      alignSelf="start"
                      onClick={() => {
                        setError("");
                        setRetry((value) => value + 1);
                      }}
                    >
                      Try again
                    </Button>
                  </Stack>
                ) : !profile ? (
                  <Stack
                    role="status"
                    aria-label="Loading persona research"
                    aria-busy="true"
                  >
                    <Skeleton h="24" _motionReduce={{ animation: "none" }} />
                    <Skeleton h="24" _motionReduce={{ animation: "none" }} />
                  </Stack>
                ) : (
                  <>
                    {goals.length > 0 && (
                      <Stack gap="3">
                        {goals.map((goal) => (
                          <Box key={goal.id} bg="bg.subtle" p="3" rounded="lg">
                            <Text fontSize="xs" color="fg.muted">
                              {goal.label}
                              {goal.illustrative
                                ? " · Template suggestion"
                                : ""}
                            </Text>
                            <Text fontSize="sm" overflowWrap="anywhere">
                              {goal.value}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    )}
                    <Stack as="section" gap="3">
                      <Heading as="h3" size="md">
                        Research evidence{" "}
                        <Text as="span" color="fg.muted">
                          ({profile.evidence.length})
                        </Text>
                      </Heading>
                      {profile.evidence.length === 0 ? (
                        <Text fontSize="sm" color="fg.muted">
                          No evidence linked yet. Open the full profile to add
                          interviews, surveys, or feedback.
                        </Text>
                      ) : (
                        profile.evidence.slice(0, 3).map((evidence) => (
                          <Box
                            key={evidence.id}
                            p="3"
                            rounded="lg"
                            borderWidth="1px"
                            borderColor="border"
                          >
                            <Text fontWeight="medium" overflowWrap="anywhere">
                              {evidence.title}
                            </Text>
                            <Text fontSize="xs" color="fg.muted">
                              {evidence.type} · Confidence:{" "}
                              {evidence.confidence}
                            </Text>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </Drawer.Body>
            <Drawer.Footer>
              <Button colorPalette="blue" onClick={onOpenProfile}>
                Open full profile
              </Button>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Close persona overview" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
