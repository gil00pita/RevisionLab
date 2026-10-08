import { Box, Button, Flex, Icon, Text } from "@chakra-ui/react";
import { NorthstarFields } from "./NorthstarFields";
import { ArrowRight, Check, LockKeyhole, MoveUpRight } from "lucide-react";

export const screenNames = [
  "Finance options",
  "Applicant details",
  "Income",
  "Review",
  "Confirmation",
];
interface NorthstarScreenProps {
  screen?: number;
  compact?: boolean;
  version?: 3 | 4;
  onContinue?: () => void;
  onComment?: () => void;
  highlight?: boolean;
}

export function NorthstarScreen({
  screen = 0,
  compact = false,
  version = 3,
  onContinue,
  onComment,
  highlight = false,
}: NorthstarScreenProps) {
  const titles = [
    "Find the right finance plan.",
    "A little about you.",
    "Let’s check affordability.",
    "Everything look right?",
    "You’re on your way.",
  ];
  return (
    <Box
      bg="white"
      aria-hidden={compact && !onContinue && !onComment ? true : undefined}
      color="gray.800"
      borderRadius="sm"
      overflow="hidden"
      h="full"
    >
      <Flex
        align="center"
        justify="space-between"
        px={compact ? "3" : { base: "5", md: "7" }}
        py={compact ? "2" : "4"}
        borderBottomWidth="1px"
        borderColor="gray.100"
      >
        <Flex align="center" gap="1.5">
          <Icon color="teal.700" boxSize={compact ? "12px" : "19px"}>
            <MoveUpRight />
          </Icon>
          <Text
            fontFamily="Manrope, sans-serif"
            fontWeight="800"
            fontSize={compact ? "9px" : "sm"}
            whiteSpace="nowrap"
          >
            northstar
            <Text as="span" fontWeight="400" color="gray.500">
              {" "}
              finance
            </Text>
          </Text>
        </Flex>
        {!compact && (
          <Text fontSize="10px" color="gray.600">
            A clearer road ahead.
          </Text>
        )}
      </Flex>
      <Box px={compact ? "3" : { base: "5", md: "7" }} py={compact ? "3" : "6"}>
        <Text
          fontSize={compact ? "7px" : "10px"}
          textTransform="uppercase"
          letterSpacing="0.1em"
          truncate
          color="teal.700"
          fontWeight="700"
        >
          Vehicle finance · {screen + 1} of 5
        </Text>
        <Text
          fontWeight="700"
          lineClamp={compact ? 2 : undefined}
          fontFamily="Manrope, sans-serif"
          fontSize={compact ? "11px" : { base: "21px", md: "25px" }}
          lineHeight="1.3"
          letterSpacing="-0.04em"
          mt={compact ? "2" : "3"}
          mb={compact ? "3" : "5"}
        >
          {titles[screen]}
        </Text>
        {screen < 4 ? (
          <>
            {screen === 2 && version === 4 && (
              <Box
                bg="teal.50"
                borderRadius="md"
                p={compact ? "2" : "3"}
                mb="3"
              >
                <Text fontSize={compact ? "8px" : "12px"} color="teal.800">
                  Your estimated repayment:{" "}
                  <Text as="span" fontWeight="bold">
                    £542 / month
                  </Text>
                </Text>
              </Box>
            )}
            <NorthstarFields
              screen={screen}
              compact={compact}
              highlight={highlight}
            />
            {screen === 0 && (
              <Flex
                mt={compact ? "3" : "5"}
                align="baseline"
                justify="space-between"
              >
                <Text color="gray.600" fontSize={compact ? "7px" : "11px"}>
                  Estimated payment
                </Text>
                <Text
                  fontSize={compact ? "12px" : "26px"}
                  fontWeight="700"
                  letterSpacing="-0.04em"
                >
                  £542
                  <Text
                    as="span"
                    fontSize={compact ? "7px" : "11px"}
                    fontWeight="400"
                    color="gray.500"
                  >
                    {" "}
                    / month
                  </Text>
                </Text>
              </Flex>
            )}
            {screen === 2 && version === 3 && (
              <Flex mt="3" align="center" justify="space-between">
                <Text fontSize={compact ? "7px" : "11px"} color="gray.600">
                  Estimate: £542 / month
                </Text>
                {onComment && (
                  <Button
                    size="sm"
                    minH="44px"
                    minW="44px"
                    rounded="full"
                    bg="blue.600"
                    color="white"
                    aria-label="Open Sarah’s comment on the repayment estimate"
                    onClick={onComment}
                  >
                    1
                  </Button>
                )}
              </Flex>
            )}
            {onContinue ? (
              <Button
                mt="5"
                w="full"
                minH="44px"
                bg="teal.800"
                color="white"
                borderRadius="sm"
                fontSize="12px"
                onClick={onContinue}
                _hover={{ bg: "teal.900" }}
              >
                {screen === 3
                  ? "Submit example"
                  : version === 4 && screen === 2
                    ? "Review application"
                    : "Continue"}
                <Icon size="sm">
                  <ArrowRight />
                </Icon>
              </Button>
            ) : (
              <Button
                disabled
                unstyled
                display="flex"
                w="full"
                minH={compact ? "0" : "44px"}
                mt={compact ? "3" : "5"}
                bg="teal.800"
                color="white"
                borderRadius="sm"
                py={compact ? "1.5" : "3"}
                px="3"
                justifyContent="space-between"
                alignItems="center"
                _disabled={{ opacity: 1, cursor: "default" }}
              >
                <Text fontSize={compact ? "7px" : "11px"}>
                  {screen === 3
                    ? "Submit example"
                    : version === 4 && screen === 2
                      ? "Review application"
                      : "Continue"}
                </Text>
                <Icon boxSize={compact ? "8px" : "13px"}>
                  <ArrowRight />
                </Icon>
              </Button>
            )}
          </>
        ) : (
          <Box py={compact ? "2" : "8"} textAlign="center">
            <Icon
              boxSize={compact ? "20px" : "44px"}
              color="teal.700"
              bg="teal.50"
              rounded="full"
              p="1"
            >
              <Check />
            </Icon>
            <Text fontSize={compact ? "8px" : "sm"} mt="3" fontWeight="600">
              Application received
            </Text>
            <Text fontSize={compact ? "7px" : "xs"} color="gray.600" mt="2">
              Reference NS–2048
            </Text>
          </Box>
        )}
        {!compact && (
          <Flex mt="4" gap="1.5" align="center" color="gray.500">
            <Icon boxSize="10px">
              <LockKeyhole />
            </Icon>
            <Text fontSize="9px">
              Fictional prototype · no application is submitted
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
