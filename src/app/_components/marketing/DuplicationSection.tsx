"use client";
import { useState } from "react";
import { Box, Button, Flex, Grid, Icon, Text } from "@chakra-ui/react";
import { Files, GitBranch, RotateCcw } from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading, Signal } from "./shared";

export function DuplicationSection() {
  const [version, setVersion] = useState(3);
  return (
    <Section bg="gray.50" color="gray.900">
      <Box maxW="1280px" mx="auto">
        <SectionHeading
          number="02 / Less reconstruction. More understanding."
          title="The prototype shouldn’t create a second documentation project."
        />
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          borderWidth="1px"
          borderColor="gray.300"
          rounded="lg"
          overflow="hidden"
        >
          <Box p={{ base: "6", md: "9" }} bg="gray.100">
            <Flex justify="space-between" mb="6">
              <Eyebrow>Without RevisionLab</Eyebrow>
              <Icon color="gray.500">
                <Files />
              </Icon>
            </Flex>
            <Flex justify="center">
              <Box
                w="160px"
                borderWidth="1px"
                borderColor="gray.300"
                rounded="md"
                overflow="hidden"
              >
                <NorthstarScreen
                  screen={2}
                  compact
                  version={version as 3 | 4}
                />
              </Box>
            </Flex>
            <Grid templateColumns="repeat(3, 1fr)" gap="3" mt="6">
              {[
                "Screenshot",
                "Miro",
                "FigJam",
                "PowerPoint",
                "Confluence",
                "Jira",
              ].map((name, i) => (
                <Box
                  key={name}
                  borderTopWidth="1px"
                  borderColor="gray.400"
                  pt="3"
                >
                  <Flex justify="center">
                    <Box h="5" w="1px" bg="gray.400" />
                  </Flex>
                  <Box
                    bg="white"
                    p="3"
                    borderWidth="1px"
                    borderColor="gray.300"
                    rounded="sm"
                    transform={
                      version === 4 ? "translateY(3px)" : "translateY(0)"
                    }
                    transition={`transform ${200 + i * 70}ms`}
                    _motionReduce={{ transition: "none" }}
                  >
                    <Text fontSize="10px" color="gray.600">
                      {name}
                    </Text>
                    <Text
                      fontFamily="mono"
                      fontSize="8px"
                      mt="3"
                      color={version === 4 ? "red.700" : "gray.600"}
                    >
                      {version === 4 ? "OUT OF DATE" : "COPY · V03"}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Grid>
            <Text mt="6" color="gray.600" fontSize="sm">
              The prototype changes. The copies don’t.
            </Text>
          </Box>
          <Box
            p={{ base: "6", md: "9" }}
            bg="white"
            borderLeftWidth={{ base: "0", md: "1px" }}
            borderTopWidth={{ base: "1px", md: "0" }}
            borderColor="gray.300"
          >
            <Flex justify="space-between" mb="6">
              <Eyebrow>With RevisionLab</Eyebrow>
              <Icon color="blue.600">
                <GitBranch />
              </Icon>
            </Flex>
            <Flex justify="center">
              <Box
                w="160px"
                borderWidth="1px"
                borderColor="blue.300"
                rounded="md"
                overflow="hidden"
              >
                <NorthstarScreen
                  screen={2}
                  compact
                  version={version as 3 | 4}
                />
              </Box>
            </Flex>
            <Signal vertical />
            <Flex
              borderWidth="1px"
              borderColor="blue.300"
              rounded="md"
              bg="blue.50"
              px="4"
              py="3"
              gap="2"
              align="center"
              justify="center"
            >
              <Icon color="blue.700" size="sm">
                <GitBranch />
              </Icon>
              <Text color="blue.800" fontWeight="600" fontSize="sm">
                One connected review workspace
              </Text>
            </Flex>
            <Flex mt="5" justify="center" gap="2" wrap="wrap">
              {["Flow", "Comment", "A11y", "Test evidence", "Ticket"].map(
                (name) => (
                  <Text
                    key={name}
                    fontSize="10px"
                    color="blue.800"
                    borderBottomWidth="1px"
                    borderColor="blue.300"
                    pb="2"
                  >
                    {name}
                  </Text>
                ),
              )}
            </Flex>
            <Text mt="6" color="gray.600" fontSize="sm">
              The review environment is derived from the thing being reviewed.
            </Text>
          </Box>
        </Grid>
        <Flex mt="5" align="center" gap="4" wrap="wrap">
          <Button
            variant="outline"
            minH="44px"
            borderColor="gray.400"
            onClick={() => setVersion(version === 3 ? 4 : 3)}
          >
            <Icon size="sm">
              <RotateCcw />
            </Icon>
            {version === 3
              ? "Revise the source prototype"
              : "Reset to version 3"}
          </Button>
          <Text role="status" fontSize="xs" color="gray.600">
            {version === 3
              ? "See what happens when the source changes."
              : "Version 4 is ready for review. Version 3 evidence stays in history."}
          </Text>
        </Flex>
      </Box>
    </Section>
  );
}
