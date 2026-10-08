"use client";
import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Icon,
  Text,
} from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "./shared";
import { evidence } from "./evidence";
import { TicketDraft } from "./TicketDraft";

export function FeedbackTickets() {
  const [selected, setSelected] = useState<number[]>([]);
  const [sources, setSources] = useState<number[] | null>(null);
  function generate() {
    setSources([...selected]);
  }

  return (
    <Section id="feedback" bg="gray.950" color="gray.100">
      <Box maxW="1280px" mx="auto">
        <SectionHeading
          number="08 / Feedback Review → editable ticket"
          title="Find the issue behind the feedback."
          description="Bring comments, accessibility findings and test observations into the same conversation. Your team decides what the evidence means."
          light
        />
        <Grid
          templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
          gap={{ base: "8", md: "12" }}
          alignItems="start"
        >
          <Box>
            {evidence.map((item, i) => (
              <Box
                key={item.id}
                ps="6"
                pb="6"
                borderLeftWidth="1px"
                borderColor={selected.includes(i) ? "signal" : "gray.700"}
                position="relative"
                transform={
                  sources?.includes(i) ? "translateX(4px)" : "translateX(0)"
                }
                transition="transform 400ms ease"
                _motionReduce={{ transition: "none" }}
              >
                <Box
                  position="absolute"
                  left="-4px"
                  top="2"
                  h="7px"
                  w="7px"
                  bg={selected.includes(i) ? "signal" : "gray.600"}
                  rounded="full"
                  aria-hidden="true"
                />
                <Checkbox.Root
                  checked={selected.includes(i)}
                  onCheckedChange={(event) =>
                    setSelected((current) =>
                      event.checked === true
                        ? [...current, i]
                        : current.filter((value) => value !== i),
                    )
                  }
                  colorPalette="blue"
                  minH="44px"
                  cursor="pointer"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control borderColor="gray.500">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Flex gap="2" align="center">
                      <Icon size="sm" color="blue.300">
                        <item.icon />
                      </Icon>
                      <Text fontSize="sm" fontWeight="600">
                        {item.type}
                      </Text>
                    </Flex>
                  </Checkbox.Label>
                </Checkbox.Root>
                <Text
                  fontFamily="Manrope, sans-serif"
                  fontSize={{ base: "20px", md: "24px" }}
                  letterSpacing="-0.025em"
                  lineHeight="1.55"
                  mt="3"
                >
                  {item.text}
                </Text>
                <Text mt="3" fontSize="11px" color="gray.400">
                  {item.source}
                </Text>
              </Box>
            ))}
            <Flex
              mt="3"
              p="4"
              bg="gray.900"
              borderWidth="1px"
              borderColor="gray.700"
              rounded="md"
              justify="space-between"
              align="center"
              gap="4"
              wrap="wrap"
            >
              <Text fontSize="xs">
                {selected.length} {selected.length === 1 ? "piece" : "pieces"}{" "}
                of evidence selected
              </Text>
              <Button
                colorPalette="blue"
                bg="blue.600"
                minH="44px"
                disabled={!selected.length}
                onClick={generate}
              >
                Create tickets with Codex
                <Icon size="sm">
                  <ArrowRight />
                </Icon>
              </Button>
            </Flex>
            <Text fontSize="11px" lineHeight="1.7" color="gray.400" mt="4">
              Try the simulated generation above. In RevisionLab, Codex
              assistance uses your installed, signed-in local Codex CLI. Review
              the draft before handoff.
            </Text>
          </Box>
          <TicketDraft key={sources?.join(",") ?? "empty"} sources={sources} />
        </Grid>
      </Box>
    </Section>
  );
}
