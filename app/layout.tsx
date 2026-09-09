import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/figtree";
import "./globals.css";
import { Providers } from "./providers";
import directionContract from "./direction-contract.json";

export const metadata: Metadata = {
  title: "RevisionLab — Prototype control",
  description: "Build, version, record, share, and export responsive prototype flows.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-direction-seed="b4ea4c39">
      <body data-direction-contract={directionContract.contract}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
