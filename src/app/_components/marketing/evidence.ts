import { MessageSquare, ScanLine, UserRound } from "lucide-react";

export const evidence = [
  {
    type: "Comment",
    id: "COMMENT_08",
    icon: MessageSquare,
    text: "The repayment calculation isn’t clear.",
    source: "Sarah M. · Income · Version 3",
    criterion:
      "Repayment estimate remains visible during affordability questions.",
  },
  {
    type: "Accessibility",
    id: "A11Y_02",
    icon: ScanLine,
    text: "Associated form control does not have an accessible name.",
    source: "Monthly housing cost · Serious · Version 3",
    criterion: "Monthly cost input has a programmatic label.",
  },
  {
    type: "Test evidence",
    id: "SESSION_04",
    icon: UserRound,
    text: "Participant revisited the previous screen before continuing.",
    source: "Participant 04 · Income · Version 3",
    criterion: "Mobile layout remains readable while reviewing affordability.",
  },
];
