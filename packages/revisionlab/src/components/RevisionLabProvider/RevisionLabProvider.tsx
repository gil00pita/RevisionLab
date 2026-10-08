"use client";

import { Box, ChakraProvider } from "@chakra-ui/react";
import { useSyncExternalStore, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { system } from "./theme.js";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function RevisionLabProvider({ children }: { children: ReactNode }) {
  const clientMounted = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );

  return (
    <ChakraProvider value={system}>
      <ThemeProvider
        attribute="data-revisionlab-color-mode"
        storageKey="revisionlab-color-mode"
        defaultTheme="light"
        enableSystem={false}
        enableColorScheme={false}
        disableTransitionOnChange
        // The bootstrap script runs on server-rendered pages; client navigation uses provider effects.
        scriptProps={clientMounted ? { type: "text/plain" } : undefined}
      >
        <Box
          data-revisionlab-ui
          color="fg"
          fontFamily="body"
          fontSize="sm"
          lineHeight="1.6"
          colorPalette="blue"
        >
          {children}
        </Box>
      </ThemeProvider>
    </ChakraProvider>
  );
}
