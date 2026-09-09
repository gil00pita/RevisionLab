"use client";

import { Box, Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock3,
  Link2,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Send,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRef, useState } from "react";
import type { AppView, Prototype } from "@/lib/types";
import { DemoDataNote, PageHeader, StatusChip } from "@/components/shared";

type Member = { initials: string; name: string; email: string; role: "Owner" | "Manager" | "Viewer"; status: "Active" | "Pending" };

const initialMembers: Member[] = [
  { initials: "JD", name: "Jamie Diaz", email: "jamie@example.test", role: "Owner", status: "Active" },
  { initials: "MP", name: "Morgan Price", email: "morgan@example.test", role: "Manager", status: "Active" },
  { initials: "AK", name: "Ari Khan", email: "ari@example.test", role: "Viewer", status: "Active" },
  { initials: "RS", name: "Riley Smith", email: "riley@example.test", role: "Viewer", status: "Pending" },
];

export function AccessView({ prototype, onNavigate, announce }: { prototype: Prototype; onNavigate: (view: AppView, message?: string) => void; announce: (message: string) => void }) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Viewer" | "Manager">("Viewer");
  const [downloads, setDownloads] = useState(false);
  const [error, setError] = useState("");
  const emailInput = useRef<HTMLInputElement | null>(null);

  const invite = () => {
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setError("Enter a valid email address, such as name@example.com.");
      window.requestAnimationFrame(() => emailInput.current?.focus());
      return;
    }
    if (members.some((member) => member.email === normalized)) {
      setError("This person already has access or a pending invitation.");
      window.requestAnimationFrame(() => emailInput.current?.focus());
      return;
    }
    setMembers((current) => [...current, { initials: normalized.slice(0, 2).toUpperCase(), name: normalized.split("@")[0], email: normalized, role, status: "Pending" }]);
    setEmail("");
    setError("");
    announce(`Invitation prepared for ${normalized} with ${role.toLowerCase()} access`);
  };

  return (
    <Box className="view-stack">
      <PageHeader title="Access" description={`Control exactly who can open ${prototype.name}, manage flows, and download exports.`} onBack={() => onNavigate("overview")} />
      <Flex align="center" gap="4" wrap="wrap"><StatusChip tone="healthy">Private by default</StatusChip><Text fontSize="sm" color="var(--muted)">{members.filter((member) => member.status === "Active").length} active members · 1 pending</Text></Flex>
      <DemoDataNote />

      <Box className="access-layout">
        <Box>
          <Box className="invite-panel">
            <Flex align="flex-start" gap="3" mb="5"><Box className="panel-icon"><Mail size={18} /></Box><Box><Heading as="h2" fontSize="lg">Invite by verified email</Heading><Text color="var(--muted)" fontSize="sm" mt="1">Recipients must authenticate as this exact address. Links never bypass access checks.</Text></Box></Flex>
            {error ? <Flex className="error-summary" id="invite-error" role="alert" gap="3"><AlertTriangle size={18} /><Box><Text fontWeight="700">Invitation not ready</Text><Text fontSize="sm">{error}</Text></Box></Flex> : null}
            <Flex className="invite-form" gap="2" align="flex-end">
              <label htmlFor="invite-email">Email address<Input id="invite-email" ref={emailInput} type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (error) setError(""); }} placeholder="name@example.com" aria-invalid={Boolean(error)} aria-describedby={error ? "invite-error" : undefined} /></label>
              <label>Access<Box className="select-shell"><select value={role} onChange={(event) => setRole(event.target.value as "Viewer" | "Manager")}><option>Viewer</option><option>Manager</option></select><ChevronDown size={15} /></Box></label>
              <Button className="primary-button" onClick={invite}><Send size={16} /> Send invitation</Button>
            </Flex>
          </Box>

          <Box className="members-panel">
            <Flex justify="space-between" align="center" mb="3"><Heading as="h2" fontSize="lg">People with access</Heading><Text fontSize="sm" color="var(--muted)">{members.length} people</Text></Flex>
            <Box className="members-table">
              {members.map((member) => (
                <Flex className="member-row" key={member.email} align="center" gap="3">
                  <Box className="member-avatar">{member.initials}</Box>
                  <Box flex="1" minW="0"><Text fontWeight="700" truncate>{member.name}</Text><Text fontSize="xs" color="var(--muted)" truncate>{member.email}</Text></Box>
                  <StatusChip tone={member.status === "Active" ? "healthy" : "neutral"}>{member.status}</StatusChip>
                  <Box className="member-role">{member.role}</Box>
                  <Button className="icon-button subtle-button" aria-label={`Member management for ${member.name} requires the database integration`} title="Role changes are unavailable in the local demo" disabled><MoreHorizontal size={18} /></Button>
                </Flex>
              ))}
            </Box>
          </Box>
        </Box>

        <Box className="access-sidebar">
          <Box className="access-setting">
            <Flex align="center" gap="3"><LockKeyhole size={18} /><Heading as="h2" fontSize="md">Link security</Heading></Flex>
            <Text fontSize="sm" color="var(--muted)" mt="3">Copying this prototype’s URL never grants access. Unauthorized requests reveal no names, counts, or assets.</Text>
            <Button className="secondary-button" width="100%" mt="4" onClick={() => { void navigator.clipboard?.writeText(window.location.href); announce("Protected prototype link copied"); }}><Link2 size={16} /> Copy protected link</Button>
          </Box>
          <Box className="access-setting">
            <Flex align="center" gap="3"><ShieldCheck size={18} /><Heading as="h2" fontSize="md">Viewer downloads</Heading></Flex>
            <Flex justify="space-between" align="center" mt="4" gap="4">
              <Text fontSize="sm">Allow viewers to download permitted exports</Text>
              <label className="switch"><input type="checkbox" checked={downloads} onChange={(event) => { setDownloads(event.target.checked); announce(`Viewer downloads ${event.target.checked ? "enabled" : "disabled"}`); }} /><span /></label>
            </Flex>
            <Text fontSize="xs" color="var(--muted)" mt="3">Downloaded copies cannot be revoked after access changes.</Text>
          </Box>
          <Box className="access-setting">
            <Flex align="center" gap="3"><Clock3 size={18} /><Heading as="h2" fontSize="md">Audit trail</Heading></Flex>
            <Text fontSize="sm" color="var(--muted)" mt="3">Invitations, role changes, ownership actions, and downloads are recorded with safe identifiers.</Text>
            <button className="text-link text-link--block" onClick={() => onNavigate("history", "Audit-related prototype history opened")}>View access activity</button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
