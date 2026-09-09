"use client";

import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  CircleAlert,
  Columns2,
  Eye,
  FileClock,
  GitCommitHorizontal,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import type { AppView, Prototype } from "@/lib/types";
import { versionHistory } from "@/lib/demo-data";
import { DemoDataNote, PageHeader, StatusChip } from "@/components/shared";

type ComparisonMode = "side" | "reveal" | "difference";

function MockSnapshot({ version, changed = false }: { version: string; changed?: boolean }) {
  return (
    <Box className={`mock-snapshot${changed ? " is-changed" : ""}`}>
      <Flex className="mock-snapshot__bar" gap="1"><i /><i /><i /></Flex>
      <Box className="mock-snapshot__body">
        <i className="snapshot-title" />
        <Flex gap="3"><i className="snapshot-photo" /><Box flex="1"><i /><i /><i /></Box></Flex>
        <i className="snapshot-summary" />
        <i className="snapshot-button" />
      </Box>
      <Text className="mock-snapshot__label">{version}</Text>
    </Box>
  );
}

function CompareWorkspace() {
  const [mode, setMode] = useState<ComparisonMode>("side");
  const [reveal, setReveal] = useState(56);
  return (
    <Box className="compare-workspace">
      <Flex className="compare-controls" align="center" justify="space-between" gap="4" wrap="wrap">
        <Flex gap="2" wrap="wrap">
          <label className="version-select">Earlier<Box as="select" defaultValue="v0.8.2"><option>v0.8.2</option><option>v0.8.3</option></Box><ChevronDown size={14} /></label>
          <label className="version-select">Later<Box as="select" defaultValue="v0.8.4"><option>v0.8.4</option><option>v0.8.3</option></Box><ChevronDown size={14} /></label>
          <label className="version-select">Screen<Box as="select"><option>Basket</option><option>Delivery</option><option>Payment</option></Box><ChevronDown size={14} /></label>
        </Flex>
        <Flex className="segmented-control" role="group" aria-label="Comparison mode">
          <button className={mode === "side" ? "is-active" : ""} onClick={() => setMode("side")}><Columns2 size={15} /> Side by side</button>
          <button className={mode === "reveal" ? "is-active" : ""} onClick={() => setMode("reveal")}><ArrowLeftRight size={15} /> Reveal</button>
          <button className={mode === "difference" ? "is-active" : ""} onClick={() => setMode("difference")}><Eye size={15} /> Difference</button>
        </Flex>
      </Flex>
      <Box className={`comparison-stage comparison-stage--${mode}`}>
        {mode === "side" ? (
          <><Box><Text className="comparison-label">Earlier · v0.8.2</Text><MockSnapshot version="v0.8.2" /></Box><Box><Text className="comparison-label">Later · v0.8.4</Text><MockSnapshot version="v0.8.4" changed /></Box></>
        ) : (
          <Box className="reveal-frame">
            <MockSnapshot version="v0.8.2" />
            <Box className={`reveal-overlay${mode === "difference" ? " is-difference" : ""}`} style={{ width: mode === "difference" ? "100%" : `${reveal}%` }}><MockSnapshot version="v0.8.4" changed /></Box>
            {mode === "reveal" ? <input aria-label="Reveal later version" type="range" min="5" max="95" value={reveal} onChange={(event) => setReveal(Number(event.target.value))} /> : null}
          </Box>
        )}
      </Box>
      <Flex className="comparison-summary" gap="6" wrap="wrap">
        <span><strong>12</strong> screenshots compared</span><span><strong>3</strong> visible regions changed</span><span><Check size={15} /> No missing captures</span>
      </Flex>
    </Box>
  );
}

export function HistoryView({ prototype, mode, onNavigate }: { prototype: Prototype; mode: "history" | "compare"; onNavigate: (view: AppView, message?: string) => void }) {
  return (
    <Box className="view-stack">
      <PageHeader
        title={mode === "compare" ? "Compare revisions" : "Version history"}
        description={mode === "compare" ? `Inspect visual evidence across immutable ${prototype.name} versions.` : `Meaningful ${prototype.name} revisions with screenshots, notes, authorship, and Git context.`}
        onBack={() => onNavigate("overview")}
        action={mode === "history" ? <Button className="primary-button" onClick={() => onNavigate("compare")}><Columns2 size={17} /> Compare versions</Button> : <Button className="secondary-button" onClick={() => onNavigate("history")}><FileClock size={17} /> History</Button>}
      />
      <DemoDataNote />
      {mode === "compare" ? <CompareWorkspace /> : (
        <Box className="history-layout">
          <Box className="version-timeline">
            {versionHistory.map((version, index) => (
              <Box className="version-entry" key={version.version}>
                <Box className={`version-entry__node${index === 0 ? " is-current" : ""}`} aria-hidden="true" />
                <Flex justify="space-between" align="flex-start" gap="5" wrap="wrap">
                  <Box>
                    <Flex gap="3" align="center"><Heading as="h2" fontSize="xl" className="data-text">{version.version}</Heading>{index === 0 ? <StatusChip tone="healthy">Current</StatusChip> : null}</Flex>
                    <Text fontWeight="750" mt="3">{version.title}</Text>
                    <Text color="var(--muted)" mt="1" maxW="62ch">{version.note}</Text>
                  </Box>
                  <Box textAlign={{ base: "left", md: "right" }}>
                    <Text fontSize="sm">{version.time}</Text>
                    <Text color="var(--muted)" fontSize="sm">by {version.author}</Text>
                  </Box>
                </Flex>
                <Flex className="version-meta" gap="4" wrap="wrap">
                  <span><GitCommitHorizontal size={15} /> {version.commit}</span>
                  <span><Smartphone size={15} /> {version.screens} snapshots</span>
                  <span><Check size={15} /> Standard viewports complete</span>
                </Flex>
                <Flex className="snapshot-strip" gap="3">
                  <MockSnapshot version={`${version.version} · 375`} changed={index === 0} />
                  <MockSnapshot version={`${version.version} · 768`} />
                  {index === 2 ? (
                    <Flex className="missing-snapshot" direction="column" align="center" justify="center"><CircleAlert size={19} /><Text fontWeight="700" fontSize="sm">Desktop missing</Text><Text fontSize="xs">Capture unavailable</Text></Flex>
                  ) : <MockSnapshot version={`${version.version} · 1280`} changed={index === 0} />}
                </Flex>
                <Button className="quiet-button" mt="4" onClick={() => onNavigate("compare")}>Compare from this version</Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
