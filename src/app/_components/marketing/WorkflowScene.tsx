import { Box, Flex, Grid, Icon, Text } from "@chakra-ui/react";
import {
  ArrowRight,
  Check,
  MessageSquare,
  ScanLine,
  UserRound,
} from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";
import { CapturedJourney } from "./CapturedJourney";
import { Eyebrow } from "./shared";

export function WorkflowScene({ phase }: { phase: number }) {
  return (
    <Box
      bg="gray.900"
      color="gray.100"
      borderRadius="lg"
      p={{ base: "5", md: "8" }}
      mt="7"
    >
      <Flex mb="6" justify="space-between" gap="4" wrap="wrap">
        <Eyebrow light>
          {phase < 3
            ? "Live prototype / Recording"
            : phase < 6
              ? "Review workspace / Evidence"
              : "Feedback Review / Delivery"}
        </Eyebrow>
        <Text fontFamily="mono" fontSize="10px" color="gray.400">
          FLOW_04 · VERSION_0{phase === 8 ? "4" : "3"}
        </Text>
      </Flex>
      <Grid
        templateColumns={{ base: "1fr", md: "220px 1fr 1fr" }}
        gap={{ base: "5", md: "8" }}
        alignItems="center"
      >
        <Box
          maxW="220px"
          w="full"
          mx="auto"
          transform={phase >= 2 ? "translateY(-4px)" : "translateY(0)"}
          transition="transform 500ms"
          _motionReduce={{ transition: "none" }}
        >
          <Box
            borderWidth="1px"
            borderColor={phase >= 2 ? "signal" : "gray.500"}
            rounded="md"
            overflow="hidden"
          >
            <NorthstarScreen
              compact
              screen={phase === 0 ? 0 : 2}
              version={phase === 8 ? 4 : 3}
            />
          </Box>
          <Text fontFamily="mono" fontSize="9px" color="blue.300" mt="3">
            {phase === 1
              ? "REC · JOURNEY IN PROGRESS"
              : phase >= 2
                ? "SCREEN_03 · SOURCE PRESERVED"
                : "INTERACTIVE PROTOTYPE"}
          </Text>
        </Box>
        <Box minH={{ base: "0", md: "220px" }}>
          <Eyebrow light>
            {phase >= 6 ? "Evidence → decision" : "Context → evidence"}
          </Eyebrow>
          {phase >= 4 ? (
            <Box mt="4">
              <Flex
                gap="3"
                align="start"
                borderLeftWidth="1px"
                borderColor="signal"
                ps="4"
                pb="4"
              >
                <Icon color="blue.300" size="sm">
                  <MessageSquare />
                </Icon>
                <Box>
                  <Text fontSize="12px">
                    The repayment estimate needs context.
                  </Text>
                  <Text fontSize="10px" color="gray.400" mt="1">
                    Sarah · Business Analyst · Version 3
                  </Text>
                </Box>
              </Flex>
              {phase >= 5 && (
                <Flex
                  gap="3"
                  align="start"
                  borderLeftWidth="1px"
                  borderColor="signal"
                  ps="4"
                  pb="4"
                >
                  <Icon color="orange.300" size="sm">
                    <ScanLine />
                  </Icon>
                  <Box>
                    <Text fontSize="12px">
                      Monthly housing cost needs a label.
                    </Text>
                    <Text fontSize="10px" color="gray.400" mt="1">
                      Accessibility finding · Version 3
                    </Text>
                  </Box>
                </Flex>
              )}
              {phase >= 5 && (
                <Flex
                  gap="3"
                  align="start"
                  borderLeftWidth="1px"
                  borderColor="signal"
                  ps="4"
                >
                  <Icon color="blue.300" size="sm">
                    <UserRound />
                  </Icon>
                  <Box>
                    <Text fontSize="12px">
                      Participant revisited the previous screen.
                    </Text>
                    <Text fontSize="10px" color="gray.400" mt="1">
                      Observed test evidence · Version 3
                    </Text>
                  </Box>
                </Flex>
              )}
            </Box>
          ) : (
            <Box
              mt="4"
              p="5"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="gray.600"
              rounded="md"
            >
              <Text fontSize="sm" color="gray.300">
                {phase === 3
                  ? "The captured screens become a connected flow."
                  : "Every observed action leads back to its source."}
              </Text>
              <Text mt="3" fontSize="xs" color="gray.400">
                Record → capture → map
              </Text>
            </Box>
          )}
        </Box>
        <Box
          borderWidth="1px"
          borderColor={phase >= 7 ? "blue.500" : "gray.700"}
          p="5"
          rounded="md"

          _motionReduce={{ transition: "none" }}
        >
          <Eyebrow light>
            {phase >= 7
              ? "Draft → reviewed proposal"
              : "Work retains its evidence"}
          </Eyebrow>
          <Text
            fontFamily="Manrope, sans-serif"
            fontSize="20px"
            lineHeight="1.4"
            mt="4"
          >
            Improve affordability step clarity
          </Text>
          <Text mt="4" fontSize="xs" color="gray.300">
            Repayment estimate remains visible. Monthly cost has a clear label.
            Mobile layout stays readable.
          </Text>
          <Flex align="center" gap="2" mt="5" color="blue.200">
            <Icon size="sm">{phase === 8 ? <Check /> : <ArrowRight />}</Icon>
            <Text fontSize="11px">
              {phase === 8
                ? "Version 4 · ready for review"
                : phase >= 7
                  ? "3 linked sources · human review"
                  : "Evidence arrives before a decision"}
            </Text>
          </Flex>
        </Box>
      </Grid>
      <CapturedJourney phase={phase >= 3 ? 3 : phase} />
      <Text mt="5" fontSize="xs" color="gray.400">
        {phase === 8
          ? "The change returns to the prototype. Earlier evidence remains associated with version 3."
          : "Fictional journey. People interpret the evidence, agree the work and review proposed changes."}
      </Text>
    </Box>
  );
}
