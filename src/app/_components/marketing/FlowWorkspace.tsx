"use client";

import { useState } from "react";
import { Box, Button, Flex, Grid, Icon, Text } from "@chakra-ui/react";
import { ArrowDown, ArrowRight, GitBranch, MousePointer2 } from "lucide-react";
import { NorthstarScreen, screenNames } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading } from "./shared";

export function FlowWorkspace() {
  const [connection, setConnection] = useState<number | "branch" | null>(null);
  return (
    <Section id="review" bg="gray.50" color="gray.900">
      <Box maxW="1280px" mx="auto">
        <SectionHeading
          number="04 / The visual flow workspace"
          title="The journey, not just the screens."
          description="Captured screens become a map of what someone actually did. Keep the path, the clicks and the context together."
        />
        <Box
          borderWidth="1px"
          borderColor="gray.300"
          borderRadius="lg"
          overflow="hidden"
          bg="white"
        >
          <Flex
            px={{ base: "4", md: "6" }}
            py="4"
            align="center"
            justify="space-between"
            borderBottomWidth="1px"
            borderColor="gray.200"
            gap="4"
            wrap="wrap"
          >
            <Flex gap="2" align="center">
              <Icon color="blue.700" size="sm">
                <GitBranch />
              </Icon>
              <Text fontWeight="600" fontSize="sm">
                Applicant flow
              </Text>
            </Flex>
            <Eyebrow>FLOW_04 · VERSION_03 · APPLICANT</Eyebrow>
          </Flex>
          <Box p={{ base: "5", md: "8" }}>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(5, 1fr)" }}
              gap={{ base: "12", md: "10" }}
              alignItems="start"
            >
              {screenNames.map((name, i) => (
                <Box
                  key={name}
                  position="relative"
                  maxW={{ base: "260px", md: "none" }}
                  w="full"
                  mx="auto"
                >
                  <Flex mb="3" gap="2" align="center">
                    <Text fontFamily="mono" fontSize="9px" color="gray.500">
                      0{i + 1}
                    </Text>
                    <Text fontWeight="600" fontSize="11px">
                      {name}
                    </Text>
                  </Flex>
                  <Box
                    borderWidth="1px"
                    borderColor={i === 2 ? "signal" : "gray.300"}
                    borderRadius="md"
                    overflow="hidden"
                    boxShadow="xs"
                  >
                    <NorthstarScreen screen={i} compact />
                  </Box>
                  <Text
                    mt="2"
                    fontFamily="mono"
                    fontSize="8px"
                    color="gray.600"
                  >
                    {i === 0 ? "START" : i === 4 ? "END" : `SCREEN_0${i + 1}`}
                  </Text>
                  {i < 4 && (
                    <Button
                      variant="ghost"
                      p="0"
                      minW="44px"
                      minH="44px"
                      position="absolute"
                      top={{ base: "auto", md: "48%" }}
                      bottom={{ base: "-44px", md: "auto" }}
                      left={{ base: "42%", md: "auto" }}
                      right={{ base: "auto", md: "-42px" }}
                      color="blue.700"
                      onClick={() => setConnection(i)}
                      aria-label={`Inspect connection from ${name} to ${screenNames[i + 1]}`}
                      _hover={{ bg: "blue.50" }}
                    >
                      <Icon hideBelow="md">
                        <ArrowRight />
                      </Icon>
                      <Icon hideFrom="md">
                        <ArrowDown />
                      </Icon>
                    </Button>
                  )}
                </Box>
              ))}
            </Grid>
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              gap="4"
              justify="center"
              mt="6"
            >
              <Box
                h="8"
                borderLeftWidth="1px"
                borderBottomWidth="1px"
                borderColor="signal"
                w={{ base: "1px", md: "16" }}
                aria-hidden="true"
              />
              <Button
                variant="outline"
                minH="44px"
                borderColor="blue.300"
                color="blue.800"
                onClick={() => setConnection("branch")}
              >
                <Icon size="sm">
                  <GitBranch />
                </Icon>
                Income → Explain affordability
              </Button>
              <Text fontSize="10px" color="gray.600">
                Observed return to Income
              </Text>
            </Flex>
            <Box
              mt="6"
              p="4"
              bg="gray.50"
              rounded="md"
              role="status"
              minH="74px"
            >
              {connection === null ? (
                <Flex align="center" gap="2" color="gray.600">
                  <Icon size="sm">
                    <MousePointer2 />
                  </Icon>
                  <Text fontSize="xs">
                    Select a blue connection to inspect the recorded
                    interaction.
                  </Text>
                </Flex>
              ) : (
                <>
                  <Eyebrow>
                    Click /{" "}
                    {connection === "branch"
                      ? "Explain affordability"
                      : "Continue"}{" "}
                    / Button
                  </Eyebrow>
                  <Text mt="2" fontSize="xs" color="gray.700">
                    {connection === "branch"
                      ? "Screen 03 → Explain affordability → Screen 03"
                      : `Screen 0${connection + 1} → Screen 0${connection + 2}`}{" "}
                    · Fictional observed interaction
                  </Text>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Section>
  );
}
