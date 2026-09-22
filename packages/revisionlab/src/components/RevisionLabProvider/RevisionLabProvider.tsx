"use client";

import {
  Box,
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";
import type { ReactNode } from "react";

// Scope the reset and generated tokens to the embed, preserving the host's CSS.
const system = createSystem(
  { ...defaultConfig, globalCss: {} },
  defineConfig({
    cssVarsRoot: "[data-revisionlab-ui]",
    cssVarsPrefix: "revisionlab",
    preflight: { scope: "[data-revisionlab-ui]" },
    // Conditional tokens must target the embed itself, not the document :root.
    // The embed currently has one light appearance, independent of its host.
    conditions: {
      light: "&[data-revisionlab-ui]",
      dark: "&[data-revisionlab-ui][data-revisionlab-color-mode=dark]",
    },
  }),
);

export function RevisionLabProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <Box
        data-revisionlab-ui
        color="gray.900"
        fontFamily="body"
        fontSize="sm"
        lineHeight="1.6"
        colorPalette="blue"
      >
        {children}
      </Box>
    </ChakraProvider>
  );
}
