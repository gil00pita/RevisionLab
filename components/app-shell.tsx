"use client";

import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import {
  Bell,
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
import { useEffect, useRef, useState } from "react";
import type { AppView, Prototype } from "@/lib/types";
import { prototypes } from "@/lib/demo-data";
import { DashboardView } from "@/components/views/dashboard-view";
import { OverviewView } from "@/components/views/overview-view";
import { PreviewView } from "@/components/views/preview-view";
import { FlowsView } from "@/components/views/flows-view";
import { HistoryView } from "@/components/views/history-view";
import { AccessView } from "@/components/views/access-view";
import { AccountView } from "@/components/views/account-view";

const navItems: { id: AppView; label: string; icon: typeof FolderKanban }[] = [
  { id: "dashboard", label: "Prototypes", icon: FolderKanban },
  { id: "flows", label: "Saved flows", icon: Workflow },
  { id: "history", label: "History", icon: History },
  { id: "compare", label: "Compare", icon: GitCompareArrows },
  { id: "access", label: "Access", icon: UsersRound },
];

export function RevisionLabApp() {
  const [view, setView] = useState<AppView>("dashboard");
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>(prototypes[0]);
  const [query, setQuery] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [announcement, setAnnouncement] = useState("Prototype catalogue loaded");
  const mainRef = useRef<HTMLDivElement | null>(null);
  const focusNextView = useRef(false);

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

  const renderView = () => {
    switch (view) {
      case "dashboard":
        return <DashboardView query={query} onSelect={choosePrototype} onNavigate={navigate} />;
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
        <button className="wordmark" onClick={() => navigate("dashboard")} aria-label="RevisionLab, open prototypes">
          <Network size={23} strokeWidth={2.25} aria-hidden="true" />
          <span>RevisionLab</span>
        </button>
        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id || (item.id === "dashboard" && ["overview", "preview"].includes(view));
            return (
              <button key={item.id} className={active ? "side-nav__item is-active" : "side-nav__item"} onClick={() => navigate(item.id)} aria-current={active ? "page" : undefined}>
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
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
              aria-label="Search prototypes and flows"
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
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => navigate(item.id)}>
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
            <button onClick={() => navigate("account")}><Settings size={18} /> Account</button>
          </nav>
        ) : null}

        <Box as="main" className="main-content" id="main-content" ref={mainRef}>
          {renderView()}
        </Box>

        <nav className="mobile-bottom-nav" aria-label="Quick navigation">
          <button className={view === "dashboard" ? "is-active" : ""} onClick={() => navigate("dashboard")}><FolderKanban size={18} /><span>Prototypes</span></button>
          <button className={view === "flows" ? "is-active" : ""} onClick={() => navigate("flows")}><Workflow size={18} /><span>Flows</span></button>
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
