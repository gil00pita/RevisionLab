import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/provider";
import { RevisionLabWidget } from "revisionlab";

export const metadata: Metadata = {
  title: "RevisionLab | Prototype review workspace",
  description:
    "Record prototype journeys and review their screens, versions, and feedback.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {/* THESIS: captured journeys connect prototype screens with durable feedback.
        OWN-WORLD: white paper, navy tools, blue active states, supplied blue RevisionLab mark.
        STORY: capture a persona's journey, review versions, and resolve feedback.
        FIRST VIEWPORT: project navigation, recorded flows, dominant screen, contextual comments.
        FORM: inherited operate-first review workspace; revisionlab-embedded-v1.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
        <template
          id="revisionlab-design-contract"
          dangerouslySetInnerHTML={{
            __html:
              "<!-- THESIS: captured journeys connect prototype screens with durable feedback. OWN-WORLD: white paper, navy tools, blue active states, supplied blue RevisionLab mark. STORY: capture a persona's journey, review versions, and resolve feedback. FIRST VIEWPORT: project navigation, recorded flows, dominant screen, contextual comments. FORM: inherited operate-first review workspace; revisionlab-embedded-v1. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->",
          }}
        />
        <Provider>{children}</Provider>
        <RevisionLabWidget />
      </body>
    </html>
  );
}
