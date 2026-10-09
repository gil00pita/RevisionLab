import { Skeleton, Stack, VisuallyHidden } from "@chakra-ui/react";

export function TicketSkeleton() {
  return (
    <Stack
      p="5"
      gap="4"
      borderWidth="1px"
      borderColor="blue.border"
      rounded="lg"
      bg="blue.subtle"
      aria-busy="true"
      aria-label="Generating ticket preview"
    >
      <VisuallyHidden role="status">
        Codex is preparing your ticket preview…
      </VisuallyHidden>
      <Stack gap="4" aria-hidden="true">
        <Skeleton h="6" w="80%" _motionReduce={{ animation: "none" }} />
        <Skeleton h="32" _motionReduce={{ animation: "none" }} />
        <Skeleton h="5" w="50%" _motionReduce={{ animation: "none" }} />
        <Skeleton h="20" _motionReduce={{ animation: "none" }} />
        <Skeleton h="16" w="36" _motionReduce={{ animation: "none" }} />
      </Stack>
      <VisuallyHidden>
        Related feedback is being grouped and linked to its screenshots. You can
        cancel this run.
      </VisuallyHidden>
    </Stack>
  );
}
