import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/figtree";
import "./globals.css";
import { Providers } from "./providers";
import { DirectionContract } from "./direction-contract";

export const metadata: Metadata = {
  title: "RevisionLab — Prototype control",
  description: "Build, version, record, share, and export responsive prototype flows.",
};

const directionContract = `THESIS: Every prototype is an inspectable operating route; refuse the generic card-grid dashboard.
OWN-WORLD: Warm ivory control field, matte charcoal rail, safety-orange routes, chartreuse health marks, ruled rows, circular stations, and compact rectangular controls.
STORY: Find a private prototype, read its operational state, unfold its journey, then open, record, compare, share, or export it.
FIRST VIEWPORT: A 216px rail frames Prototype control; Checkout service opens across a dense traffic table, with its route and activity visible before quieter rows and a health strip.
FORM: Signal Desk / Traffic Table, sixth grounded direction, seed b4ea4c39.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DirectionContract contract={directionContract} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
