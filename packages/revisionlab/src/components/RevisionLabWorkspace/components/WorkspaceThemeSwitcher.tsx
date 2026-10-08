"use client";

import { Button, ClientOnly, Icon, Skeleton } from "@chakra-ui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function WorkspaceThemeSwitcher() {
  return (
    <ClientOnly fallback={<Skeleton h="11" w="full" _motionReduce={{ animation: "none" }} />}>
      <ThemeToggle />
    </ClientOnly>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      variant="ghost"
      w="full"
      minH="11"
      justifyContent="flex-start"
      color="fg"
      _hover={{ bg: "bg.muted" }}
      focusRing="inside"
      aria-label={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Icon aria-hidden="true">{dark ? <Sun /> : <Moon />}</Icon>
      {dark ? "Light mode" : "Dark mode"}
    </Button>
  );
}
