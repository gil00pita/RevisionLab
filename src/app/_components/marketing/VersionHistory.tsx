"use client";

import { useState } from "react";
import { Box, Flex, Grid, SegmentGroup, Text } from "@chakra-ui/react";
import { NorthstarScreen } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading } from "./shared";

export function VersionHistory() {
  const [version, setVersion] = useState("3");
  return (
    <Section bg="white" color="gray.900">
      <Grid
        maxW="1280px"
        mx="auto"
        templateColumns={{ base: "1fr", lg: "0.8fr 1fr" }}
        gap={{ base: "8", md: "16" }}
        alignItems="center"
      >
        <Box>
          <SectionHeading
            number="10 / One prototype. One review history."
            title="The prototype changes. The reasoning shouldn’t disappear."
            description="Continue the review against the next version. Keep earlier evidence attached to the version it came from."
          />
          <Text id="version-control" fontSize="xs" color="gray.600" mb="3">
            Explore the example versions
          </Text>
          <SegmentGroup.Root
            value={version}
            onValueChange={(event) => setVersion(event.value ?? "3")}
            aria-labelledby="version-control"
          >
            <SegmentGroup.Indicator />
            {["3", "4"].map((value) => (
              <SegmentGroup.Item key={value} value={value} minH="44px" px="5">
                <SegmentGroup.ItemText>Version 0{value}</SegmentGroup.ItemText>
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
            ))}
          </SegmentGroup.Root>
          <Text mt="5" fontSize="xs" color="gray.600" lineHeight="1.7">
            Illustrative version history. This is not an automatic visual diff.
          </Text>
        </Box>
        <Box
          bg="gray.100"
          borderWidth="1px"
          borderColor="gray.200"
          rounded="lg"
          p={{ base: "5", md: "8" }}
        >
          <Flex justify="space-between" mb="4">
            <Eyebrow>VERSION_0{version} / INCOME</Eyebrow>
            <Text fontSize="10px" color="gray.600">
              {version === "4"
                ? "Ready for another review"
                : "Original capture"}
            </Text>
          </Flex>
          <Box
            maxW="360px"
            mx="auto"
            rounded="md"
            overflow="hidden"
            borderWidth="1px"
            borderColor="gray.300"
          >
            <NorthstarScreen screen={2} version={version === "4" ? 4 : 3} />
          </Box>
          <Box
            mt="5"
            bg="white"
            p="4"
            rounded="md"
            borderLeftWidth="2px"
            borderColor="blue.500"
            role="status"
          >
            <Text fontWeight="600" fontSize="xs">
              Sarah’s comment · Source version 03
            </Text>
            <Text mt="2" color="gray.600" fontSize="xs">
              {version === "3"
                ? "The repayment figure needs a clearer relationship to affordability."
                : "Retained in history. Version 04 keeps the estimate visible and clarifies the next action."}
            </Text>
          </Box>
        </Box>
      </Grid>
    </Section>
  );
}
