"use client";

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";
import type { ReactNode } from "react";

// Keep the example's exact signal colour inside the marketing theme; the root
// provider and embedded workspace continue to use their existing system.
const marketingSystem = createSystem(
  defaultConfig,
  defineConfig({
    theme: { tokens: { colors: { signal: { value: "#1E9ADC" } } } },
  }),
);

export function MarketingTheme({ children }: { children: ReactNode }) {
  return <ChakraProvider value={marketingSystem}>{children}</ChakraProvider>;
}
