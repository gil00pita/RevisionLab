"use client";

import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleCheck,
  Download,
  FileJson,
  FileText,
  Play,
  Plus,
  RefreshCw,
  Share2,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import type { AppView, Prototype } from "@/lib/types";
import { seedSteps } from "@/lib/demo-data";
import { DemoDataNote, PageHeader, StatusChip } from "@/components/shared";

const flowItems = [
  { id: "checkout-happy", name: "Checkout happy path", status: "Published", revision: 3, steps: 3, health: "Healthy", updated: "4 min ago" },
  { id: "payment-decline", name: "Payment declined", status: "Draft", revision: 1, steps: 4, health: "1 stale target", updated: "Yesterday" },
  { id: "basket-edit", name: "Edit basket", status: "Published", revision: 2, steps: 2, health: "Not replayed", updated: "3 days ago" },
];

function downloadFlow(format: "json" | "yaml") {
  const flow = {
    schemaVersion: 1,
    id: "checkout-happy-path",
    prototypeId: "checkout-service",
    name: "Checkout happy path",
    status: "published",
    revision: 3,
    viewport: { name: "desktop", width: 1280, height: 900 },
    steps: seedSteps,
  };
  const contents = format === "json"
    ? JSON.stringify(flow, null, 2)
    : `schemaVersion: 1\nid: checkout-happy-path\nprototypeId: checkout-service\nname: Checkout happy path\nstatus: published\nrevision: 3\nviewport:\n  name: desktop\n  width: 1280\n  height: 900\nsteps:\n${seedSteps.map((step) => `  - id: ${step.id}\n    order: ${step.order}\n    action: click\n    fromScreenId: ${step.from.toLowerCase()}\n    toScreenId: ${step.to.toLowerCase()}\n    target:\n      flowId: ${step.flowId}\n      label: ${step.label}`).join("\n")}`;
  const url = URL.createObjectURL(new Blob([contents], { type: format === "json" ? "application/json" : "text/yaml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `checkout-happy-path.${format === "json" ? "json" : "yaml"}`;
  link.click();
  URL.revokeObjectURL(url);
}

export function FlowsView({ prototype, onNavigate, announce }: { prototype: Prototype; onNavigate: (view: AppView, message?: string) => void; announce: (message: string) => void }) {
  const [selected, setSelected] = useState(flowItems[0]);
  const [replay, setReplay] = useState<"idle" | "running" | "complete">("idle");
  const [publishPanel, setPublishPanel] = useState(false);
  const [flowView, setFlowView] = useState<"diagram" | "json">("diagram");

  const runReplay = () => {
    setReplay("running");
    announce("Replay started against desktop viewport");
    window.setTimeout(() => {
      setReplay("complete");
      announce("Replay completed successfully; all 3 targets resolved");
    }, 1200);
  };

  return (
    <Box className="view-stack">
      <PageHeader
        title="Saved flows"
        description={`Review, replay, revise, and export the journeys recorded for ${prototype.name}.`}
        onBack={() => onNavigate("overview")}
        action={<Button className="primary-button" onClick={() => onNavigate("preview", "Preview opened; recorder ready")}><Plus size={17} /> Record flow</Button>}
      />
      <DemoDataNote />

      <Box className="flows-layout">
        <Box className="flow-index" as="nav" aria-label="Saved flows">
          <Text className="section-label">{flowItems.length} flows</Text>
          {flowItems.map((flow) => (
            <button key={flow.id} className={selected.id === flow.id ? "flow-index__item is-active" : "flow-index__item"} onClick={() => setSelected(flow)} aria-current={selected.id === flow.id ? "page" : undefined}>
              <Box minW="0">
                <Text fontWeight="750" truncate>{flow.name}</Text>
                <Flex gap="2" align="center" mt="1">
                  <Text fontSize="xs" color="var(--muted)">{flow.status} · r{flow.revision}</Text>
                  {flow.health === "1 stale target" ? <AlertTriangle size={13} color="var(--warning)" /> : null}
                </Flex>
              </Box>
              <ChevronRight size={16} />
            </button>
          ))}
          <Button className="secondary-button" width="100%" mt="3" disabled title="Authored-flow persistence requires the database integration"><Plus size={16} /> New flow · not connected</Button>
        </Box>

        <Box className="flow-detail">
          <Flex className="flow-detail__header" justify="space-between" align={{ base: "flex-start", md: "center" }} gap="4">
            <Box>
              <Flex align="center" gap="3" wrap="wrap">
                <Heading as="h2" fontSize="xl">{selected.name}</Heading>
                <StatusChip tone={selected.status === "Published" ? "healthy" : "neutral"}>{selected.status} · r{selected.revision}</StatusChip>
              </Flex>
              <Text color="var(--muted)" fontSize="sm" mt="1">Desktop · 1280 × 900 · {selected.steps} semantic steps</Text>
            </Box>
            <Flex gap="2" wrap="wrap">
              <Button className="secondary-button" onClick={runReplay} disabled={replay === "running"}>
                {replay === "running" ? <RefreshCw className="spin" size={16} /> : replay === "complete" ? <Check size={16} /> : <Play size={16} />}
                {replay === "running" ? "Replaying…" : replay === "complete" ? "Replay passed" : "Run replay"}
              </Button>
              <Button className="secondary-button" onClick={() => setPublishPanel((open) => !open)}><Share2 size={16} /> Publish</Button>
            </Flex>
          </Flex>

          {selected.health === "1 stale target" ? (
            <Flex className="inline-alert inline-alert--warning" align="flex-start" gap="3">
              <AlertTriangle size={18} />
              <Box><Text fontWeight="700">One target needs attention</Text><Text fontSize="sm">The payment-error route no longer contains <code>retry-payment</code>. Open the prototype and choose a replacement target.</Text></Box>
            </Flex>
          ) : replay === "complete" ? (
            <Flex className="inline-alert inline-alert--success" align="center" gap="3"><CircleCheck size={18} /><Text><strong>Replay passed.</strong> All {seedSteps.length} targets resolved at 1280 × 900.</Text></Flex>
          ) : null}

          {publishPanel ? (
            <Box className="publish-panel">
              <Flex justify="space-between" gap="5" align="flex-start">
                <Box><Heading as="h3" fontSize="md">Editable board publishing is not configured</Heading><Text mt="1" fontSize="sm" color="var(--muted)">Static exports are available now. Connect Miro, Mural, Excalidraw, Drawio, or Confluence before making an external write.</Text></Box>
                <Button className="quiet-button" disabled title="No board credentials are configured">Integration not connected</Button>
              </Flex>
            </Box>
          ) : null}

          <Box className="flow-canvas">
            <Flex justify="space-between" align="center" mb="5">
              <Box><Heading as="h3" fontSize="md">Journey diagram</Heading><Text fontSize="sm" color="var(--muted)">The diagram and ordered steps share one definition.</Text></Box>
              <Flex gap="1"><Button className={`view-tab${flowView === "diagram" ? " is-active" : ""}`} onClick={() => setFlowView("diagram")} aria-pressed={flowView === "diagram"}>Diagram</Button><Button className={`view-tab${flowView === "json" ? " is-active" : ""}`} onClick={() => setFlowView("json")} aria-pressed={flowView === "json"}>JSON</Button></Flex>
            </Flex>
            {flowView === "diagram" ? (
              <Box className="flow-diagram" role="img" aria-label="Basket connects to Delivery, then Payment, then Confirmation">
                {["Basket", "Delivery", "Payment", "Confirmation"].map((screen, index) => (
                  <Box className="flow-node" key={screen}>
                    <Text className="flow-node__number">{String(index + 1).padStart(2, "0")}</Text>
                    <Box className="flow-node__preview"><i /><i /><i /></Box>
                    <Text fontWeight="750">{screen}</Text>
                    {index < 3 ? <Box className="flow-node__connector" aria-hidden="true"><i>{index + 1}</i></Box> : null}
                  </Box>
                ))}
              </Box>
            ) : (
              <pre className="flow-json" tabIndex={0}>{JSON.stringify({ schemaVersion: 1, id: "checkout-happy-path", status: "published", revision: 3, viewport: { name: "desktop", width: 1280, height: 900 }, steps: seedSteps }, null, 2)}</pre>
            )}
          </Box>

          <Box className="step-table">
            <Flex className="step-table__header"><span>Step</span><span>Action</span><span>Route</span><span>Target</span></Flex>
            {seedSteps.map((step) => (
              <Box className="step-table__row" key={step.id}>
                <Text className="step-order">{String(step.order).padStart(2, "0")}</Text>
                <Box><Text fontWeight="700" fontSize="sm">{step.label}</Text><Text color="var(--muted)" fontSize="xs">Click</Text></Box>
                <Text fontSize="sm">{step.from} → {step.to}</Text>
                <code>{step.flowId}</code>
              </Box>
            ))}
          </Box>

          <Flex className="export-strip" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="4">
            <Box><Text fontWeight="700">Portable definition</Text><Text fontSize="sm" color="var(--muted)">Validated schema v1 · excludes account and credential data</Text></Box>
            <Flex gap="2" wrap="wrap">
              <Button className="secondary-button" onClick={() => downloadFlow("json")}><FileJson size={16} /> JSON <Download size={14} /></Button>
              <Button className="secondary-button" onClick={() => downloadFlow("yaml")}><FileText size={16} /> YAML <Download size={14} /></Button>
              <Button className="primary-button" onClick={() => { downloadFlow("json"); announce("Flow export downloaded as validated JSON"); }}><Workflow size={16} /> Export flow</Button>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
