"use client";

import { Box, Button, Flex, Heading, Input, Text, Textarea } from "@chakra-ui/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Code2,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ServerCog,
  Trash2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { DemoDataNote, PageHeader, StatusChip } from "@/components/shared";
import { isGitHubRepositoryUrl, isPublicClientVariable, isSafeRepositoryRoot, isValidEnvironmentKey, normalizeRepositoryLabel, partitionEnvironmentVariables } from "@/lib/project-import";
import type { EnvironmentVariableMeta, Project, PrototypeImportInput } from "@/lib/types";

type NewProjectViewProps = {
  existingProject?: Project;
  onCancel: () => void;
  onComplete: (input: PrototypeImportInput, existingProject?: Project) => void;
  announce: (message: string) => void;
};

type EnvDraft = EnvironmentVariableMeta & { value: string; revealed: boolean; scope: "project" | "prototype" };
type ErrorMap = Record<string, string>;

const projectSteps = ["Project", "Source", "Prototype", "Environment", "Review"] as const;
const prototypeSteps = ["Prototype", "Environment", "Review"] as const;

const commandPresets: Record<string, { install: string; build: string; start: string }> = {
  "Auto-detect": { install: "pnpm install --frozen-lockfile", build: "pnpm build", start: "pnpm start" },
  "Next.js": { install: "pnpm install --frozen-lockfile", build: "pnpm build", start: "pnpm start" },
  "React + Vite": { install: "pnpm install --frozen-lockfile", build: "pnpm build", start: "pnpm preview --host 0.0.0.0" },
  Angular: { install: "npm ci", build: "npm run build", start: "npm run start -- --host 0.0.0.0" },
  Vue: { install: "pnpm install --frozen-lockfile", build: "pnpm build", start: "pnpm preview --host 0.0.0.0" },
  SvelteKit: { install: "pnpm install --frozen-lockfile", build: "pnpm build", start: "pnpm start" },
  Astro: { install: "pnpm install --frozen-lockfile", build: "pnpm build", start: "pnpm preview --host 0.0.0.0" },
  "Other Node HTTP": { install: "npm ci", build: "npm run build", start: "npm start" },
};

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return <Text id={id} className="field-error"><CircleAlert size={14} aria-hidden="true" /> {children}</Text>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex className="import-summary-row" justify="space-between" gap="5">
      <Text color="var(--muted)" fontSize="sm">{label}</Text>
      <Text fontWeight="650" fontSize="sm" textAlign="right">{value}</Text>
    </Flex>
  );
}

export function NewProjectView({ existingProject, onCancel, onComplete, announce }: NewProjectViewProps) {
  const steps = existingProject ? prototypeSteps : projectSteps;
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [repository, setRepository] = useState("https://github.com/");
  const [branch, setBranch] = useState("main");
  const [prototypeName, setPrototypeName] = useState("");
  const [rootDirectory, setRootDirectory] = useState(".");
  const [framework, setFramework] = useState("Auto-detect");
  const [installCommand, setInstallCommand] = useState(commandPresets["Auto-detect"].install);
  const [buildCommand, setBuildCommand] = useState(commandPresets["Auto-detect"].build);
  const [startCommand, setStartCommand] = useState(commandPresets["Auto-detect"].start);
  const [port, setPort] = useState("3000");
  const [healthPath, setHealthPath] = useState("/");
  const [environmentVariables, setEnvironmentVariables] = useState<EnvDraft[]>([]);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const activeStep = steps[stepIndex];
  const modeLabel = existingProject ? "Add prototype" : "New project";

  const repositoryLabel = useMemo(() => {
    const source = existingProject?.repository ?? repository;
    return normalizeRepositoryLabel(source);
  }, [existingProject, repository]);

  const changeFramework = (next: string) => {
    const preset = commandPresets[next];
    setFramework(next);
    setInstallCommand(preset.install);
    setBuildCommand(preset.build);
    setStartCommand(preset.start);
  };

  const addEnvironmentVariable = () => {
    const next: EnvDraft = {
      id: `env-${Date.now()}`,
      key: "",
      value: "",
      secret: true,
      phase: "runtime",
      target: "both",
      revealed: false,
      scope: "prototype",
    };
    setEnvironmentVariables((current) => [...current, next]);
    announce("Environment variable row added");
  };

  const updateEnvironmentVariable = <K extends keyof EnvDraft>(id: string, field: K, value: EnvDraft[K]) => {
    setEnvironmentVariables((current) => current.map((entry) => entry.id === id ? { ...entry, [field]: value } : entry));
  };

  const removeEnvironmentVariable = (id: string) => {
    setEnvironmentVariables((current) => current.filter((entry) => entry.id !== id));
    announce("Environment variable removed");
  };

  const validateStep = (step: typeof activeStep) => {
    const nextErrors: ErrorMap = {};
    if (step === "Project" && !projectName.trim()) nextErrors.projectName = "Enter a project name.";
    if (step === "Source") {
      if (!isGitHubRepositoryUrl(repository)) nextErrors.repository = "Enter a complete GitHub HTTPS repository URL.";
      if (!branch.trim()) nextErrors.branch = "Enter a branch name.";
    }
    if (step === "Prototype") {
      if (!prototypeName.trim()) nextErrors.prototypeName = "Enter a prototype name.";
      if (!isSafeRepositoryRoot(rootDirectory)) nextErrors.rootDirectory = "Use a repository-relative directory without ‘..’.";
      if (!installCommand.trim()) nextErrors.installCommand = "Enter an install command.";
      if (!buildCommand.trim()) nextErrors.buildCommand = "Enter a build command.";
      if (!startCommand.trim()) nextErrors.startCommand = "Enter a start command.";
      const portNumber = Number(port);
      if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) nextErrors.port = "Enter a port from 1 to 65535.";
      if (!healthPath.startsWith("/")) nextErrors.healthPath = "Health paths must start with ‘/’.";
    }
    if (step === "Environment") {
      const seen = new Set<string>();
      environmentVariables.forEach((entry) => {
        const key = entry.key.trim();
        if (!isValidEnvironmentKey(key)) nextErrors[`env-${entry.id}`] = "Use uppercase letters, numbers, and underscores.";
        else if (seen.has(key)) nextErrors[`env-${entry.id}`] = "Variable names must be unique.";
        else seen.add(key);
        if (!entry.value) nextErrors[`value-${entry.id}`] = "Enter a value or remove this row.";
      });
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      announce("Resolve the highlighted fields before continuing");
      window.requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(activeStep)) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    setErrors({});
    announce(`${steps[Math.min(stepIndex + 1, steps.length - 1)]} step opened`);
    window.requestAnimationFrame(() => firstFieldRef.current?.focus());
  };

  const previousStep = () => {
    if (stepIndex === 0) return onCancel();
    setStepIndex((current) => current - 1);
    setErrors({});
  };

  const finishImport = () => {
    const safeMetadata = partitionEnvironmentVariables(environmentVariables);
    setEnvironmentVariables((current) => current.map((entry) => ({ ...entry, value: "" })));
    onComplete({
      project: existingProject ? undefined : {
        name: projectName.trim(),
        description: projectDescription.trim() || "Imported prototype project.",
        repository: repositoryLabel,
        branch: branch.trim(),
        environmentVariables: safeMetadata.project,
      },
      prototype: {
        name: prototypeName.trim(),
        rootDirectory: rootDirectory.trim(),
        framework,
        installCommand: installCommand.trim(),
        buildCommand: buildCommand.trim(),
        startCommand: startCommand.trim(),
        port: Number(port),
        healthPath: healthPath.trim(),
        environmentVariables: safeMetadata.prototype,
      },
    }, existingProject);
  };

  return (
    <Box className="view-stack import-view">
      <PageHeader
        title={modeLabel}
        description={existingProject ? `Configure another runnable prototype inside ${existingProject.name}.` : "Connect a repository and define its first runnable prototype."}
        onBack={onCancel}
      />
      <DemoDataNote />

      <Box className="import-shell">
        <Box className="import-stepper" as="nav" aria-label="Import progress">
          <Text className="section-label">Configuration route</Text>
          <Box as="ol">
            {steps.map((step, index) => (
              <li key={step} className={index === stepIndex ? "is-current" : index < stepIndex ? "is-complete" : ""}>
                <button type="button" onClick={() => index < stepIndex && setStepIndex(index)} disabled={index > stepIndex} aria-current={index === stepIndex ? "step" : undefined}>
                  <span>{index < stepIndex ? <Check size={14} /> : index + 1}</span>
                  <Box textAlign="left">
                    <Text fontWeight="700" fontSize="sm">{step}</Text>
                    <Text fontSize="xs">{index < stepIndex ? "Configured" : index === stepIndex ? "In progress" : "Pending"}</Text>
                  </Box>
                </button>
              </li>
            ))}
          </Box>
          <Box className="import-safety-note">
            <ServerCog size={17} aria-hidden="true" />
            <Text fontSize="xs">Repository commands must run in the isolated runner, never in the RevisionLab web process.</Text>
          </Box>
        </Box>

        <Box className="import-workspace">
          <Flex className="import-workspace__heading" justify="space-between" align="flex-start" gap="4">
            <Box>
              <Text className="section-label">{modeLabel} · {stepIndex + 1} of {steps.length}</Text>
              <Heading as="h2" fontSize="xl" mt="2">{activeStep}</Heading>
            </Box>
            <StatusChip tone={activeStep === "Review" ? "healthy" : "neutral"}>{activeStep === "Review" ? "Ready to save" : "Draft"}</StatusChip>
          </Flex>

          {activeStep === "Project" ? (
            <Box className="import-form-section">
              <Text color="var(--muted)" maxW="66ch">A project owns one source repository, shared members, and environment configuration. It can contain several independently runnable prototypes.</Text>
              <Box className="field-grid field-grid--single">
                <label>Project name<Input ref={firstFieldRef} value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Commerce platform" aria-invalid={Boolean(errors.projectName)} aria-describedby={errors.projectName ? "project-name-error" : undefined} /><FieldError id="project-name-error">{errors.projectName}</FieldError></label>
                <label>Description <span>Optional</span><Textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} placeholder="What this repository and its prototypes are for" /></label>
              </Box>
            </Box>
          ) : null}

          {activeStep === "Source" ? (
            <Box className="import-form-section">
              <Flex className="source-method" align="center" justify="space-between" gap="4">
                <Flex gap="3" align="center"><Code2 size={22} aria-hidden="true" /><Box><Text fontWeight="720">GitHub repository</Text><Text color="var(--muted)" fontSize="sm">GitHub App · selected repository access</Text></Box></Flex>
                <StatusChip tone="attention">Connector required</StatusChip>
              </Flex>
              <Text className="integration-boundary"><CircleAlert size={16} /> This UI prepares the import. Remote cloning remains unavailable until the GitHub App and isolated runner are connected.</Text>
              <Box className="field-grid">
                <label>Repository URL<Input ref={firstFieldRef} value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="https://github.com/organisation/repository" aria-invalid={Boolean(errors.repository)} aria-describedby={errors.repository ? "repository-error" : undefined} /><FieldError id="repository-error">{errors.repository}</FieldError></label>
                <label>Default branch<Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" aria-invalid={Boolean(errors.branch)} aria-describedby={errors.branch ? "branch-error" : undefined} /><FieldError id="branch-error">{errors.branch}</FieldError></label>
              </Box>
            </Box>
          ) : null}

          {activeStep === "Prototype" ? (
            <Box className="import-form-section">
              {existingProject ? <Text className="source-context"><Code2 size={15} /> {existingProject.repository} · {existingProject.branch}</Text> : null}
              <Text color="var(--muted)" maxW="66ch">A prototype is any Node-based web application that installs, builds, starts an HTTP server on the configured port, and answers its health check.</Text>
              <Box className="field-grid">
                <label>Prototype name<Input ref={firstFieldRef} value={prototypeName} onChange={(event) => setPrototypeName(event.target.value)} placeholder="Checkout service" aria-invalid={Boolean(errors.prototypeName)} aria-describedby={errors.prototypeName ? "prototype-name-error" : undefined} /><FieldError id="prototype-name-error">{errors.prototypeName}</FieldError></label>
                <label>Root directory<Input value={rootDirectory} onChange={(event) => setRootDirectory(event.target.value)} placeholder="apps/checkout" aria-invalid={Boolean(errors.rootDirectory)} aria-describedby={errors.rootDirectory ? "root-directory-error" : undefined} /><FieldError id="root-directory-error">{errors.rootDirectory}</FieldError></label>
                <label>Framework preset<select value={framework} onChange={(event) => changeFramework(event.target.value)}>{Object.keys(commandPresets).map((name) => <option key={name}>{name}</option>)}</select></label>
                <label>Application port<Input inputMode="numeric" value={port} onChange={(event) => setPort(event.target.value)} aria-invalid={Boolean(errors.port)} aria-describedby={errors.port ? "port-error" : undefined} /><FieldError id="port-error">{errors.port}</FieldError></label>
                <label className="field-grid__wide">Install command<Input value={installCommand} onChange={(event) => setInstallCommand(event.target.value)} aria-invalid={Boolean(errors.installCommand)} aria-describedby={errors.installCommand ? "install-command-error" : undefined} /><FieldError id="install-command-error">{errors.installCommand}</FieldError></label>
                <label className="field-grid__wide">Build command<Input value={buildCommand} onChange={(event) => setBuildCommand(event.target.value)} aria-invalid={Boolean(errors.buildCommand)} aria-describedby={errors.buildCommand ? "build-command-error" : undefined} /><FieldError id="build-command-error">{errors.buildCommand}</FieldError></label>
                <label className="field-grid__wide">Start command<Input value={startCommand} onChange={(event) => setStartCommand(event.target.value)} aria-invalid={Boolean(errors.startCommand)} aria-describedby={errors.startCommand ? "start-command-error" : undefined} /><FieldError id="start-command-error">{errors.startCommand}</FieldError></label>
                <label>Health-check path<Input value={healthPath} onChange={(event) => setHealthPath(event.target.value)} aria-invalid={Boolean(errors.healthPath)} aria-describedby={errors.healthPath ? "health-path-error" : undefined} /><FieldError id="health-path-error">{errors.healthPath}</FieldError></label>
              </Box>
            </Box>
          ) : null}

          {activeStep === "Environment" ? (
            <Box className="import-form-section">
              <Flex justify="space-between" align="flex-start" gap="4" wrap="wrap">
                <Box><Text fontWeight="720">Advanced environment variables</Text><Text color="var(--muted)" fontSize="sm" maxW="62ch">Optional variables can be scoped by lifecycle and task. Secret values stay only in this form and are discarded when this local demo saves the import metadata.</Text></Box>
                <Button className="secondary-button" onClick={addEnvironmentVariable}><Plus size={16} /> Add variable</Button>
              </Flex>
              {environmentVariables.length === 0 ? (
                <Box className="env-empty"><KeyRound size={21} /><Text fontWeight="700">No environment variables</Text><Text color="var(--muted)" fontSize="sm">Most prototypes should start without them. Add only what the preview actually needs.</Text></Box>
              ) : (
                <Box className="env-list">
                  {environmentVariables.map((entry, index) => {
                    const isPublic = isPublicClientVariable(entry.key);
                    return (
                      <Box className="env-row" key={entry.id}>
                        <Flex className="env-row__heading" align="center" justify="space-between"><Text fontWeight="720" fontSize="sm">Variable {index + 1}</Text><Button className="icon-button subtle-button" aria-label={`Remove environment variable ${index + 1}`} onClick={() => removeEnvironmentVariable(entry.id)}><Trash2 size={16} /></Button></Flex>
                        <Box className={`env-row__fields${existingProject ? "" : " has-ownership"}`}>
                          <label>Name<Input value={entry.key} onChange={(event) => updateEnvironmentVariable(entry.id, "key", event.target.value.toUpperCase())} placeholder="PREVIEW_API_URL" aria-invalid={Boolean(errors[`env-${entry.id}`])} aria-describedby={errors[`env-${entry.id}`] ? `env-${entry.id}-error` : undefined} /><FieldError id={`env-${entry.id}-error`}>{errors[`env-${entry.id}`]}</FieldError></label>
                          <label>Value<Box className="secret-input"><Input type={entry.secret && !entry.revealed ? "password" : "text"} value={entry.value} onChange={(event) => updateEnvironmentVariable(entry.id, "value", event.target.value)} placeholder={entry.secret ? "Secret value" : "Value"} aria-invalid={Boolean(errors[`value-${entry.id}`])} aria-describedby={errors[`value-${entry.id}`] ? `value-${entry.id}-error` : undefined} />{entry.secret ? <button type="button" onClick={() => updateEnvironmentVariable(entry.id, "revealed", !entry.revealed)} aria-label={entry.revealed ? "Hide secret value" : "Show secret value"}>{entry.revealed ? <EyeOff size={16} /> : <Eye size={16} />}</button> : null}</Box><FieldError id={`value-${entry.id}-error`}>{errors[`value-${entry.id}`]}</FieldError></label>
                          <label>Protection<select value={entry.secret ? "secret" : "plain"} onChange={(event) => updateEnvironmentVariable(entry.id, "secret", event.target.value === "secret")}><option value="secret">Encrypted secret</option><option value="plain">Plain configuration</option></select></label>
                          <label>Lifecycle<select value={entry.phase} onChange={(event) => updateEnvironmentVariable(entry.id, "phase", event.target.value as EnvDraft["phase"])}><option value="runtime">Runtime</option><option value="build">Build time</option></select></label>
                          <label>Used by<select value={entry.target} onChange={(event) => updateEnvironmentVariable(entry.id, "target", event.target.value as EnvDraft["target"])}><option value="both">Preview and replay</option><option value="preview">Preview only</option><option value="replay">Replay only</option></select></label>
                          {!existingProject ? <label>Ownership<select value={entry.scope} onChange={(event) => updateEnvironmentVariable(entry.id, "scope", event.target.value as EnvDraft["scope"])}><option value="prototype">This prototype</option><option value="project">Project default</option></select></label> : null}
                        </Box>
                        {isPublic ? <Text className="public-env-warning"><CircleAlert size={14} /> This prefix is commonly bundled into browser code. Treat the value as public.</Text> : null}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          ) : null}

          {activeStep === "Review" ? (
            <Box className="import-review">
              <Box className="import-review__summary">
                <Heading as="h3" fontSize="md">Import configuration</Heading>
                {!existingProject ? <><SummaryRow label="Project" value={projectName} /><SummaryRow label="Repository" value={repositoryLabel} /><SummaryRow label="Branch" value={branch} /></> : <SummaryRow label="Project" value={existingProject.name} />}
                <SummaryRow label="Prototype" value={prototypeName} />
                <SummaryRow label="Root" value={rootDirectory} />
                <SummaryRow label="Framework" value={framework} />
                <SummaryRow label="Install" value={installCommand} />
                <SummaryRow label="Build" value={buildCommand} />
                <SummaryRow label="Start" value={startCommand} />
                <SummaryRow label="Health" value={`:${port}${healthPath}`} />
                <Box className="import-env-summary">
                  <Text color="var(--muted)" fontSize="sm">Environment</Text>
                  {environmentVariables.length === 0 ? <Text fontWeight="650" fontSize="sm">No variables</Text> : (
                    <Box as="ul">
                      {environmentVariables.map((entry) => (
                        <li key={entry.id}>
                          <Text as="code">{entry.key}</Text>
                          <Text>{entry.secret ? "Encrypted secret" : "Plain configuration"} · {entry.phase === "build" ? "Build time" : "Runtime"} · {entry.target === "both" ? "Preview and replay" : entry.target === "preview" ? "Preview only" : "Replay only"}{existingProject ? "" : ` · ${entry.scope === "project" ? "Project default" : "This prototype"}`}</Text>
                        </li>
                      ))}
                    </Box>
                  )}
                  <Text className="import-env-summary__note">Values are never included in this summary and are discarded when the local configuration is saved.</Text>
                </Box>
              </Box>
              <Box className="execution-route">
                <Heading as="h3" fontSize="md">Execution route</Heading>
                <Box as="ol">
                  {["Save private configuration", "Request scoped repository token", "Clone fixed commit", "Build isolated OCI image", "Launch protected preview"].map((item, index) => (
                    <li key={item} className={index === 0 ? "is-ready" : ""}>
                      <span>{index + 1}</span>
                      <Box>
                        <Text fontWeight="680" fontSize="sm">{item}</Text>
                        <Text color="var(--muted)" fontSize="xs">
                          {index === 0 ? "Available in this UI slice" : "Requires the runner service"}
                        </Text>
                      </Box>
                    </li>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : null}

          <Flex className="import-actions" justify="space-between" align="center" gap="4">
            <Button className="secondary-button" onClick={previousStep}><ArrowLeft size={16} /> {stepIndex === 0 ? "Cancel" : "Back"}</Button>
            {activeStep === "Review" ? (
              <Button className="primary-button" onClick={finishImport}><Check size={17} /> {existingProject ? "Add prototype" : "Create project"}</Button>
            ) : (
              <Button className="primary-button" onClick={nextStep}>Continue <ArrowRight size={16} /></Button>
            )}
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
