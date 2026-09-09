"use client";

import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import {
  Bell,
  Boxes,
  ChevronDown,
  CircleUserRound,
  Clock3,
  FolderKanban,
  GitCompareArrows,
  History,
  LockKeyhole,
  Menu,
  Monitor,
  Network,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AppView, Project, Prototype, PrototypeImportInput } from "@/lib/types";
import { projects as initialProjects, prototypes as initialPrototypes } from "@/lib/demo-data";
import { createPrototypeConfiguration, deriveProjectBuildState } from "@/lib/project-import";
import { DashboardView } from "@/components/views/dashboard-view";
import { ProjectsView } from "@/components/views/projects-view";
import { NewProjectView } from "@/components/views/new-project-view";
import { OverviewView } from "@/components/views/overview-view";
import { PreviewView } from "@/components/views/preview-view";
import { FlowsView } from "@/components/views/flows-view";
import { HistoryView } from "@/components/views/history-view";
import { AccessView } from "@/components/views/access-view";
import { AccountView } from "@/components/views/account-view";

const prototypeNavItems: { id: AppView; label: string; icon: typeof FolderKanban }[] = [
  { id: "overview", label: "Overview", icon: Boxes },
  { id: "preview", label: "Preview", icon: Monitor },
  { id: "flows", label: "Saved flows", icon: Workflow },
  { id: "history", label: "History", icon: History },
  { id: "compare", label: "Compare", icon: GitCompareArrows },
  { id: "access", label: "Access", icon: UsersRound },
];

export function RevisionLabApp() {
  const [view, setView] = useState<AppView>("dashboard");
  const [projectRecords, setProjectRecords] = useState<Project[]>(initialProjects);
  const [prototypeRecords, setPrototypeRecords] = useState<Prototype[]>(initialPrototypes);
  const [selectedProject, setSelectedProject] = useState<Project>(initialProjects[0]);
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>(initialPrototypes[0]);
  const [importTargetProject, setImportTargetProject] = useState<Project | undefined>();
  const [query, setQuery] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [announcement, setAnnouncement] = useState("Project catalogue loaded");
  const mainRef = useRef<HTMLDivElement | null>(null);
  const focusNextView = useRef(false);

  const projectsWithBuildState = useMemo(() => projectRecords.map((project) => ({
    ...project,
    buildState: deriveProjectBuildState(prototypeRecords.filter((prototype) => prototype.projectId === project.id)),
  })), [projectRecords, prototypeRecords]);
  const selectedProjectWithBuildState = useMemo(() => ({
    ...selectedProject,
    buildState: deriveProjectBuildState(prototypeRecords.filter((prototype) => prototype.projectId === selectedProject.id)),
  }), [selectedProject, prototypeRecords]);

  useEffect(() => {
    if (!focusNextView.current) return;
    focusNextView.current = false;
    window.requestAnimationFrame(() => mainRef.current?.querySelector<HTMLElement>("h1")?.focus());
  }, [view]);

  const navigate = (next: AppView, message?: string) => {
    focusNextView.current = true;
    setView(next);
    setMobileMenu(false);
    setAnnouncement(message ?? `${next.charAt(0).toUpperCase()}${next.slice(1)} view opened`);
  };

  const choosePrototype = (prototype: Prototype, destination: AppView = "overview") => {
    setSelectedPrototype(prototype);
    navigate(destination, `${prototype.name} opened`);
  };

  const chooseProject = (project: Project) => {
    setSelectedProject(project);
    const firstPrototype = prototypeRecords.find((prototype) => prototype.projectId === project.id);
    if (firstPrototype) setSelectedPrototype(firstPrototype);
    navigate("project", `${project.name} opened`);
  };

  const startNewProject = () => {
    setImportTargetProject(undefined);
    navigate("new-project", "New project configuration opened");
  };

  const startNewPrototype = () => {
    setImportTargetProject(selectedProject);
    navigate("new-project", `Add prototype to ${selectedProject.name}`);
  };

  const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";

  const completeImport = (input: PrototypeImportInput, existingProject?: Project) => {
    const basePrototypeId = slugify(input.prototype.name);
    const prototypeId = prototypeRecords.some((prototype) => prototype.id === basePrototypeId) ? `${basePrototypeId}-${Date.now()}` : basePrototypeId;
    const projectId = existingProject?.id ?? slugify(input.project?.name ?? "project");
    const newPrototype: Prototype = {
      id: prototypeId,
      projectId,
      name: input.prototype.name,
      description: `${input.prototype.framework} prototype imported from ${input.prototype.rootDirectory}.`,
      rootDirectory: input.prototype.rootDirectory,
      framework: input.prototype.framework,
      ...createPrototypeConfiguration(input.prototype),
      screenNames: ["Entry", "Review", "Complete"],
      screens: 3,
      flows: 0,
      version: "Not built",
      updated: "Saved now",
      role: "Owner",
      privacy: "Private",
      replay: "not-run",
      members: ["JD"],
    };

    setPrototypeRecords((current) => [...current, newPrototype]);
    setSelectedPrototype(newPrototype);

    if (existingProject) {
      const updatedProject: Project = {
        ...existingProject,
        prototypeIds: [...existingProject.prototypeIds, prototypeId],
        lastBuild: "Prototype configuration saved now",
      };
      setProjectRecords((current) => current.map((project) => project.id === existingProject.id ? updatedProject : project));
      setSelectedProject(updatedProject);
      navigate("project", `${input.prototype.name} added. Runner connection is still required.`);
      return;
    }

    const newProject: Project = {
      id: projectId,
      name: input.project?.name ?? "Untitled project",
      description: input.project?.description ?? "Imported prototype project.",
      repository: input.project?.repository ?? "Repository not configured",
      branch: input.project?.branch ?? "main",
      provider: "GitHub",
      role: "Owner",
      members: ["JD"],
      prototypeIds: [prototypeId],
      environmentVariables: input.project?.environmentVariables ?? [],
      buildState: "awaiting-runner",
      lastBuild: "Configuration saved now",
    };
    setProjectRecords((current) => [...current, newProject]);
    setSelectedProject(newProject);
    navigate("project", `${newProject.name} created locally. Runner connection is still required.`);
  };

  const renderView = () => {
    switch (view) {
      case "dashboard":
        return <ProjectsView projects={projectsWithBuildState} query={query} onSelect={chooseProject} onNewProject={startNewProject} />;
      case "project":
        return <DashboardView project={selectedProjectWithBuildState} prototypes={prototypeRecords.filter((prototype) => prototype.projectId === selectedProject.id)} query={query} onSelect={choosePrototype} onNavigate={navigate} onBack={() => navigate("dashboard")} onNewPrototype={startNewPrototype} />;
      case "new-project":
        return <NewProjectView existingProject={importTargetProject} onCancel={() => navigate(importTargetProject ? "project" : "dashboard")} onComplete={completeImport} announce={setAnnouncement} />;
      case "overview":
        return <OverviewView prototype={selectedPrototype} onNavigate={navigate} />;
      case "preview":
        return <PreviewView prototype={selectedPrototype} onNavigate={navigate} announce={setAnnouncement} />;
      case "flows":
        return <FlowsView prototype={selectedPrototype} onNavigate={navigate} announce={setAnnouncement} />;
      case "history":
      case "compare":
        return <HistoryView prototype={selectedPrototype} mode={view} onNavigate={navigate} />;
      case "access":
        return <AccessView prototype={selectedPrototype} onNavigate={navigate} announce={setAnnouncement} />;
      case "account":
        return <AccountView onNavigate={navigate} announce={setAnnouncement} />;
    }
  };

  return (
    <Box className="app-frame">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Box className="sidebar" as="aside" aria-label="Primary navigation">
        <button className="wordmark" onClick={() => navigate("dashboard")} aria-label="RevisionLab, open projects">
          <Network size={23} strokeWidth={2.25} aria-hidden="true" />
          <span>RevisionLab</span>
        </button>
        <nav className="side-nav">
          <button className={["dashboard", "project", "new-project"].includes(view) ? "side-nav__item is-active" : "side-nav__item"} onClick={() => navigate("dashboard")} aria-current={view === "dashboard" ? "page" : undefined}>
            <FolderKanban size={19} aria-hidden="true" />
            <span>Projects</span>
          </button>
          {!['dashboard', 'new-project'].includes(view) ? <>
            <button className="project-context-link" onClick={() => navigate("project")}>
              <span>Current project</span>
              <strong>{selectedProject.name}</strong>
            </button>
            <Text className="side-nav__label">{selectedPrototype.name}</Text>
          </> : null}
          {!['dashboard', 'new-project'].includes(view) ? prototypeNavItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} className={active ? "side-nav__item is-active" : "side-nav__item"} onClick={() => navigate(item.id)} aria-current={active ? "page" : undefined}>
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          }) : null}
        </nav>
        <Box className="sidebar__session">
          <Flex align="center" gap="2" color="var(--health)">
            <ShieldCheck size={17} aria-hidden="true" />
            <Text fontSize="sm" fontWeight="700">Secure session</Text>
          </Flex>
          <Text mt="3" fontSize="sm" color="white">Jamie Diaz</Text>
          <Text fontSize="xs" color="var(--rail-muted)">Owner · active now</Text>
          <button className="account-link" onClick={() => navigate("account")}>
            <CircleUserRound size={17} aria-hidden="true" />
            Account settings
          </button>
        </Box>
      </Box>

      <Box className="workspace">
        <Flex className="topbar" as="header" align="center" justify="space-between" gap="4">
          <Flex className="search-shell" align="center">
            <Search size={17} aria-hidden="true" />
            <Input
              aria-label="Search projects, prototypes, and flows"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workspace"
              variant="subtle"
            />
            {query ? (
              <button aria-label="Clear search" className="search-clear" onClick={() => setQuery("")}>
                <X size={15} />
              </button>
            ) : (
              <kbd>/</kbd>
            )}
          </Flex>
          <Flex align="center" gap="2">
            <Button className="topbar-icon" aria-label="Notifications" onClick={() => setAnnouncement("No new notifications")}>
              <Bell size={18} />
              <Box className="notification-dot" aria-hidden="true" />
            </Button>
            <button className="profile-button" onClick={() => navigate("account")} aria-label="Open account settings">
              <span>JD</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            <button className="mobile-menu-button" onClick={() => setMobileMenu((open) => !open)} aria-label={mobileMenu ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenu}>
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </Flex>
        </Flex>

        {mobileMenu ? (
          <nav className="mobile-menu" aria-label="Mobile navigation">
            <button onClick={() => navigate("dashboard")}><FolderKanban size={18} /> Projects</button>
            {!['dashboard', 'new-project'].includes(view) ? prototypeNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => navigate(item.id)}>
                  <Icon size={18} /> {item.label}
                </button>
              );
            }) : null}
            <button onClick={() => navigate("account")}><Settings size={18} /> Account</button>
          </nav>
        ) : null}

        <Box as="main" className="main-content" id="main-content" ref={mainRef}>
          {renderView()}
        </Box>

        <nav className="mobile-bottom-nav" aria-label="Quick navigation">
          <button className={view === "dashboard" ? "is-active" : ""} onClick={() => navigate("dashboard")}><FolderKanban size={18} /><span>Projects</span></button>
          <button className={view === "project" ? "is-active" : ""} onClick={() => navigate("project")}><Boxes size={18} /><span>Project</span></button>
          <button className={["overview", "preview"].includes(view) ? "is-active" : ""} onClick={() => navigate("preview")}><Monitor size={18} /><span>Preview</span></button>
          <button className={view === "account" ? "is-active" : ""} onClick={() => navigate("account")}><CircleUserRound size={18} /><span>Account</span></button>
        </nav>

        <Flex className="health-strip" as="footer" align="center" justify="space-between" gap="4">
          <Flex align="center" gap="3" minW="0">
            <Box className="health-beacon" aria-hidden="true" />
            <Text fontSize="sm" fontWeight="700" whiteSpace="nowrap">All local systems operational</Text>
            <Box className="health-detail"><span>UI online</span><span>Recorder ready</span><span>Demo storage local</span></Box>
          </Flex>
          <Flex align="center" gap="2" color="var(--muted)" fontSize="xs" whiteSpace="nowrap">
            <Clock3 size={13} /> Checked now
          </Flex>
        </Flex>
      </Box>

      <Box className="sr-only" role="status" aria-live="polite">{announcement}</Box>
    </Box>
  );
}
