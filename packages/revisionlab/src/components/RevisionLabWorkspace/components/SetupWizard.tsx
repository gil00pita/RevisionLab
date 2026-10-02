import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Separator,
  Stack,
  Steps,
  Text,
} from "@chakra-ui/react";
import type { RevisionLabState } from "../../../server/types.js";
import { AppearanceSettings } from "../../AppearanceSettings/index.js";
import { UsersRoleManager } from "../../UsersRoleManager/index.js";
import { useSetupWizard } from "../hooks/useSetupWizard.js";
import { SetupIdentity } from "./SetupIdentity.js";
import { PersonaRecommendations } from "./PersonaRecommendations.js";
import { PersonaManager } from "./PersonaManager.js";

const titles = [
  "Your details",
  "Widget",
  "Live comments",
  "Accessibility",
  "Personas",
  "Users & roles",
];

export function SetupWizard({
  data,
  apiPath,
  basePath,
  onRefresh,
  onComplete,
}: {
  data: RevisionLabState;
  apiPath: string;
  basePath: string;
  onRefresh: () => Promise<void>;
  onComplete: () => void;
}) {
  const wizard = useSetupWizard(data, apiPath, onRefresh, onComplete);
  const [savingDetails, setSavingDetails] = useState(false);
  const busy = wizard.busy || savingDetails;
  if (data.actor.role !== "owner")
    return (
      <Stack
        as="main"
        minH="100dvh"
        p="8"
        justify="center"
        align="center"
        gap="4"
      >
        <Heading as="h1">RevisionLab setup</Heading>
        <Text>
          The workspace owner needs to finish setup before you can start
          reviewing.
        </Text>
        <Link href="/">Back to prototype</Link>
      </Stack>
    );
  return (
    <Box as="main" minH="100dvh" bg="gray.50" p={{ base: "4", md: "10" }}>
      <Stack maxW="4xl" mx="auto" gap="6">
        <Text fontWeight="bold" fontSize="lg">
          RevisionLab
        </Text>
        <Stack gap="2">
          <Heading as="h1" size={{ base: "2xl", md: "3xl" }}>
            Let’s set up RevisionLab
          </Heading>
          <Text color="gray.600">
            A few choices to make this workspace yours. Only your details are
            required.
          </Text>
        </Stack>
        <Steps.Root
          step={wizard.step}
          count={titles.length}
          size="sm"
          colorPalette="blue"
        >
          <Steps.List aria-label="Setup progress">
            {titles.map((title, index) => (
              <Steps.Item key={title} index={index} title={title}>
                <Steps.Indicator />
                <Steps.Title hideBelow="md">{title}</Steps.Title>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>
        <Stack
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={{ base: "5", md: "8" }}
          gap="6"
          shadow="sm"
        >
          <Stack gap="1">
            <Text color="blue.700" fontSize="sm" fontWeight="medium">
              Step {wizard.step + 1} of {titles.length}
            </Text>
            <Heading
              id="revisionlab-setup-heading"
              tabIndex={-1}
              as="h2"
              size="xl"
              focusRing="outside"
            >
              {titles[wizard.step]}
            </Heading>
          </Stack>
          <Box
            as={wizard.step === 0 ? "form" : "section"}
            id="revisionlab-setup-step"
            onSubmit={
              wizard.step === 0
                ? (event) => {
                    event.preventDefault();
                    void wizard.save();
                  }
                : undefined
            }
          >
            {wizard.step === 0 && (
              <SetupIdentity
                name={wizard.name}
                email={wizard.email}
                systemUrl={wizard.systemUrl}
                local={Boolean(data.actor.local)}
                disabled={busy}
                onName={wizard.setName}
                onEmail={wizard.setEmail}
                onUrl={wizard.setSystemUrl}
              />
            )}
            {wizard.step >= 1 && wizard.step <= 3 && (
              <AppearanceSettings
                section={
                  wizard.step === 1
                    ? "widget"
                    : wizard.step === 2
                      ? "comments"
                      : "accessibility"
                }
                value={wizard.settings}
                disabled={busy}
                onChange={wizard.changeSettings}
              />
            )}
            {wizard.step === 4 && (
              <Stack gap="6">
                <Text color="gray.600" role="status">
                  {data.personas.length === 0
                    ? "No personas yet. Choose a recommendation below or create your own."
                    : `${data.personas.filter((persona) => !persona.archivedAt).length} active personas in your workspace.`}
                </Text>
                <PersonaRecommendations
                  apiPath={apiPath}
                  personas={data.personas}
                  onRefresh={onRefresh}
                  onBusyChange={setSavingDetails}
                />
                <PersonaManager
                  onBusyChange={setSavingDetails}
                  apiPath={apiPath}
                  personas={data.personas}
                  canEdit
                  canManageCredentials
                  onRefresh={onRefresh}
                />
              </Stack>
            )}
            {wizard.step === 5 && data.accessSettings && (
              <UsersRoleManager
                onBusyChange={setSavingDetails}
                apiPath={apiPath}
                basePath={basePath}
                memberships={data.memberships}
                settings={data.accessSettings}
                onRefresh={onRefresh}
              />
            )}
          </Box>
          {wizard.error && (
            <Text role="alert" color="red.700">
              {wizard.error}
            </Text>
          )}
          <Separator />
          <Flex gap="3" wrap="wrap" justify="space-between">
            <Button
              variant="outline"
              disabled={busy || wizard.step === 0}
              onClick={() => wizard.navigate(wizard.step - 1)}
            >
              Back
            </Button>
            <Flex gap="3" wrap="wrap">
              {wizard.progress.step >= 1 && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void wizard.save(true)}
                >
                  Skip remaining steps
                </Button>
              )}
              <Button
                colorPalette="blue"
                loading={wizard.busy}
                disabled={savingDetails}
                type={wizard.step === 0 ? "submit" : "button"}
                form={wizard.step === 0 ? "revisionlab-setup-step" : undefined}
                onClick={
                  wizard.step === 0 ? undefined : () => void wizard.save()
                }
              >
                {wizard.step === 5 ? "Finish setup" : "Save and continue"}
              </Button>
            </Flex>
          </Flex>
        </Stack>
        <Text color="gray.600" fontSize="sm">
          Saved steps are kept if you leave. You can change these choices later
          in your workspace.
        </Text>
      </Stack>
    </Box>
  );
}
