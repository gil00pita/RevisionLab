import { chakra } from "@chakra-ui/react";

// Chakra has no exported SVG shape primitives. These shared typed components
// preserve native geometry attributes (especially path d) while resolving
// token-aware fills and strokes through the surrounding Chakra provider.
export const IllustrationPath = chakra("path");
export const IllustrationRect = chakra("rect");
export const IllustrationCircle = chakra("circle");
export const IllustrationMask = chakra("mask");
export const IllustrationUse = chakra("use");
export const IllustrationDefs = chakra("defs");
