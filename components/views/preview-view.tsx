"use client";

import { Box, Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  ExternalLink,
  Monitor,
  Pause,
  Play,
  Redo2,
  RotateCw,
  Save,
  Smartphone,
  Square,
  Tablet,
  Undo2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AppView, Prototype, RecordedStep } from "@/lib/types";
import { PageHeader, StatusChip } from "@/components/shared";

const screens = ["Basket", "Delivery", "Payment", "Confirmation"];

const presets = [
  { name: "Phone", width: 375, height: 740, icon: Smartphone },
  { name: "Tablet", width: 768, height: 760, icon: Tablet },
  { name: "Desktop", width: 1280, height: 760, icon: Monitor },
];

function PrototypeHeader({ compact }: { compact: boolean }) {
  return (
    <Flex className="demo-store__header" align="center" justify="space-between">
      <Text fontWeight="850" letterSpacing="-0.025em">Northstar</Text>
      <Flex gap={compact ? "3" : "6"} fontSize="sm" align="center">
        {!compact ? <><span>New in</span><span>Collections</span><span>Help</span></> : null}
        <span>Basket · 2</span>
      </Flex>
    </Flex>
  );
}

function BasketScreen({ compact, next }: { compact: boolean; next: () => void }) {
  return (
    <Box className="demo-store__page">
      <Text className="demo-store__crumb">Shop / Basket</Text>
      <Heading as="h2" className="demo-store__title">Your basket</Heading>
      <Box className="demo-basket">
        <Box className="demo-products">
          {["Field jacket", "Canvas day bag"].map((item, index) => (
            <Flex key={item} className="demo-product" gap="4">
              <Box className={`demo-product__image tone-${index + 1}`} />
              <Box flex="1">
                <Text fontWeight="750">{item}</Text>
                <Text fontSize="sm" color="#606864">Sand · {index === 0 ? "Medium" : "One size"}</Text>
                <Text mt="3" fontWeight="700">£{index === 0 ? "128" : "54"}.00</Text>
              </Box>
            </Flex>
          ))}
        </Box>
        <Box className="demo-summary">
          <Text fontWeight="800">Order summary</Text>
          <Flex justify="space-between" mt="5"><span>Subtotal</span><strong>£182.00</strong></Flex>
          <Flex justify="space-between" mt="2"><span>Delivery</span><strong>Free</strong></Flex>
          <Flex justify="space-between" className="demo-total"><span>Total</span><strong>£182.00</strong></Flex>
          <button data-flow-id="continue-to-delivery" data-flow-label="Continue to delivery" className="demo-primary" onClick={next}>Continue to delivery <ArrowRight size={17} /></button>
          <Text fontSize="xs" color="#606864" mt="3">Secure checkout · no payment data is stored by this demo</Text>
        </Box>
      </Box>
    </Box>
  );
}

function DeliveryScreen({ next, back }: { compact: boolean; next: () => void; back: () => void }) {
  return (
    <Box className="demo-store__page demo-form-page">
      <button className="demo-back" onClick={back}><ArrowLeft size={15} /> Back to basket</button>
      <Text className="demo-store__crumb">Checkout / Delivery</Text>
      <Heading as="h2" className="demo-store__title">Where should we send it?</Heading>
      <Box className="demo-form">
        <label>Full name<Input defaultValue="Alex Morgan" data-flow-sensitive /></label>
        <label>Postcode<Input defaultValue="SE1 7PB" data-flow-sensitive /></label>
        <label>Address<Input defaultValue="12 River Street" data-flow-sensitive /></label>
        <button data-flow-id="confirm-address" data-flow-label="Confirm delivery address" className="demo-primary" onClick={next}>Confirm address <ArrowRight size={17} /></button>
      </Box>
    </Box>
  );
}

function PaymentScreen({ next, back }: { compact: boolean; next: () => void; back: () => void }) {
  return (
    <Box className="demo-store__page demo-form-page">
      <button className="demo-back" onClick={back}><ArrowLeft size={15} /> Back to delivery</button>
      <Text className="demo-store__crumb">Checkout / Payment</Text>
      <Heading as="h2" className="demo-store__title">Pay securely</Heading>
      <Box className="demo-form">
        <label>Card number<Input value="•••• •••• •••• 4242" readOnly data-flow-sensitive /></label>
        <Flex gap="3"><label>Expiry<Input value="09 / 29" readOnly data-flow-sensitive /></label><label>Security code<Input value="•••" readOnly data-flow-sensitive /></label></Flex>
        <Box className="demo-reassurance"><Check size={17} /><span>Your payment fields are excluded from RevisionLab recordings.</span></Box>
        <button data-flow-id="pay-now" data-flow-label="Pay securely" className="demo-primary" onClick={next}>Pay £182.00 <ArrowRight size={17} /></button>
      </Box>
    </Box>
  );
}

function ConfirmationScreen({ restart }: { restart: () => void }) {
  return (
    <Flex className="demo-confirmation" direction="column" align="center" textAlign="center">
      <Box className="demo-confirmation__check"><Check size={32} /></Box>
      <Heading as="h2" className="demo-store__title">Order confirmed</Heading>
      <Text color="#606864" maxW="42ch">Your fictional order reference is NS-20418. No purchase was made.</Text>
      <button data-flow-id="return-to-basket" data-flow-label="Return to basket" className="demo-secondary" onClick={restart}>Return to basket</button>
    </Flex>
  );
}

export function PreviewView({ prototype, onNavigate, announce }: { prototype: Prototype; onNavigate: (view: AppView, message?: string) => void; announce: (message: string) => void }) {
  const [screenIndex, setScreenIndex] = useState(0);
  const [width, setWidth] = useState(768);
  const [height, setHeight] = useState(760);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [steps, setSteps] = useState<RecordedStep[]>([]);
  const [saved, setSaved] = useState(true);
  const compact = width < 600;

  const recordAndNavigate = (nextIndex: number, label: string, flowId: string) => {
    if (recording && !paused && nextIndex > screenIndex) {
      const step: RecordedStep = {
        id: `recorded-${Date.now()}`,
        order: steps.length + 1,
        from: screens[screenIndex],
        to: screens[nextIndex],
        label,
        flowId,
      };
      setSteps((current) => [...current, step]);
      setSaved(false);
      announce(`Step ${step.order} captured: ${label}`);
      window.setTimeout(() => setSaved(true), 700);
    }
    setScreenIndex(nextIndex);
  };

  const currentPreset = useMemo(() => presets.find((preset) => preset.width === width)?.name ?? "Custom", [width]);

  const screen = [
    <BasketScreen key="basket" compact={compact} next={() => recordAndNavigate(1, "Continue to delivery", "continue-to-delivery")} />,
    <DeliveryScreen key="delivery" compact={compact} back={() => setScreenIndex(0)} next={() => recordAndNavigate(2, "Confirm delivery address", "confirm-address")} />,
    <PaymentScreen key="payment" compact={compact} back={() => setScreenIndex(1)} next={() => recordAndNavigate(3, "Pay securely", "pay-now")} />,
    <ConfirmationScreen key="confirmation" restart={() => setScreenIndex(0)} />,
  ][screenIndex];

  return (
    <Box className="view-stack preview-view">
      <PageHeader
        title={`${prototype.name} preview`}
        description="The prototype renders at its real viewport width. Shell controls are kept outside the recorded surface."
        onBack={() => onNavigate("overview")}
        action={
          recording ? (
            <StatusChip tone="accent">Recording · {steps.length} {steps.length === 1 ? "step" : "steps"}</StatusChip>
          ) : (
            <Button className="record-button" onClick={() => { setRecording(true); setSteps([]); announce("Recording started"); }}><Circle fill="currentColor" size={12} /> Record flow</Button>
          )
        }
      />

      <Flex className="preview-toolbar" align="center" justify="space-between" gap="3" wrap="wrap">
        <Flex gap="1" wrap="wrap" role="group" aria-label="Viewport presets">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <button key={preset.name} className={width === preset.width ? "viewport-button is-active" : "viewport-button"} onClick={() => { setWidth(preset.width); setHeight(preset.height); }} aria-pressed={width === preset.width}>
                <Icon size={15} /> {preset.name} <span>{preset.width}</span>
              </button>
            );
          })}
        </Flex>
        <Flex gap="2" align="center">
          <label className="custom-width-label">Width <Input aria-label="Custom viewport width" type="number" min="320" max="1600" value={width} onChange={(event) => setWidth(Math.max(320, Math.min(1600, Number(event.target.value))))} /></label>
          <Button className="icon-button subtle-button" aria-label="Rotate viewport" onClick={() => { const oldWidth = width; setWidth(Math.min(1600, Math.max(320, height))); setHeight(oldWidth); }}><RotateCw size={17} /></Button>
          <Button className="icon-button subtle-button" aria-label="Unframed route unavailable in local demo" title="Connect the prototype registry to open an unframed route" disabled><ExternalLink size={17} /></Button>
        </Flex>
      </Flex>

      <Box className={`preview-workspace${recording ? " is-recording" : ""}`}>
        <Box className="preview-stage">
          <Flex className="preview-stage__meta" justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="700">{screens[screenIndex]}</Text>
            <Text fontSize="xs" color="var(--muted)" className="data-text">{currentPreset} · {width} × {height}</Text>
          </Flex>
          <Box className="viewport-scroll">
            <Box className={`prototype-viewport${compact ? " is-compact" : ""}`} style={{ width: `${width}px`, minHeight: `${Math.min(height, 760)}px` }} data-screen-id={screens[screenIndex].toLowerCase()}>
              <PrototypeHeader compact={compact} />
              {screen}
            </Box>
          </Box>
          <Flex className="screen-stepper" align="center" justify="space-between">
            <Button className="quiet-button" disabled={screenIndex === 0} onClick={() => setScreenIndex((current) => Math.max(0, current - 1))}><ArrowLeft size={15} /> Previous</Button>
            <Text fontSize="sm"><strong>{screenIndex + 1}</strong> of {screens.length} · {screens[screenIndex]}</Text>
            <Button className="quiet-button" disabled={screenIndex === screens.length - 1} onClick={() => setScreenIndex((current) => Math.min(screens.length - 1, current + 1))}>Next <ArrowRight size={15} /></Button>
          </Flex>
        </Box>

        <Box className="recorder-panel" aria-label="Recorded steps">
          <Flex className="recorder-panel__header" justify="space-between" align="center">
            <Box>
              <Heading as="h2" fontSize="md">Live steps</Heading>
              <Text color="var(--muted)" fontSize="xs">{recording ? paused ? "Recording paused" : "Eligible targets are active" : "Start recording to capture a journey"}</Text>
            </Box>
            {recording ? <Box className={`record-beacon${paused ? " is-paused" : ""}`} aria-hidden="true" /> : null}
          </Flex>

          {steps.length ? (
            <Box as="ol" className="recorded-steps">
              {steps.map((step) => (
                <li key={step.id}>
                  <span>{step.order}</span>
                  <Box minW="0">
                    <Text fontWeight="700" fontSize="sm">{step.label}</Text>
                    <Text fontSize="xs" color="var(--muted)">{step.from} → {step.to}</Text>
                    <code>data-flow-id=&quot;{step.flowId}&quot;</code>
                  </Box>
                </li>
              ))}
            </Box>
          ) : (
            <Flex className="recorder-empty" direction="column" align="center" textAlign="center">
              <Box className="target-glyph"><i /><i /><i /></Box>
              <Text fontWeight="700">No steps captured</Text>
              <Text fontSize="sm" color="var(--muted)" maxW="28ch" mt="1">Start recording, then use the highlighted controls inside the prototype.</Text>
            </Flex>
          )}

          <Box className="recorder-footer">
            <Flex justify="space-between" align="center" mb="3">
              <Flex align="center" gap="2" color={saved ? "var(--healthy-ink)" : "var(--muted)"}>
                <Save size={14} /><Text fontSize="xs">{saved ? "Draft autosaved" : "Saving draft…"}</Text>
              </Flex>
              <Button className="icon-button subtle-button" aria-label="Undo last step" disabled={!steps.length} onClick={() => setSteps((current) => current.slice(0, -1))}><Undo2 size={15} /></Button>
            </Flex>
            {recording ? (
              <Flex gap="2">
                <Button className="secondary-button" flex="1" onClick={() => setPaused((value) => !value)}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? "Resume" : "Pause"}</Button>
                <Button className="primary-button" flex="1" onClick={() => { setRecording(false); setPaused(false); announce(`Recording finished with ${steps.length} steps`); }}><Square size={14} fill="currentColor" /> Finish</Button>
              </Flex>
            ) : steps.length ? (
              <Button className="primary-button" width="100%" onClick={() => onNavigate("flows", "Recorded flow draft opened")}><Check size={16} /> Review flow</Button>
            ) : (
              <Button className="secondary-button" width="100%" onClick={() => { setRecording(true); announce("Recording started"); }}><Redo2 size={16} /> Start recording</Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
