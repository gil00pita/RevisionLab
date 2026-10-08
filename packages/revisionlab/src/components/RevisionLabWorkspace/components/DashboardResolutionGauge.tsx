import { EmptyStateIllustration } from "../../EmptyStateIllustration/index.js";
import { Box, Progress, Stack, Text } from "@chakra-ui/react";

const segmentCount = 48;

export function DashboardResolutionGauge({
  comments,
  resolvedComments,
  current,
}: {
  comments: number | null;
  resolvedComments: number | null;
  current: boolean;
}) {
  const available = comments !== null && resolvedComments !== null;
  const percentage = available && comments > 0 ? resolvedComments / comments * 100 : null;
  const percentageText = percentage?.toLocaleString("en", { maximumFractionDigits: 1 });
  const label = !available ? "Progress unavailable" : comments === 0 ? "No comment threads yet" : current ? "Resolved" : "Last loaded";
  const center = (
    <Stack position="absolute" inset="20%" align="center" justify="center" gap="1" textAlign="center" pointerEvents="none">
      <Text fontSize="2xl" fontWeight="semibold" letterSpacing="tight" color="fg" bg="bg.panel" lineHeight="short" overflowWrap="anywhere">
        {percentageText === undefined ? "—" : `${percentageText}%`}
      </Text>
      <Text fontSize="xs" color="fg.muted" bg="bg.panel" overflowWrap="anywhere">{label}</Text>
    </Stack>
  );

  if (percentage === null) {
    return (
      <Stack w="full" maxW="64" minH="64" mx="auto" align="center" justify="center" gap="3" textAlign="center">
        <EmptyStateIllustration variant={available ? "messages" : "documents"} />
        <Text fontSize="xs" color="fg.muted" overflowWrap="anywhere">{label}</Text>
      </Stack>
    );
  }

  const filledSegments = Math.round(percentage / 100 * segmentCount);
  return (
    <Progress.Root unstyled value={percentage} w="full" maxW="64" mx="auto">
      <Progress.Track position="relative" w="full" h="auto" aspectRatio="1" aria-label="Resolved comment threads" aria-valuetext={`${resolvedComments} of ${comments} threads resolved`}>
        {Array.from({ length: segmentCount }, (_, index) => (
          <Box key={index} position="absolute" top="0" left="50%" h="50%" w="4px" transformOrigin="center bottom" transform={`translateX(-50%) rotate(${-140 + index * 280 / (segmentCount - 1)}deg)`} aria-hidden="true">
            <Box h="20px" w="full" borderRadius="full" bg={current
              ? index < filledSegments ? "blue.solid" : "blue.subtle"
              : index < filledSegments ? "fg.muted" : "bg.emphasized"} />
          </Box>
        ))}
        {center}
      </Progress.Track>
    </Progress.Root>
  );
}
