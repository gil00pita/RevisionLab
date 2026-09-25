"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
  Icon,
  Link,
  List,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, ArrowUpRight, Check, GitBranch } from "lucide-react";
import { RevisionLabLogo } from "revisionlab";

export function PrototypeHome() {
  const [status, setStatus] = useState("Connecting to your workspace…");
  useEffect(() => {
    let active = true;
    fetch("/api/revisionlab/state", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Verify your email to open the review workspace."
              : "Workspace unavailable. Check the server configuration.",
          );
        const data = await response.json();
        if (active)
          setStatus(
            `${data.project.name} is connected · ${data.flows.length} recordings · ${data.comments.length} ${data.comments.length === 1 ? "comment" : "comments"}`,
          );
      })
      .catch((error: Error) => {
        if (active) setStatus(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box minH="100dvh" bg="gray.50" color="gray.900">
      <Flex
        as="header"
        bg="gray.900"
        color="white"
        px={{ base: "6", md: "12" }}
        minH="20"
        align="center"
        justify="space-between"
        gap="5"
      >
        <Flex align="center" gap="3">
          <RevisionLabLogo decorative />
          <Text fontWeight="bold" fontSize="lg">
            RevisionLab
          </Text>
        </Flex>
        <Link asChild color="gray.100" fontSize="sm">
          <NextLink href="/setup">
            Installation guide
            <Icon>
              <ArrowUpRight />
            </Icon>
          </NextLink>
        </Link>
      </Flex>
      <Box
        as="main"
        maxW="6xl"
        mx="auto"
        px={{ base: "6", md: "12" }}
        py={{ base: "12", md: "20" }}
      >
        <Flex
          gap={{ base: "10", md: "16" }}
          direction={{ base: "column", lg: "row" }}
          align="start"
        >
          <Stack flex="1" gap="6">
            <Heading
              as="h1"
              size={{ base: "3xl", md: "4xl" }}
              letterSpacing="tight"
              maxW="xl"
            >
              Review the prototype. Keep the context.
            </Heading>
            <Text color="gray.600" fontSize="lg" maxW="xl">
              RevisionLab is running inside this Next.js project. Record a
              journey, capture screens for a persona, and bring the feedback
              together in your review workspace.
            </Text>
            <Button asChild alignSelf="start" size="lg" colorPalette="blue">
              <NextLink href="/revisionlab">
                Open workspace
                <Icon>
                  <ArrowRight />
                </Icon>
              </NextLink>
            </Button>
            <Text role="status" color="gray.600" fontSize="sm">
              {status}
            </Text>
          </Stack>
          <Stack
            as="section"
            aria-label="Start recording"
            flex="1"
            maxW="lg"
            gap="5"
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            p={{ base: "6", md: "8" }}
          >
            <Icon size="xl" color="blue.700">
              <GitBranch />
            </Icon>
            <Heading as="h2" size="xl">
              Your first recorded journey
            </Heading>
            <List.Root as="ol" gap="4" ps="5" color="gray.700">
              <List.Item>
                Choose the camera icon in the RevisionLab toolbar.
              </List.Item>
              <List.Item>
                Name your recording and select a saved workspace persona.
              </List.Item>
              <List.Item>
                Explore this site or your own prototype. Clicks and completed
                field changes capture automatically; use Stop when finished.
              </List.Item>
            </List.Root>
            <Separator />
            <Text color="gray.600">
              This page is part of the running installation. Try navigating to
              the guide while recording to capture a second screen.
            </Text>
            <Link asChild color="blue.700" fontWeight="semibold">
              <NextLink href="/setup">
                Visit the installation guide
                <Icon>
                  <ArrowRight />
                </Icon>
              </NextLink>
            </Link>
          </Stack>
        </Flex>
        <Stack
          gap="4"
          mt="16"
          pt="8"
          borderTopWidth="1px"
          borderColor="gray.200"
        >
          <Heading as="h2" size="lg">
            Bring RevisionLab into another project
          </Heading>
          <Text color="gray.600">
            The package generates review routes and adds the widget to your
            Next.js layout. Local development uses SQLite with no database
            service to configure.
          </Text>
          <Code
            p="4"
            bg="gray.900"
            color="gray.100"
            borderRadius="lg"
            alignSelf="start"
          >
            npx revisionlab init
          </Code>
          <Text color="gray.600" fontSize="sm">
            The package is built locally and has not been published to npm. Use
            the packed archive instructions in the guide until publication.
          </Text>
          <Flex gap="2" align="center" color="gray.700" fontSize="sm">
            <Icon color="green.700">
              <Check />
            </Icon>
            Next.js App Router · React 19 · local or shared storage
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
}
