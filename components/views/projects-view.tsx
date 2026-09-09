"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import {
  ArrowUpRight,
  Boxes,
  Code2,
  GitBranch,
  KeyRound,
  PlayCircle,
  Plus,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { DemoDataNote, EmptyState, PageHeader, StatusChip } from "@/components/shared";
import type { Project } from "@/lib/types";

type ProjectsViewProps = {
  projects: Project[];
  query: string;
  onSelect: (project: Project) => void;
  onNewProject: () => void;
};

function ProjectStation({ icon: Icon, label, value, tone }: { icon: typeof Code2; label: string; value: string; tone?: "healthy" | "attention" }) {
  return (
    <Box className="route-station project-station">
      <Box className={`route-station__node${tone ? ` is-${tone}` : ""}`} aria-hidden="true">
        <Icon size={15} strokeWidth={2.2} />
      </Box>
      <Text className="route-station__label">{label}</Text>
      <Text className="route-station__value">{value}</Text>
    </Box>
  );
}

function ProjectRow({ project, onSelect }: { project: Project; onSelect: () => void }) {
  const buildTone = project.buildState === "ready" ? "healthy" : "attention";
  const buildLabel = project.buildState === "ready" ? "Ready" : project.buildState === "attention" ? "Attention" : "Runner needed";

  return (
    <Box className="project-row">
      <Box className="project-row__summary">
        <button className="project-name" onClick={onSelect}>
          <Box textAlign="left" minW="0">
            <Text fontWeight="760" truncate>{project.name}</Text>
            <Text color="var(--muted)" fontSize="xs" truncate>{project.lastBuild} · {project.role}</Text>
          </Box>
        </button>

        <Box className="route-scroll">
          <Box className="route-track project-route-track">
            <ProjectStation icon={Code2} label="Source" value={project.repository.replace("github.com/", "")} />
            <ProjectStation icon={GitBranch} label="Branch" value={project.branch} />
            <ProjectStation icon={Boxes} label="Prototypes" value={`${project.prototypeIds.length} configured`} />
            <ProjectStation icon={PlayCircle} label="Build" value={buildLabel} tone={buildTone} />
            <ProjectStation icon={KeyRound} label="Environment" value={`${project.environmentVariables.length} defaults`} />
            <ProjectStation icon={UsersRound} label="Members" value={project.members.join(" · ")} />
          </Box>
        </Box>

        <Flex gap="1" justify="flex-end" align="center">
          {project.buildState === "awaiting-runner" ? <StatusChip tone="attention">Draft</StatusChip> : null}
          <Button className="row-open-button" onClick={onSelect} aria-label={`Open ${project.name}`}>
            <ArrowUpRight size={16} /> <span>Open</span>
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}

export function ProjectsView({ projects, query, onSelect, onNewProject }: ProjectsViewProps) {
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) => `${project.name} ${project.description} ${project.repository}`.toLowerCase().includes(term));
  }, [projects, query]);

  return (
    <Box className="view-stack">
      <PageHeader
        title="Project control"
        description="Connect a repository, organise its prototypes, and inspect every build route from one place."
        action={<Button className="primary-button" onClick={onNewProject}><Plus size={17} /> New project</Button>}
      />
      <DemoDataNote />

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching projects"
          description={`Nothing in this workspace matches “${query}”. Create a project to connect a repository and configure its first prototype.`}
          actionLabel="New project"
          onAction={onNewProject}
        />
      ) : (
        <Box className="project-table">
          <Box className="project-table__header" aria-hidden="true">
            <span>Project</span><span>Repository route</span><span>Actions</span>
          </Box>
          {filtered.map((project) => <ProjectRow key={project.id} project={project} onSelect={() => onSelect(project)} />)}
        </Box>
      )}

      <Flex className="project-boundary-note" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="4">
        <Box>
          <Text fontWeight="720">One repository, several prototypes</Text>
          <Text color="var(--muted)" fontSize="sm" maxW="70ch">Projects own source access and shared configuration. Each prototype selects a runnable root, then keeps its own flows, history, comparisons, and access rules.</Text>
        </Box>
        <StatusChip tone="neutral">GitHub first</StatusChip>
      </Flex>
    </Box>
  );
}
