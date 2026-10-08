"use client";
import { Box, Flex, Grid, Icon, IconButton, Text } from "@chakra-ui/react";
import { Pause, Play } from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";
import { Eyebrow } from "./shared";
import { useDemoPlayback } from "./useDemoPlayback";

export function FinalReviewLoop() {
  const { attach, phase, playing, reducedMotion, toggle } = useDemoPlayback({
    steps: 7,
    interval: 2200,
  });
  const stages = [
    "Prototype",
    "Flow",
    "Feedback",
    "Evidence",
    "Decision",
    "Change",
    "Prototype vNext",
  ];
  return (
    <Box ref={attach}>
      <Flex justify="space-between" mb="4" align="center">
        <Eyebrow light>The loop stays connected</Eyebrow>
        <IconButton
          variant="ghost"
          color="gray.300"
          minH="44px"
          minW="44px"
          px="3"
          onClick={toggle}
          disabled={reducedMotion}
          aria-label={
            playing ? "Pause final review loop" : "Play final review loop"
          }
        >
          <Icon size="sm">{playing ? <Pause /> : <Play />}</Icon>
        </IconButton>
      </Flex>
      <Grid templateColumns="1fr 1fr" gap="5" alignItems="center">
        <Box
          borderWidth="1px"
          borderColor="gray.700"
          rounded="md"
          overflow="hidden"
        >
          <NorthstarScreen screen={2} compact version={phase === 6 ? 4 : 3} />
        </Box>
        <Box>
          {stages.map((stage, i) => (
            <Flex
              key={stage}
              gap="3"
              align="center"
              minH="36px"
              borderLeftWidth="1px"
              borderColor={i === phase ? "signal" : "gray.700"}
              ps="3"
            >
              <Text fontFamily="mono" fontSize="8px" color="gray.400">
                0{i + 1}
              </Text>
              <Text
                fontSize="11px"
                color={i === phase ? "blue.200" : "gray.400"}
              >
                {stage}
              </Text>
            </Flex>
          ))}
        </Box>
      </Grid>
      <Text fontFamily="mono" fontSize="9px" color="blue.300" mt="4">
        {phase === 6
          ? "VERSION_04 · READY FOR ANOTHER REVIEW"
          : "VERSION_03 → EVIDENCE → REVIEWED CHANGE"}
      </Text>
    </Box>
  );
}
