"use client";

import { Box, Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { Check, KeyRound, LogOut, Mail, Monitor, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import type { AppView } from "@/lib/types";
import { DemoDataNote, PageHeader, StatusChip } from "@/components/shared";

export function AccountView({ onNavigate, announce }: { onNavigate: (view: AppView, message?: string) => void; announce: (message: string) => void }) {
  const [name, setName] = useState("Jamie Diaz");
  const [saved, setSaved] = useState(false);
  return (
    <Box className="view-stack">
      <PageHeader title="Account" description="Personal profile, verified identity, and session controls." onBack={() => onNavigate("dashboard")} />
      <DemoDataNote />
      <Box className="account-layout">
        <Box className="account-main">
          <Box className="account-profile">
            <Flex align="center" gap="4" mb="6"><Box className="profile-avatar">JD</Box><Box><Heading as="h2" fontSize="lg">Profile</Heading><Text fontSize="sm" color="var(--muted)">Used for authorship and audit activity.</Text></Box></Flex>
            <Box className="account-fields">
              <label>Display name<Input value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} /></label>
              <label>Verified email<Flex className="readonly-field" align="center" justify="space-between"><span>jamie@example.test</span><StatusChip tone="healthy">Verified</StatusChip></Flex></label>
            </Box>
            <Button className="primary-button" mt="5" onClick={() => { setSaved(true); announce("Profile saved"); }}><Check size={16} /> {saved ? "Saved" : "Save profile"}</Button>
          </Box>
          <Box className="account-profile">
            <Flex align="center" gap="3"><KeyRound size={19} /><Heading as="h2" fontSize="lg">Password and recovery</Heading></Flex>
            <Text color="var(--muted)" fontSize="sm" mt="2">Password changes and resets are completed through a verified email flow.</Text>
            <Button className="secondary-button" mt="4" disabled title="Connect Supabase Auth and an email provider to send password resets">Password reset · not connected</Button>
          </Box>
        </Box>
        <Box className="account-sidebar">
          <Box className="session-panel">
            <Flex align="center" gap="3"><ShieldCheck size={19} color="var(--healthy-ink)" /><Heading as="h2" fontSize="md">Current session</Heading></Flex>
            <Flex mt="4" align="flex-start" gap="3"><Monitor size={17} /><Box><Text fontWeight="700" fontSize="sm">Chrome on macOS</Text><Text fontSize="xs" color="var(--muted)">London, United Kingdom · active now</Text></Box></Flex>
          </Box>
          <Button className="danger-button" width="100%" disabled title="Authentication is not connected in this front-end demo"><LogOut size={17} /> Sign out · not connected</Button>
          <Text fontSize="xs" color="var(--muted)">Signing out clears this browser session and returns you to the secure login screen.</Text>
        </Box>
      </Box>
    </Box>
  );
}
