"use client";

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
import { ApiError, RevisionLabLogo, useRevisionLab } from "revisionlab";

export function PrototypeHome() {
  const { data, error, loading } = useRevisionLab("/api/revisionlab");
  const status = loading
    ? "Connecting to your workspace…"
    : data
      ? `${data.project.name} is connected · ${data.flows.length} recordings · ${data.comments.length} ${data.comments.length === 1 ? "comment" : "comments"}`
      : error instanceof ApiError && error.status === 401
        ? "Verify your email to open the review workspace."
        : "Workspace unavailable. Check the server configuration.";

  return (
    <Box minH="100dvh" bg="bg.subtle" color="fg">
      <Flex
        as="header"
        bg="bg.inverted"
        color="fg.inverted"
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
        <Link asChild color="fg.inverted" fontSize="sm">
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
            <Text color="fg.muted" fontSize="lg" maxW="xl">
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
            <Text role="status" color="fg.muted" fontSize="sm">
              {status}
            </Text>
          </Stack>
          <Stack
            as="section"
            aria-label="Start recording"
            flex="1"
            maxW="lg"
            gap="5"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            borderRadius="xl"
            p={{ base: "6", md: "8" }}
          >
            <Icon size="xl" color="blue.fg">
              <GitBranch />
            </Icon>
            <Heading as="h2" size="xl">
              Your first recorded journey
            </Heading>
            <List.Root as="ol" gap="4" ps="5" color="fg.muted">
              <List.Item>
                Expand the RevisionLab logo, then choose the camera icon.
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
            <Text color="fg.muted">
              This page is part of the running installation. Try navigating to
              the guide while recording to capture a second screen.
            </Text>
            <Link asChild color="blue.fg" fontWeight="semibold">
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
          borderColor="border"
        >
          <Heading as="h2" size="lg">
            Bring RevisionLab into another project
          </Heading>
          <Text color="fg.muted">
            The package generates review routes and adds the widget to your
            Next.js layout. Local development uses SQLite with no database
            service to configure.
          </Text>
          <Code
            p="4"
            bg="bg.inverted"
            color="fg.inverted"
            borderRadius="lg"
            alignSelf="start"
          >
            npx revisionlab init
          </Code>
          <Text color="fg.muted" fontSize="sm">
            The package is built locally and has not been published to npm. Use
            the packed archive instructions in the guide until publication.
          </Text>
          <Flex gap="2" align="center" color="fg.muted" fontSize="sm">
            <Icon color="green.fg">
              <Check />
            </Icon>
            Next.js App Router · React 19 · local or shared storage
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
}
