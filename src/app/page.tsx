import { Box } from "@chakra-ui/react";
import { MarketingHero } from "./_components/marketing/MarketingHero";
import { RecordingSection } from "./_components/marketing/RecordingSection";
import { DuplicationSection } from "./_components/marketing/DuplicationSection";
import { WorkflowSection } from "./_components/marketing/WorkflowSection";
import { FlowWorkspace } from "./_components/marketing/FlowWorkspace";
import { ContextualComments } from "./_components/marketing/ContextualComments";
import { AccessibilityEvidence } from "./_components/marketing/AccessibilityEvidence";
import { TestReplay } from "./_components/marketing/TestReplay";
import { FeedbackTickets } from "./_components/marketing/FeedbackTickets";
import { ReviewedChange } from "./_components/marketing/ReviewedChange";
import { VersionHistory } from "./_components/marketing/VersionHistory";
import { PeopleSection } from "./_components/marketing/PeopleSection";
import { ProjectArchitecture } from "./_components/marketing/ProjectArchitecture";
import { MarketingClosing } from "./_components/marketing/MarketingClosing";
import { MarketingNavigation } from "./_components/marketing/MarketingNavigation";
import { MarketingSiteFooter } from "./_components/marketing/MarketingSiteFooter";
import { MarketingTheme } from "./_components/marketing/MarketingTheme";

export const metadata = {
  title: "RevisionLab — Your prototype is already the documentation",
  description:
    "Build the prototype once. Don’t rebuild it for review. Record journeys, connect evidence and turn feedback into reviewed development work. Free and project-owned.",
};

export default function Home() {
  return (
    <MarketingTheme>
      <Box id="marketing-site" fontFamily="'DM Sans', sans-serif">
        <MarketingNavigation />
        <Box as="main" id="main" tabIndex={-1} outline="none">
          <MarketingHero />
          <RecordingSection />
          <DuplicationSection />
          <WorkflowSection />
          <FlowWorkspace />
          <ContextualComments />
          <AccessibilityEvidence />
          <TestReplay />
          <FeedbackTickets />
          <ReviewedChange />
          <VersionHistory />
          <PeopleSection />
          <ProjectArchitecture />
          <MarketingClosing />
        </Box>
        <MarketingSiteFooter />
      </Box>
    </MarketingTheme>
  );
}
