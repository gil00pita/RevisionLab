import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/provider";

export const metadata: Metadata = {
  title: "RevisionLab | Prototype review workspace",
  description: "Turn interactive prototypes into reviewable, executable flows.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {/* THESIS: an executable flow is the review artifact, not a dashboard of detached records.
        OWN-WORLD: whiteboard paper, navy tooling, ink-blue data, and red review marks.
        STORY: reviewers see what changed, select a meaningful screen, and leave durable feedback.
        FIRST VIEWPORT: quiet rail, active flow header, canvas as the dominant work surface, comments at right.
        FORM: operate-first review canvas with coupon-like screen states; finish review closes the loop. */}
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
