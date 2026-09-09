"use client";

import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import {
  ChevronDown,
  ChevronRight,
  CirclePlay,
  ExternalLink,
  FileClock,
  LockKeyhole,
  Monitor,
  MoreHorizontal,
  Network,
  Plus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { activity, prototypes } from "@/lib/demo-data";
import type { AppView, Prototype } from "@/lib/types";
import { DemoDataNote, EmptyState, PageHeader, ReplayStatus, StatusChip } from "@/components/shared";

type DashboardProps = {
  query: string;
  onSelect: (prototype: Prototype, destination?: AppView) => void;
  onNavigate: (view: AppView, message?: string) => void;
};

function Station({ icon: Icon, label, value, tone }: { icon: typeof Monitor; label: string; value: string; tone?: "healthy" | "attention" }) {
  return (
    <Box className="route-station">
      <Box className={`route-station__node${tone ? ` is-${tone}` : ""}`} aria-hidden="true">
        <Icon size={15} strokeWidth={2.2} />
      </Box>
      <Text className="route-station__label">{label}</Text>
      <Text className="route-station__value">{value}</Text>
    </Box>
  );
}

function ScreenThumb({ name, branch }: { name: string; branch?: boolean }) {
  return (
    <Flex className={`screen-thumb${branch ? " screen-thumb--branch" : ""}`} direction="column" aria-label={`${name} screen preview`}>
      <Flex className="screen-thumb__bar" gap="1"><i /><i /><i /></Flex>
      <Box className="screen-thumb__body"><i /><i /><i /><i /></Box>
      <Text>{name}</Text>
    </Flex>
  );
}

function ExpandedJourney() {
  return (
    <Box className="prototype-expanded">
      <Box>
        <Flex justify="space-between" align="center" mb="5">
          <Box>
            <Heading as="h3" fontSize="md">Recorded flow map</Heading>
            <Text color="var(--muted)" fontSize="sm">Checkout happy path · 4 screens</Text>
          </Box>
          <StatusChip tone="healthy">Published · r3</StatusChip>
        </Flex>
        <Box className="journey-map" role="img" aria-label="Basket connects to Delivery, Payment, and Confirmation in the Checkout happy path">
          <ScreenThumb name="Basket" />
          <Box className="journey-connector" aria-hidden="true"><i /></Box>
          <ScreenThumb name="Delivery" />
          <Box className="journey-connector" aria-hidden="true"><i /></Box>
          <ScreenThumb name="Payment" />
          <Box className="journey-connector journey-connector--branch" aria-hidden="true"><i /></Box>
          <Box className="journey-branches">
            <ScreenThumb name="Confirmation" branch />
            <ScreenThumb name="Payment error" branch />
          </Box>
        </Box>
      </Box>
      <Box className="activity-panel">
        <Flex justify="space-between" align="center" mb="3">
          <Heading as="h3" fontSize="md">Recent activity</Heading>
          <button className="text-link" disabled title="All local demo activity is already shown">All shown</button>
        </Flex>
        <Box as="ol" className="activity-list">
          {activity.map((item) => (
            <li key={`${item.time}-${item.action}`}>
              <i className={`activity-node activity-node--${item.tone}`} aria-hidden="true" />
              <Box minW="0">
                <Flex justify="space-between" gap="4">
                  <Text fontWeight="650" fontSize="sm">{item.action}</Text>
                  <Text color="var(--muted)" fontSize="xs" whiteSpace="nowrap">{item.time}</Text>
                </Flex>
                <Text color="var(--muted)" fontSize="sm" truncate>{item.detail} · {item.actor}</Text>
              </Box>
            </li>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function PrototypeRow({ prototype, expanded, onToggle, onSelect }: { prototype: Prototype; expanded: boolean; onToggle: () => void; onSelect: () => void }) {
  return (
    <Box className={`prototype-row${expanded ? " is-expanded" : ""}`}>
      <Box className="prototype-row__summary">
        <button className="prototype-name" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <Box textAlign="left" minW="0">
            <Text fontWeight="750" truncate>{prototype.name}</Text>
            <Text color="var(--muted)" fontSize="xs" truncate>{prototype.updated} · {prototype.role}</Text>
          </Box>
        </button>
        <Box className="route-scroll">
          <Box className="route-track">
            <Station icon={Monitor} label="Screens" value={`${prototype.screens} screens`} />
            <Station icon={CirclePlay} label="Flows" value={`${prototype.flows} saved`} />
            <Station icon={Network} label="Replay" value={prototype.replay === "healthy" ? "Healthy" : prototype.replay === "attention" ? "Attention" : "Not run"} tone={prototype.replay === "healthy" ? "healthy" : prototype.replay === "attention" ? "attention" : undefined} />
            <Station icon={FileClock} label="Version" value={prototype.version} />
            <Station icon={UsersRound} label="Members" value={prototype.members.join(" · ")} />
            <Station icon={LockKeyhole} label="Access" value="Private" />
          </Box>
        </Box>
        <Flex gap="1" justify="flex-end">
          <Button className="row-open-button" onClick={onSelect} aria-label={`Open ${prototype.name}`}>
            <ExternalLink size={16} /> <span>Open</span>
          </Button>
          <Button className="icon-button subtle-button" aria-label={`More options for ${prototype.name} are unavailable in the local demo`} title="Prototype actions require the database integration" disabled><MoreHorizontal size={18} /></Button>
        </Flex>
      </Box>
      {expanded ? <ExpandedJourney /> : null}
    </Box>
  );
}

export function DashboardView({ query, onSelect }: DashboardProps) {
  const [expandedId, setExpandedId] = useState("checkout-service");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return prototypes;
    return prototypes.filter((prototype) => `${prototype.name} ${prototype.description}`.toLowerCase().includes(term));
  }, [query]);

  return (
    <Box className="view-stack">
      <PageHeader
        title="Prototype control"
        description="Open a route, inspect its operational state, or record a new journey."
        action={<Button className="primary-button" onClick={() => onSelect(prototypes[0], "preview")}><ExternalLink size={17} /> Open prototype</Button>}
      />
      <DemoDataNote />

      {filtered.length === 0 ? (
        <EmptyState title="No matching routes" description={`Nothing in this workspace matches “${query}”. Clear the search or register a new code-defined prototype.`} actionLabel="Clear search" onAction={() => window.location.reload()} />
      ) : (
        <Box className="prototype-table">
          <Box className="prototype-table__header" aria-hidden="true">
            <span>Prototype</span><span>Operational route</span><span>Actions</span>
          </Box>
          {filtered.map((prototype) => (
            <PrototypeRow
              key={prototype.id}
              prototype={prototype}
              expanded={expandedId === prototype.id}
              onToggle={() => setExpandedId((current) => current === prototype.id ? "" : prototype.id)}
              onSelect={() => onSelect(prototype)}
            />
          ))}
        </Box>
      )}

      <Flex className="catalogue-note" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="3">
        <Box>
          <Text fontWeight="700">Can’t see a prototype?</Text>
          <Text color="var(--muted)" fontSize="sm">Only private routes you can access appear here.</Text>
        </Box>
        <Button className="secondary-button" disabled title="Prototype registration runs through the repository sync command"><Plus size={16} /> Registration via CLI</Button>
      </Flex>
    </Box>
  );
}
