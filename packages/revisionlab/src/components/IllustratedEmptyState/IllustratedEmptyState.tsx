import { EmptyState } from "@chakra-ui/react";
import {
  EmptyStateIllustration,
  type EmptyStateIllustrationVariant,
} from "../EmptyStateIllustration/index.js";

export function IllustratedEmptyState({
  illustration,
  description,
  size = "md",
}: {
  illustration: EmptyStateIllustrationVariant;
  description: string;
  size?: "sm" | "md";
}) {
  return (
    <EmptyState.Root size={size} p={size === "sm" ? "4" : "6"}>
      <EmptyState.Content gap="3" minW="0">
        <EmptyState.Indicator maxW="full">
          <EmptyStateIllustration variant={illustration} size={size} />
        </EmptyState.Indicator>
        <EmptyState.Description
          color="fg.muted"
          textAlign="center"
          maxW="xl"
          overflowWrap="anywhere"
        >
          {description}
        </EmptyState.Description>
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
