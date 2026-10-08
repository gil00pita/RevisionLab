"use client";

import { Box, Button, Flex, Grid, Icon, Text } from "@chakra-ui/react";
import { Pause, Play } from "lucide-react";
import { Section, SectionHeading } from "./shared";
import { WorkflowScene } from "./WorkflowScene";
import { useDemoPlayback } from "./useDemoPlayback";

const workflow = [
  ["Prototype", "A real product, ready to explore."],
  ["Record", "Follow the applicant’s journey."],
  ["Capture", "Keep the meaningful screens."],
  ["Map", "Connect the observed path."],
  ["Review", "Pin feedback to its source."],
  ["Test", "Observe a real participant."],
  ["Understand", "Discuss the linked evidence."],
  ["Deliver", "Draft the work and review the fix."],
  ["Revise", "Version 4. Ready to learn again."],
];

export function WorkflowSection() {
  const { attach, phase, playing, reducedMotion, seek, toggle } =
    useDemoPlayback({ steps: 9, interval: 2200 });
  return (
    <Section bg="white" color="gray.900">
      <Box maxW="1280px" mx="auto" ref={attach}>
        <Flex align="start" justify="space-between" gap="5" wrap="wrap">
          <SectionHeading
            number="03 / Prototype → evidence → decision → delivery"
            title="One continuous review loop."
          />
          <Button
            variant="outline"
            minH="44px"
            onClick={toggle}
            disabled={reducedMotion}
          >
            <Icon size="sm">{playing ? <Pause /> : <Play />}</Icon>
            {reducedMotion
              ? "Static sequence"
              : playing
                ? "Pause loop"
                : "Play loop"}
          </Button>
        </Flex>
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(3, 1fr)",
            xl: "repeat(9, 1fr)",
          }}
          gap={{ base: "0", md: "3", xl: "0" }}
        >
          {workflow.map(([title, copy], i) => (
            <Button
              key={title}
              unstyled
              display="block"
              textAlign="left"
              minW="0"
              minH="44px"
              borderTopWidth={{ base: "0", md: "2px" }}
              borderLeftWidth={{ base: "2px", md: "0" }}
              borderColor={phase === i ? "blue.600" : "gray.200"}
              py="4"
              px={{ base: "5", md: "3" }}
              onClick={() => seek(i)}
              aria-label={`Explore workflow stage ${i + 1}: ${title}`}
              aria-pressed={phase === i}
              _hover={{ bg: "blue.50" }}
              _focusVisible={{
                outlineWidth: "2px",
                outlineStyle: "solid",
                outlineColor: "blue.700",
              }}
            >
              <Text fontFamily="mono" fontSize="10px" color="blue.700">
                0{i + 1}
              </Text>
              <Text
                fontFamily="Manrope, sans-serif"
                fontWeight="600"
                fontSize="md"
                mt="2"
              >
                {title}
              </Text>
              <Text mt="2" fontSize="11px" lineHeight="1.6" color="gray.600">
                {copy}
              </Text>
            </Button>
          ))}
        </Grid>
        <WorkflowScene phase={phase} />
        <Flex
          mt="6"
          pt="5"
          borderTopWidth="1px"
          borderColor="blue.200"
          align="center"
          justify="space-between"
          gap="4"
        >
          <Text color="blue.700" fontFamily="mono" fontSize="10px">
            ↳ VERSION_04 RETURNS TO THE PROTOTYPE
          </Text>
          <Text fontSize="xs" color="gray.600">
            Earlier evidence stays with version 3.
          </Text>
        </Flex>
      </Box>
    </Section>
  );
}
