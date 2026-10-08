import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { commentBubbleColors } from "../../comment-settings.js";

// The supplied widget mark is white, so its saved hue needs a dark surface in
// either mode. Keep these role definitions out of component presentation.
const widgetColors = Object.fromEntries(
  commentBubbleColors.map((color) => [
    color,
    {
      solid: { value: `{colors.${color}.${color === "blue" ? "600" : "700"}}` },
      contrast: { value: "{colors.white}" },
      outline: { value: `{colors.${color}.800}` },
    },
  ]),
);

const config = defineConfig({
  cssVarsRoot: "[data-revisionlab-ui]",
  cssVarsPrefix: "revisionlab",
  preflight: { scope: "[data-revisionlab-ui]" },
  // Keep tokens on each embed/portal root. Support an existing host next-themes
  // provider, which takes precedence over a nested provider.
  conditions: {
    light: "&:not(:where([data-revisionlab-color-mode=dark] *, .dark *, [data-theme=dark] *))",
    dark: "&:where([data-revisionlab-color-mode=dark] *, .dark *, [data-theme=dark] *)",
  },
  theme: {
    semanticTokens: {
      colors: {
        blue: {
          focusRing: {
            value: { _light: "{colors.blue.700}", _dark: "{colors.blue.300}" },
          },
        },
        // Chakra's default fills for these palettes do not meet 4.5:1 with
        // their contrast text. Override the common role for readable bubbles.
        green: { solid: { value: "{colors.green.700}" } },
        teal: { solid: { value: "{colors.teal.700}" } },
        cyan: { solid: { value: "{colors.cyan.700}" } },
        orange: {
          solid: {
            value: { _light: "{colors.orange.700}", _dark: "{colors.orange.500}" },
          },
        },
        widget: widgetColors,
      },
    },
  },
});

// Scope the reset and generated tokens to the embed, preserving the host's CSS.
export const system = createSystem({ ...defaultConfig, globalCss: {} }, config);
export default system;
