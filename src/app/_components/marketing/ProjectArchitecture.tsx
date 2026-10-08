"use client";

import { Box, Button, Flex, Grid, Icon, Text } from "@chakra-ui/react";
import { Folder, FolderOpen, RotateCcw } from "lucide-react";
import { InstallCommand } from "./InstallCommand";
import { Section, SectionHeading } from "./shared";
import { useDemoPlayback } from "./useDemoPlayback";

export function ProjectArchitecture() {
  const { attach, phase, reducedMotion, replay, seek } = useDemoPlayback({
    steps: 2,
    interval: 600,
    loop: false,
  });
  return (
    <Section id="project" bg="gray.50" color="gray.900">
      <Grid
        ref={attach}
        maxW="1280px"
        mx="auto"
        templateColumns={{ base: "1fr", lg: "0.8fr 1fr" }}
        gap={{ base: "8", md: "16" }}
        alignItems="center"
      >
        <Box>
          <SectionHeading
            number="12 / Project-owned by design"
            title="Lives with the project."
            description="RevisionLab embeds in your Next.js application. An in-page widget for recording. A review workspace at /revisionlab. Context that belongs to the project."
          />
          <InstallCommand dark={false} />
          <Button
            variant="ghost"
            minH="44px"
            mt="4"
            color="blue.700"
            onClick={reducedMotion ? () => seek(1) : replay}
          >
            <Icon size="sm">
              <RotateCcw />
            </Icon>
            Replay installation illustration
          </Button>
          <Text mt="5" color="gray.600" fontSize="sm" lineHeight="1.7">
            Local development uses project-owned storage. Shared deployments use
            the configured storage and access controls in your installation
            guide.
          </Text>
        </Box>
        <Box
          bg="gray.900"
          color="gray.200"
          borderRadius="lg"
          p={{ base: "6", md: "9" }}
        >
          <Flex
            align="center"
            gap="2"
            pb="5"
            borderBottomWidth="1px"
            borderColor="gray.700"
          >
            <Icon color="blue.300" size="sm">
              <FolderOpen />
            </Icon>
            <Text fontFamily="mono" fontSize="12px">
              your-next-app/
            </Text>
          </Flex>
          <Box
            fontFamily="mono"
            fontSize={{ base: "11px", md: "13px" }}
            lineHeight="2.2"
            pt="5"
          >
            <Text>├── app/</Text>
            <Text>├── components/</Text>
            <Box
              transform={phase === 1 ? "translateY(0)" : "translateY(6px)"}
              transition="transform 400ms ease"
              _motionReduce={{ transition: "none" }}
              my="3"
              py="3"
              px="4"
              bg="blue.950"
              borderLeftWidth="2px"
              borderColor="signal"
            >
              <Flex gap="2" align="center">
                <Icon color="blue.300" size="sm">
                  <Folder />
                </Icon>
                <Text color="blue.200">.revisionlab/</Text>
              </Flex>
              <Text ps="6" color="gray.300">
                ├── revisionlab.db
              </Text>
              <Text ps="6" color="gray.300">
                ├── artifacts/
              </Text>
              <Text ps="6" color="gray.300">
                ├── reports/
              </Text>
              <Text ps="6" color="gray.300">
                └── backups/
              </Text>
            </Box>
            <Text>└── package.json</Text>
          </Box>
          <Flex
            mt="6"
            gap="4"
            align="center"
            justify="center"
            borderTopWidth="1px"
            borderColor="gray.700"
            pt="5"
          >
            <Text fontSize="xs">Next.js prototype</Text>
            <Text color="blue.300">↔</Text>
            <Text fontSize="xs">RevisionLab</Text>
          </Flex>
          <Text mt="4" fontSize="10px" color="gray.400" textAlign="center">
            Illustrative project structure · no repository upload
          </Text>
        </Box>
      </Grid>
    </Section>
  );
}
