import { Tabs } from "@chakra-ui/react";

export function SettingsTabs({
  canManageInstallation,
  canManageAccess,
}: {
  canManageInstallation: boolean;
  canManageAccess: boolean;
}) {
  const sections = [
    ...(canManageInstallation ? [{ value: "general", label: "General" }] : []),
    { value: "system", label: "Widget" },
    ...(canManageInstallation
      ? [{ value: "notifications", label: "Notifications" }]
      : []),
    { value: "comments", label: "Comments" },
    { value: "audit", label: "Audit" },
    { value: "history", label: "History" },
    ...(canManageAccess ? [{ value: "users", label: "Users & Roles" }] : []),
    ...(canManageInstallation
      ? [{ value: "instances", label: "Workspace Instances" }]
      : []),
  ];

  return (
    <Tabs.List
      aria-label="Settings sections"
      colorPalette="blue"
      borderBottomWidth="0"
      minH="11"
      gap={{ base: "2", md: "5" }}
      flexWrap="wrap"
      w="full"
    >
      {sections.map((section) => (
        <Tabs.Trigger
          key={section.value}
          value={section.value}
          minH="11"
          h="auto"
          minW="0"
          px="1"
          py="3"
          maxW="full"
          whiteSpace="normal"
          textAlign="start"
          color="fg.muted"
          _selected={{ color: "blue.fg" }}
          focusRing="inside"
          focusRingColor="blue.focusRing"
          _motionReduce={{ transition: "none" }}
        >
          {section.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
