import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { DashboardResolutionGauge } from "./DashboardResolutionGauge.js";

export function DashboardResolutionCard({
  comments,
  resolvedComments,
  current,
}: {
  comments: number | null;
  resolvedComments: number | null;
  current: boolean;
}) {
  const available = comments !== null && resolvedComments !== null;
  const open = available ? comments - resolvedComments : null;
  const details = [
    { label: "Resolved threads", value: resolvedComments, color: current ? "blue.500" : "gray.500" },
    { label: "Open threads", value: open, color: current ? "blue.100" : "gray.200" },
  ];

  return (
    <Stack gap="4" pb="6" borderBottomWidth="1px" borderColor="gray.100" minW="0">
      <Heading as="h2" fontSize="md" fontWeight="medium" color="gray.900">Comment resolution</Heading>
      <DashboardResolutionGauge comments={comments} resolvedComments={resolvedComments} current={current} />
      <Stack gap="3">
        {details.map((detail) => (
          <Flex key={detail.label} align="center" justify="space-between" gap="3" minW="0">
            <Flex gap="2" align="center" minW="0">
              <Box boxSize="2" bg={detail.color} borderRadius="full" flexShrink="0" aria-hidden="true" />
              <Text fontSize="xs" color="gray.600" overflowWrap="anywhere">{detail.label}</Text>
            </Flex>
            <Text fontSize="sm" fontWeight="medium" color="gray.900" overflowWrap="anywhere">
              {detail.value === null ? "Unavailable" : detail.value.toLocaleString("en")}
            </Text>
          </Flex>
        ))}
      </Stack>
      <Text color="gray.600" fontSize="xs" lineHeight="tall">
        {!available ? "Comment totals are unavailable for this workspace." : current ? "Progress across your comment threads." : "Based on last-loaded comment threads. A complete sync is needed to confirm progress."}
      </Text>
    </Stack>
  );
}
