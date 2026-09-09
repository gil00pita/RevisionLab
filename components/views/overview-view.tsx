"use client";

import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import {
  ArrowRight,
  CircleCheck,
  ExternalLink,
  FileClock,
  GitCompareArrows,
  LockKeyhole,
  Play,
  Share2,
  Workflow,
} from "lucide-react";
import type { AppView, Prototype } from "@/lib/types";
import { activity } from "@/lib/demo-data";
import { DemoDataNote, PageHeader, PrivacyLabel, StatusChip } from "@/components/shared";

function JourneyScreen({ number, name, state }: { number: string; name: string; state: "replayed" | "pending" }) {
  return (
    <Box className="overview-screen">
      <Flex justify="space-between" align="baseline" mb="2">
        <Text fontSize="xs" fontWeight="800" className="data-text">{number}</Text>
        <Text fontSize="xs" color="var(--muted)">1280 × 900</Text>
      </Flex>
      <Box className="overview-screen__frame">
        <Box className="overview-screen__chrome"><i /><i /><i /></Box>
        <Box className="overview-screen__copy"><i /><i /><i /><i /></Box>
      </Box>
      <Text mt="3" fontWeight="750">{name}</Text>
      <Flex mt="1" align="center" gap="2" color={state === "replayed" ? "var(--healthy-ink)" : "var(--muted)"}>
        {state === "replayed" ? <CircleCheck size={15} /> : <Play size={14} />}
        <Text fontSize="xs" fontWeight="700">{state === "replayed" ? "Replayed" : "Not replayed"}</Text>
      </Flex>
    </Box>
  );
}

export function OverviewView({ prototype, onNavigate }: { prototype: Prototype; onNavigate: (view: AppView, message?: string) => void }) {
  return (
    <Box className="view-stack">
      <PageHeader
        title={prototype.name}
        description={prototype.description}
        onBack={() => onNavigate("dashboard")}
        action={
          <Flex gap="2">
            <Button className="secondary-button" onClick={() => onNavigate("access")}><Share2 size={16} /> Share</Button>
            <Button className="primary-button" onClick={() => onNavigate("preview")}><ExternalLink size={17} /> Open prototype</Button>
          </Flex>
        }
      />
      <Flex align="center" gap="4" wrap="wrap">
        <PrivacyLabel role={prototype.role} />
        <StatusChip tone="healthy">Replay healthy</StatusChip>
        <Text fontSize="sm" color="var(--muted)">{prototype.screens} screens · {prototype.flows} saved flows</Text>
      </Flex>
      <DemoDataNote />

      <Box className="overview-grid">
        <Box className="journey-board">
          <Flex justify="space-between" align="flex-start" gap="4" mb="8">
            <Box>
              <Heading as="h2" fontSize="lg">Checkout happy path</Heading>
              <Text color="var(--muted)" fontSize="sm" mt="1">Published revision 3 · desktop viewport</Text>
            </Box>
            <Button className="quiet-button" onClick={() => onNavigate("flows")}>View flow <ArrowRight size={15} /></Button>
          </Flex>
          <Box className="overview-journey" role="img" aria-label="Basket, Delivery, Payment, and Confirmation are connected in order">
            <JourneyScreen number="01" name="Basket" state="replayed" />
            <i className="overview-route" aria-hidden="true" />
            <JourneyScreen number="02" name="Delivery" state="replayed" />
            <i className="overview-route" aria-hidden="true" />
            <JourneyScreen number="03" name="Payment" state="replayed" />
            <i className="overview-route" aria-hidden="true" />
            <JourneyScreen number="04" name="Confirmation" state="pending" />
          </Box>
          <Flex className="journey-legend" gap="5" wrap="wrap">
            <span><i className="legend-line" /> Primary path</span>
            <span><i className="legend-node" /> Screen node</span>
            <span><CircleCheck size={14} /> Replay verified</span>
          </Flex>
        </Box>

        <Box className="overview-inspector">
          <Box className="inspector-section">
            <Text className="inspector-label">Current version</Text>
            <Flex align="center" justify="space-between" mt="2">
              <Heading as="p" fontSize="2xl" className="data-text">{prototype.version}</Heading>
              <FileClock size={19} color="var(--muted)" />
            </Flex>
            <Text fontSize="sm" color="var(--muted)" mt="1">Updated {prototype.updated}</Text>
          </Box>
          <button className="inspector-link" onClick={() => onNavigate("history")}>
            <span><CircleCheck size={17} color="var(--health)" /> Replay health</span>
            <span>Healthy <ArrowRight size={15} /></span>
          </button>
          <button className="inspector-link" onClick={() => onNavigate("access")}>
            <span><LockKeyhole size={17} /> Access</span>
            <span>Private <ArrowRight size={15} /></span>
          </button>
          <Box className="inspector-section">
            <Text className="inspector-label">Recent activity</Text>
            <Box as="ol" className="overview-activity">
              {activity.slice(0, 4).map((item) => (
                <li key={item.action}>
                  <i className={`activity-node activity-node--${item.tone}`} />
                  <Box>
                    <Text fontSize="sm" fontWeight="650">{item.action}</Text>
                    <Text fontSize="xs" color="var(--muted)">{item.time}</Text>
                  </Box>
                </li>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Flex className="action-dock" gap="2" wrap="wrap">
        <Button className="primary-button" onClick={() => onNavigate("preview")}><ExternalLink size={17} /> Open prototype</Button>
        <Button className="secondary-button" onClick={() => onNavigate("preview", "Preview opened; recorder ready")}><Workflow size={17} /> Record flow</Button>
        <Button className="secondary-button" onClick={() => onNavigate("compare")}><GitCompareArrows size={17} /> Compare</Button>
        <Button className="secondary-button" onClick={() => onNavigate("flows")}><Share2 size={17} /> Export</Button>
      </Flex>
    </Box>
  );
}
