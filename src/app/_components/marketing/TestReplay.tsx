"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  SegmentGroup,
  Slider,
  Text,
} from "@chakra-ui/react";
import { MousePointer2, Pause, Play, RotateCcw } from "lucide-react";
import { NorthstarScreen, screenNames } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading } from "./shared";
import { useDemoPlayback } from "./useDemoPlayback";

export function TestReplay() {
  const [speed, setSpeed] = useState("1");
  const { attach, phase, playing, reducedMotion, replay, seek, toggle } =
    useDemoPlayback({
      autoplay: false,
      loop: false,
      steps: 103,
      interval: 1000 / Number(speed),
    });
  const screen =
    phase < 14 ? 0 : phase < 32 ? 1 : phase < 51 ? 2 : phase < 85 ? 3 : 4;
  const timestamp = `${String(Math.floor(phase / 60)).padStart(2, "0")}:${String(phase % 60).padStart(2, "0")}`;

  return (
    <Section bg="white" color="gray.900">
      <Box maxW="1280px" mx="auto" ref={attach}>
        <SectionHeading
          number="07 / Real-user testing"
          title="Watch real users move through the prototype."
          description="Replay the journey. Notice the hesitation. Ask better questions. Metrics are observations, not conclusions."
        />
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 280px" }}
          borderWidth="1px"
          borderColor="gray.300"
          rounded="lg"
          overflow="hidden"
        >
          <Box bg="gray.100" p={{ base: "5", md: "8" }}>
            <Flex justify="space-between" mb="5">
              <Eyebrow>SESSION_04 / Replay</Eyebrow>
              <Text fontFamily="mono" fontSize="10px" color="gray.600">
                {timestamp} / 01:42
              </Text>
            </Flex>
            <Box
              position="relative"
              maxW="360px"
              mx="auto"
              borderWidth="1px"
              borderColor="gray.300"
              rounded="md"
              overflow="hidden"
            >
              <NorthstarScreen screen={screen} />
              <Icon
                aria-hidden="true"
                position="absolute"
                top={`${25 + (phase % 8) * 6}%`}
                left={`${40 + (phase % 4) * 7}%`}
                size="md"
                color="blue.600"
                transition="top 400ms linear, left 400ms linear"
                _motionReduce={{ transition: "none" }}
              >
                <MousePointer2 />
              </Icon>
            </Box>
            <Slider.Root
              colorPalette="blue"
              mt="6"
              value={[phase]}
              min={0}
              max={102}
              step={1}
              onValueChange={(event) => seek(event.value[0])}
            >
              <Slider.Label fontSize="xs" color="gray.600">
                Replay position
              </Slider.Label>
              <Slider.Control minH="44px">
                <Slider.Track bg="gray.300">
                  <Slider.Range bg="blue.600" />
                </Slider.Track>
                <Slider.Thumb index={0} bg="blue.600" borderColor="blue.600">
                  <Slider.HiddenInput />
                </Slider.Thumb>
              </Slider.Control>
              <Slider.Marks
                marks={[
                  { value: 14, label: "click" },
                  { value: 32, label: "screen" },
                  { value: 63, label: "click" },
                  { value: 85, label: "screen" },
                ]}
              />
            </Slider.Root>
            <Flex mt="8" gap="3" align="center" wrap="wrap">
              <Button
                variant="outline"
                minH="44px"
                borderColor="gray.400"
                onClick={toggle}
                disabled={reducedMotion}
              >
                <Icon size="sm">{playing ? <Pause /> : <Play />}</Icon>
                {playing ? "Pause replay" : "Play replay"}
              </Button>
              <Button variant="ghost" minH="44px" onClick={replay}>
                <Icon size="sm">
                  <RotateCcw />
                </Icon>
                Restart replay
              </Button>
            </Flex>
            <Flex mt="4" gap="3" align="center" wrap="wrap">
              <Text fontSize="xs" color="gray.600" id="replay-speed">
                Playback speed
              </Text>
              <SegmentGroup.Root
                value={speed}
                onValueChange={(event) => setSpeed(event.value ?? "1")}
                aria-labelledby="replay-speed"
                size="sm"
              >
                <SegmentGroup.Indicator />
                {["0.5", "1", "1.5", "2"].map((value) => (
                  <SegmentGroup.Item
                    key={value}
                    value={value}
                    minH="44px"
                    minW="44px"
                  >
                    <SegmentGroup.ItemText>{value}×</SegmentGroup.ItemText>
                    <SegmentGroup.ItemHiddenInput />
                  </SegmentGroup.Item>
                ))}
              </SegmentGroup.Root>
            </Flex>
            {reducedMotion && (
              <Text mt="3" fontSize="xs" color="gray.600">
                Reduced motion: use the timeline to explore each screen.
              </Text>
            )}
          </Box>
          <Box
            p="6"
            bg="white"
            borderLeftWidth={{ base: "0", md: "1px" }}
            borderTopWidth={{ base: "1px", md: "0" }}
            borderColor="gray.200"
          >
            <Eyebrow>Participant 04</Eyebrow>
            <Text mt="3" fontWeight="600">
              Applicant journey
            </Text>
            <Box as="dl" mt="8">
              {[
                ["Screen", screenNames[screen]],
                ["Time on screen", screen === 2 ? "18.2s" : "—"],
                ["Clicks", screen === 2 ? "3" : "—"],
              ].map(([name, value]) => (
                <Box
                  key={name}
                  py="4"
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                >
                  <Text as="dt" fontSize="xs" color="gray.600">
                    {name}
                  </Text>
                  <Text
                    as="dd"
                    fontFamily="Manrope, sans-serif"
                    fontSize="xl"
                    mt="2"
                  >
                    {value}
                  </Text>
                </Box>
              ))}
            </Box>
            <Text fontSize="xs" mt="8" lineHeight="1.7" color="gray.600">
              Fictional participant evidence. Scrub to 00:32 to inspect the
              Income screen. The reviewer interprets the evidence.
            </Text>
          </Box>
        </Grid>
      </Box>
    </Section>
  );
}
