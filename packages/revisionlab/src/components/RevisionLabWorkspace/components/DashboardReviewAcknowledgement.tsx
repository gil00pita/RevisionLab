import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { ArrowRight, CircleCheck, MessageSquare } from "lucide-react";

export function DashboardReviewAcknowledgement({
  comments,
  resolvedComments,
  current,
  onReviewComments,
  disabled,
}: {
  comments: number | null;
  resolvedComments: number | null;
  current: boolean;
  onReviewComments: () => void;
  disabled: boolean;
}) {
  if (!current || !comments || !resolvedComments) return null;

  const open = comments - resolvedComments;
  const complete = open === 0;
  const ReviewIcon = complete ? CircleCheck : MessageSquare;
  const count = comments.toLocaleString("en");
  const resolved = resolvedComments.toLocaleString("en");
  const remaining = open.toLocaleString("en");
  const description = complete
    ? comments === 1
      ? "The comment thread is marked as resolved."
      : `All ${count} comment threads are resolved.`
    : open === 1
      ? `${resolved} of ${count} comment threads are resolved. 1 remains open.`
      : `${resolved} of ${count} comment threads are resolved. ${remaining} remain open.`;

  return (
    <Flex
      pt="6"
      pb="8"
      borderTopWidth="1px"
      borderColor="gray.100"
      align="center"
      justify="space-between"
      gap="4"
      flexWrap="wrap"
    >
      <Flex gap="3" align="start" minW="0" maxW="full" flex="1">
        <Icon
          size="md"
          color={complete ? "green.700" : "blue.600"}
          mt="1"
          flexShrink="0"
          aria-hidden="true"
        >
          <ReviewIcon />
        </Icon>
        <Stack gap="1" minW="0">
          <Text
            color="gray.900"
            fontSize="sm"
            fontWeight="medium"
            lineHeight="tall"
            overflowWrap="anywhere"
          >
            {complete ? "Feedback, followed through." : "Comment review progress"}
          </Text>
          <Text color="gray.600" fontSize="lg" lineHeight="tall" overflowWrap="anywhere">
            {description}
          </Text>
        </Stack>
      </Flex>
      <Button
        variant="outline"
        size="sm"
        minH="11"
        h="auto"
        w={{ base: "full", md: "auto" }}
        maxW="full"
        minW="0"
        px="3"
        py="2"
        whiteSpace="normal"
        color="blue.700"
        borderColor="blue.600"
        bg="blue.50"
        _hover={{ bg: "blue.100" }}
        focusRing="outside"
        focusRingColor="blue.600"
        onClick={onReviewComments}
        disabled={disabled}
      >
        View comments
        <Icon size="sm" flexShrink="0" aria-hidden="true">
          <ArrowRight />
        </Icon>
      </Button>
    </Flex>
  );
}
