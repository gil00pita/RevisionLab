"use client";

import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LockKeyhole } from "lucide-react";
import { RevisionLabLogo } from "../RevisionLabLogo/index.js";
import { RevisionLabProvider } from "../RevisionLabProvider/index.js";
import { AccessForm } from "./components/AccessForm.js";

export interface RevisionLabAccessProps {
  apiPath?: string;
  basePath?: string;
}

export function RevisionLabAccess({
  apiPath = "/api/revisionlab",
  basePath = "/revisionlab",
}: RevisionLabAccessProps) {
  return (
    <RevisionLabProvider>
      <Flex
        as="main"
        minH="100dvh"
        direction="column"
        bg="gray.50"
        color="gray.900"
        data-revisionlab-ui="access"
      >
        <HStack
          as="header"
          gap="3"
          px={{ base: "5", md: "10" }}
          py="5"
          bg="gray.900"
          color="white"
        >
          <RevisionLabLogo decorative />
          <Text fontWeight="bold" fontSize="lg">
            RevisionLab
          </Text>
        </HStack>
        <Flex
          flex="1"
          align="center"
          justify="center"
          px="5"
          py={{ base: "10", md: "16" }}
        >
          <Stack gap="7" w="full" maxW="md">
            <Stack gap="3">
              <Heading as="h1" size="2xl" letterSpacing="tight">
                Join the review
              </Heading>
              <Text color="gray.600" lineHeight="tall">
                Use your invitation and email to open the prototype, follow its
                flows, and leave feedback.
              </Text>
            </Stack>
            <Box
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              rounded="xl"
              p={{ base: "5", md: "7" }}
            >
              <AccessForm apiPath={apiPath} basePath={basePath} />
            </Box>
            <HStack align="start" gap="3" color="gray.600" fontSize="sm">
              <Icon size="sm" mt="0.5" flexShrink="0">
                <LockKeyhole />
              </Icon>
              <Text>
                No password or Vercel account needed. Ask the project owner for
                an invitation if you do not have one.
              </Text>
            </HStack>
            <Link href="/" color="blue.700" fontSize="sm" alignSelf="start">
              Back to prototype
            </Link>
          </Stack>
        </Flex>
      </Flex>
    </RevisionLabProvider>
  );
}
