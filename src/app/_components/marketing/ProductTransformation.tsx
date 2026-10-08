"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  SegmentGroup,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import {
  ArrowRight,
  Check,
  Circle,
  Code2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { TransformationBrowser } from "./TransformationBrowser";
import { TransformationEvidence } from "./TransformationEvidence";
import { CapturedJourney } from "./CapturedJourney";
import { TransformationStages } from "./TransformationStages";
import { transformationPhases as phases } from "./transformation";
import { useDemoPlayback } from "./useDemoPlayback";

export function ProductTransformation({
  controlled = false,
}: {
  controlled?: boolean;
}) {
  const { attach, phase, playing, reducedMotion, replay, seek, toggle } =
    useDemoPlayback({ autoplay: !controlled, loop: !controlled });
  const mapped = phase >= 3;
  const final = phase === 9;
  return (
    <Box
      ref={attach}
      role="group"
      w="full"
      minW="0"
      aria-label={
        controlled
          ? "Controlled prototype recording demonstration"
          : "Animated prototype-to-review demonstration"
      }
    >
      {controlled && (
        <Flex mb="5" justify="space-between" gap="3" wrap="wrap">
          <VisuallyHidden id="demonstration-mode-label">
            Demonstration mode
          </VisuallyHidden>
          <SegmentGroup.Root
            aria-labelledby="demonstration-mode-label"
            value={mapped ? "review" : "prototype"}
            onValueChange={(event) => seek(event.value === "review" ? 9 : 0)}
            bg="gray.800"
          >
            <SegmentGroup.Indicator bg="gray.600" />
            <SegmentGroup.Item value="prototype" minH="44px">
              <SegmentGroup.ItemText color="gray.100">
                Prototype
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
            <SegmentGroup.Item value="review" minH="44px">
              <SegmentGroup.ItemText color="gray.100">
                RevisionLab
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          </SegmentGroup.Root>
          <Button
            colorPalette="blue"
            bg="blue.600"
            minH="44px"
            onClick={reducedMotion ? () => seek(9) : replay}
          >
            <Icon size="sm">
              <Circle />
            </Icon>
            {phase > 0 ? "Replay journey" : "Record journey"}
          </Button>
        </Flex>
      )}
      <Box
        borderWidth="1px"
        borderColor="gray.700"
        borderRadius="lg"
        overflow="hidden"
        bg="gray.900"
      >
        <Flex
          h="12"
          px={{ base: "3", md: "5" }}
          gap="3"
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderColor="gray.700"
        >
          <Flex gap="1.5" align="center">
            <Box
              w="1.5"
              h="1.5"
              rounded="full"
              bg={playing ? "red.400" : "signal"}
            />
            <Text
              fontFamily="mono"
              fontSize="9px"
              letterSpacing="0.08em"
              color="gray.300"
            >
              {mapped
                ? "REVISIONLAB / APPLICANT FLOW"
                : "NORTHSTAR / LIVE PROTOTYPE"}
            </Text>
          </Flex>
          <Text fontFamily="mono" fontSize="9px" color="gray.400">
            {final ? "VERSION_04" : "VERSION_03"}
          </Text>
        </Flex>
        <Box p={{ base: "4", md: "6" }} minH={{ base: "510px", md: "545px" }}>
          <Flex
            gap="3"
            align="start"
            justify="center"
            minH={{ base: "300px", md: "330px" }}
          >
            <TransformationBrowser phase={phase} seek={seek} />
            {phase >= 4 && <TransformationEvidence phase={phase} />}
          </Flex>
          <CapturedJourney phase={phase} />
          {phase >= 8 && (
            <Flex
              mt="4"
              py="3"
              px="3"
              gap="3"
              bg="blue.950"
              borderWidth="1px"
              borderColor="blue.800"
              rounded="md"
              align="center"
            >
              <Icon color="blue.300" size="sm">
                {final ? <Code2 /> : <Check />}
              </Icon>
              <Box flex="1">
                <Text fontSize="11px" color="gray.100" fontWeight="600">
                  {final
                    ? "− Continue → + Review application"
                    : "Improve affordability step"}
                </Text>
                <Text fontSize="9px" color="blue.200" mt="1">
                  {final
                    ? "Reviewable code proposal · 3 sources retained"
                    : "Editable ticket · Medium · 3 linked sources"}
                </Text>
              </Box>
              <Icon color="blue.300" size="sm">
                <ArrowRight />
              </Icon>
            </Flex>
          )}
        </Box>
        <Flex
          borderTopWidth="1px"
          borderColor="gray.700"
          py="2"
          ps="4"
          pe="2"
          align="center"
          justify="space-between"
          gap="2"
        >
          <Text fontSize="11px" color="gray.300" maxW="75%">
            {String(phase + 1).padStart(2, "0")} / 10 — {phases[phase]}
          </Text>
          <Flex gap="1">
            {!reducedMotion && (
              <IconButton
                variant="ghost"
                minH="44px"
                minW="44px"
                color="gray.300"
                aria-label={
                  playing ? "Pause transformation" : "Play transformation"
                }
                onClick={toggle}
                _hover={{ bg: "gray.800" }}
              >
                <Icon size="sm">{playing ? <Pause /> : <Play />}</Icon>
              </IconButton>
            )}
            <IconButton
              variant="ghost"
              minH="44px"
              minW="44px"
              color="gray.300"
              aria-label="Restart transformation"
              onClick={reducedMotion ? () => seek(controlled ? 0 : 9) : replay}
              _hover={{ bg: "gray.800" }}
            >
              <Icon size="sm">
                <RotateCcw />
              </Icon>
            </IconButton>
          </Flex>
        </Flex>
      </Box>
      <TransformationStages
        phase={phase}
        reducedMotion={reducedMotion}
        seek={seek}
      />
    </Box>
  );
}
