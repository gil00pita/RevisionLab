"use client";
import { useState } from "react";
import { Box, Button, Flex, Grid, Icon, Link, Text } from "@chakra-ui/react";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading } from "./shared";

export function AccessibilityEvidence() {
  const [scanned, setScanned] = useState(false);
  return (
    <Section bg="gray.50" color="gray.900">
      <Box maxW="1280px" mx="auto">
        <Grid
          templateColumns={{ base: "1fr", lg: "0.8fr 1fr" }}
          gap={{ base: "8", md: "16" }}
          alignItems="center"
        >
          <Box>
            <SectionHeading
              number="06 / Accessibility review"
              title="Accessibility evidence travels with the design."
              description="Find a barrier. Keep the exact screen, target and version alongside the finding."
            />
            <Button
              variant="outline"
              borderColor="gray.400"
              minH="44px"
              onClick={() => setScanned((current) => !current)}
            >
              <Icon size="sm">
                <ScanLine />
              </Icon>
              {scanned ? "Reset example scan" : "Run example scan"}
            </Button>
            <Link
              href="https://www.deque.com/axe/core-documentation/"
              target="_blank"
              rel="noreferrer"
              mt="4"
              color="blue.700"
              minH="44px"
              display="flex"
              w="fit-content"
              fontSize="sm"
            >
              Read axe documentation
              <Icon size="xs">
                <ArrowUpRight />
              </Icon>
            </Link>
            <Text
              mt="4"
              fontSize="xs"
              lineHeight="1.7"
              color="gray.600"
              maxW="sm"
            >
              Automated checks support accessibility review. They are not
              compliance certification. This is an illustrative finding, not a
              scan of this page.
            </Text>
          </Box>
          <Box
            bg="white"
            rounded="lg"
            p={{ base: "5", md: "7" }}
            borderWidth="1px"
            borderColor="gray.300"
          >
            <Flex justify="space-between" mb="5">
              <Eyebrow>A11Y / SCREEN_03</Eyebrow>
              <Text fontFamily="mono" fontSize="10px" color="gray.600">
                WCAG 2.2 AA
              </Text>
            </Flex>
            <Box
              position="relative"
              maxW="360px"
              mx="auto"
              borderWidth="1px"
              borderColor="gray.200"
              rounded="md"
              overflow="hidden"
            >
              <NorthstarScreen screen={2} highlight={scanned} />
              <Box
                aria-hidden="true"
                position="absolute"
                left="0"
                right="0"
                top={scanned ? "70%" : "0%"}
                h="1px"
                bg="blue.500"
                opacity={scanned ? 1 : 0}
                transition="top 700ms ease"
                _motionReduce={{ transition: "none" }}
              />
            </Box>
            <Box
              mt="5"
              borderLeftWidth="2px"
              borderColor={scanned ? "orange.500" : "gray.300"}
              ps="4"
              role="status"
            >
              <Text fontWeight="600" fontSize="sm">
                {scanned
                  ? "Form elements must have labels"
                  : "Inspect the monthly housing cost field"}
              </Text>
              <Text fontSize="xs" color="gray.600" mt="2">
                {scanned
                  ? "Serious · Monthly housing cost · Missing programmatic label"
                  : "Run the example scan to attach a finding to its target."}
              </Text>
            </Box>
          </Box>
        </Grid>
      </Box>
    </Section>
  );
}
