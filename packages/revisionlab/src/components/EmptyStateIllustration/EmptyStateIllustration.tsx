import { Icon } from "@chakra-ui/react";
import { DoneIllustration } from "./components/DoneIllustration.js";
import { EmptyInboxIllustration } from "./components/EmptyInboxIllustration.js";
import { ErrorIllustration } from "./components/ErrorIllustration.js";
import { NoConnectionIllustration } from "./components/NoConnectionIllustration.js";
import { NoCreditCardIllustration } from "./components/NoCreditCardIllustration.js";
import { NoDocumentsIllustration } from "./components/NoDocumentsIllustration.js";
import { NoGPSIllustration } from "./components/NoGPSIllustration.js";
import { NoImagesIllustration } from "./components/NoImagesIllustration.js";
import { NoItemsCartIllustration } from "./components/NoItemsCartIllustration.js";
import { NoMessagesIllustration } from "./components/NoMessagesIllustration.js";

const illustrations = {
  done: DoneIllustration,
  inbox: EmptyInboxIllustration,
  error: ErrorIllustration,
  connection: NoConnectionIllustration,
  creditCard: NoCreditCardIllustration,
  documents: NoDocumentsIllustration,
  journey: NoGPSIllustration,
  images: NoImagesIllustration,
  cart: NoItemsCartIllustration,
  messages: NoMessagesIllustration,
};

export type EmptyStateIllustrationVariant = keyof typeof illustrations;

export function EmptyStateIllustration({
  variant,
  size = "md",
}: {
  variant: EmptyStateIllustrationVariant;
  size?: "sm" | "md" | "lg";
}) {
  const Illustration = illustrations[variant];
  return (
    <Icon
      as="svg"
      viewBox="0 0 250 200"
      fill="none"
      color="blue.fg"
      aria-hidden="true"
      focusable="false"
      w={size === "sm" ? "32" : size === "md" ? "48" : "64"}
      maxW="full"
      h="auto"
      aspectRatio="5/4"
      flexShrink="0"
      data-empty-state-illustration={variant}
    >
      <Illustration />
    </Icon>
  );
}
