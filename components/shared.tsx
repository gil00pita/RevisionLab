"use client";

import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { ArrowLeft, CircleAlert, CircleCheck, LockKeyhole, Plus } from "lucide-react";
import type { ReplayState } from "@/lib/types";

export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "healthy" | "attention" | "neutral" | "accent";
}) {
  return (
    <Box as="span" className={`status-chip status-chip--${tone}`}>
      <Box as="span" className="status-chip__dot" aria-hidden="true" />
      {children}
    </Box>
  );
}

export function ReplayStatus({ state, short = false }: { state: ReplayState; short?: boolean }) {
  const healthy = state === "healthy";
  const attention = state === "attention";
  const Icon = healthy ? CircleCheck : CircleAlert;
  const label = healthy ? "Replay healthy" : attention ? "1 stale target" : "Not replayed";

  return (
    <Flex align="center" gap="2" color={healthy ? "var(--healthy-ink)" : attention ? "var(--warning-ink)" : "var(--muted)"}>
      <Icon size={16} aria-hidden="true" />
      <Text as="span" textStyle="sm" fontWeight="600">
        {short && healthy ? "Healthy" : label}
      </Text>
    </Flex>
  );
}

export function PageHeader({
  title,
  description,
  action,
  onBack,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <Flex className="page-heading" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="5">
      <Flex gap="3" align="flex-start" minW="0">
        {onBack ? (
          <Button className="icon-button subtle-button" aria-label="Back" onClick={onBack} mt="1px">
            <ArrowLeft size={18} />
          </Button>
        ) : null}
        <Box minW="0">
          <Heading as="h1" className="display-title" tabIndex={-1}>
            {title}
          </Heading>
          {description ? (
            <Text color="var(--muted)" mt="1" maxW="72ch">
              {description}
            </Text>
          ) : null}
        </Box>
      </Flex>
      {action ? <Box flexShrink="0">{action}</Box> : null}
    </Flex>
  );
}

export function PrivacyLabel({ role }: { role?: string }) {
  return (
    <Flex align="center" gap="2" color="var(--ink-soft)" fontSize="sm">
      <LockKeyhole size={15} aria-hidden="true" />
      <Text as="span">Private{role ? ` · ${role}` : ""}</Text>
    </Flex>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Flex className="empty-state" direction="column" align="flex-start">
      <Box className="empty-state__rail" aria-hidden="true">
        <Box />
        <Box />
        <Box />
      </Box>
      <Heading as="h2" fontSize="2xl" letterSpacing="-0.02em">
        {title}
      </Heading>
      <Text color="var(--muted)" maxW="50ch" mt="2">
        {description}
      </Text>
      <Button className="primary-button" mt="5" onClick={onAction}>
        <Plus size={17} />
        {actionLabel}
      </Button>
    </Flex>
  );
}

export function DemoDataNote() {
  return (
    <Text fontSize="xs" color="var(--muted)" mt="3">
      Local demo data · no production services connected
    </Text>
  );
}
