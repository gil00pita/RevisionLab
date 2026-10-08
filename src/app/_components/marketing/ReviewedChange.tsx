"use client";

import { useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Code,
  Dialog,
  Flex,
  Grid,
  Heading,
  Icon,
  Portal,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, Check, GitPullRequest, RotateCcw, X } from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading } from "./shared";

export function ReviewedChange() {
  const [decision, setDecision] = useState<"pending" | "applied" | "discarded">(
    "pending",
  );
  const [draftOpen, setDraftOpen] = useState(false);
  return (
    <Section bg="gray.50" color="gray.900">
      <Box maxW="1280px" mx="auto">
        <SectionHeading
          number="09 / Fix with Codex"
          title="From feedback to a reviewable change."
        />
        <Grid
          templateColumns={{ base: "1fr", md: "0.8fr 1fr 0.8fr" }}
          gap="5"
          alignItems="stretch"
        >
          <Box
            borderWidth="1px"
            borderColor="gray.300"
            bg="white"
            rounded="lg"
            p="6"
          >
            <Eyebrow>01 / Feedback</Eyebrow>
            <Text
              mt="5"
              fontFamily="Manrope, sans-serif"
              fontSize="22px"
              lineHeight="1.5"
            >
              “Button text is unclear.”
            </Text>
            <Text mt="4" fontSize="xs" color="gray.600">
              Income screen · Version 3
            </Text>
            <Flex mt="7" gap="2" align="center" color="blue.700">
              <Icon size="sm">
                <ArrowRight />
              </Icon>
              <Text fontSize="xs">Scoped to the reviewed screen</Text>
            </Flex>
          </Box>
          <Box bg="gray.900" color="gray.100" rounded="lg" p="6">
            <Eyebrow light>02 / Codex proposal</Eyebrow>
            <Text fontFamily="mono" fontSize="10px" color="gray.400" mt="5">
              IncomeStep.tsx · illustrative diff
            </Text>
            <Box mt="5" fontSize={{ base: "13px", md: "12px" }}>
              <Code display="block" p="3" bg="red.950" color="red.200">
                − Continue
              </Code>
              <Code
                display="block"
                p="3"
                mt="1"
                bg="green.950"
                color="green.200"
              >
                + Review application
              </Code>
            </Box>
            <Text mt="6" fontSize="xs" color="gray.400" lineHeight="1.7">
              A proposal you can inspect. Applied only after your review.
            </Text>
          </Box>
          <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.300"
            rounded="lg"
            p="6"
          >
            <Eyebrow>03 / Human decision</Eyebrow>
            <Flex direction="column" gap="3" mt="5">
              <Button
                bg="blue.600"
                color="white"
                minH="44px"
                onClick={() => setDecision("applied")}
                disabled={decision !== "pending"}
              >
                <Icon size="sm">
                  <Check />
                </Icon>
                Apply locally
              </Button>
              <Button
                variant="outline"
                minH="44px"
                borderColor="gray.400"
                onClick={() => setDecision("discarded")}
                disabled={decision !== "pending"}
              >
                <Icon size="sm">
                  <X />
                </Icon>
                Discard fix
              </Button>
              <Button
                variant="ghost"
                color="blue.700"
                minH="44px"
                onClick={() => setDraftOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={draftOpen}
              >
                <Icon size="sm">
                  <GitPullRequest />
                </Icon>
                Create draft PR
              </Button>
            </Flex>
            <Text fontSize="10px" color="gray.600" mt="4">
              Demonstration controls only.
            </Text>
          </Box>
        </Grid>
        <Flex mt="6" align="center" gap="4" wrap="wrap">
          <Text role="status" color="gray.600" fontSize="sm">
            {decision === "pending"
              ? "Review the example proposal, then choose a decision."
              : decision === "applied"
                ? "Example change applied to the fictional screen. Your project files are unchanged."
                : "Example fix discarded. The original prototype remains."}
          </Text>
          {decision !== "pending" && (
            <Button
              variant="ghost"
              minH="44px"
              color="blue.700"
              onClick={() => setDecision("pending")}
            >
              <Icon size="sm">
                <RotateCcw />
              </Icon>
              Restore proposal
            </Button>
          )}
        </Flex>
        {decision === "applied" && (
          <Box
            maxW="260px"
            mt="5"
            borderWidth="1px"
            borderColor="blue.300"
            rounded="md"
            overflow="hidden"
          >
            <NorthstarScreen compact screen={2} version={4} />
          </Box>
        )}
        <Heading
          as="h3"
          fontFamily="Manrope, sans-serif"
          fontSize={{ base: "36px", md: "64px" }}
          fontWeight="500"
          letterSpacing="-0.05em"
          lineHeight="1.15"
          mt={{ base: "10", md: "16" }}
        >
          AI proposes.
          <Text as="span" color="blue.700" display="block">
            Your team reviews.
          </Text>
        </Heading>
        <Dialog.Root
          open={draftOpen}
          onOpenChange={(event) => setDraftOpen(event.open)}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                mx="4"
                bg="white"
                color="gray.900"
                fontFamily="'DM Sans', sans-serif"
              >
                <Dialog.Header>
                  <Dialog.Title fontFamily="Manrope, sans-serif">
                    Example draft PR
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Eyebrow>Preview only / no PR is published</Eyebrow>
                  <Text mt="4" fontWeight="600">
                    Clarify the affordability step action
                  </Text>
                  <Text mt="3" fontSize="sm" color="gray.600">
                    Change “Continue” to “Review application” on the Income
                    screen. Preserve the comment, accessibility finding and
                    test-session context for human review.
                  </Text>
                  <Text mt="4" fontSize="xs" color="gray.600">
                    In the actual product, reviewed changes can be published
                    through the locally configured GitHub CLI under the existing
                    permissions.
                  </Text>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button minH="44px" variant="outline">
                      Close preview
                    </Button>
                  </Dialog.ActionTrigger>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    minH="44px"
                    minW="44px"
                    aria-label="Close draft PR preview"
                  />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Box>
    </Section>
  );
}
