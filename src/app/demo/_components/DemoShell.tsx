import type { ReactNode } from "react";
import NextLink from "next/link";
import {
  Box,
  Flex,
  Heading,
  Icon,
  Link,
  List,
  SkipNavLink,
  Stack,
  Text,
} from "@chakra-ui/react";
import { MoveUpRight } from "lucide-react";
import { demoSteps } from "./demoData";

export function DemoShell({
  step,
  children,
}: {
  step: number;
  children: ReactNode;
}) {
  return (
    <Box
      minH="100dvh"
      bg="bg.subtle"
      color="fg"
      colorPalette="teal"
      focusRingColor="colorPalette.fg"
      pb="24"
    >
      <SkipNavLink id="demo-main">Skip to demo</SkipNavLink>
      <Flex
        as="header"
        bg="bg.panel"
        borderBottomWidth="1px"
        borderColor="border"
        px={{ base: "5", md: "10" }}
        py="5"
        gap="4"
        justify="space-between"
        align="center"
        wrap="wrap"
      >
        <Link
          asChild
          fontWeight="bold"
          color="fg"
          textDecoration="none"
          minH="11"
        >
          <NextLink href="/demo/finance">
            <Icon color="colorPalette.fg" boxSize="6">
              <MoveUpRight />
            </Icon>
            northstar{" "}
            <Text as="span" fontWeight="normal" color="fg.muted">
              finance
            </Text>
          </NextLink>
        </Link>
        <Flex
          as="nav"
          aria-label="Demo navigation"
          gap="5"
          wrap="wrap"
          fontSize="sm"
        >
          <Link asChild minH="11">
            <NextLink href="/">RevisionLab home</NextLink>
          </Link>
          <Link asChild minH="11">
            <NextLink href="/revisionlab">Open workspace</NextLink>
          </Link>
        </Flex>
      </Flex>
      <Stack
        maxW="6xl"
        mx="auto"
        px={{ base: "5", md: "10" }}
        pt={{ base: "6", md: "10" }}
        gap="8"
      >
        <Box
          as="aside"
          borderStartWidth="3px"
          borderColor="colorPalette.solid"
          ps="4"
        >
          <Heading as="h2" size="sm">
            Record a five-page journey
          </Heading>
          <Text fontSize="sm" color="fg.muted" mt="1">
            Start recording with the RevisionLab widget, continue through each
            page, then stop and save on confirmation. Use fictional details for
            this demo.
          </Text>
        </Box>
        <Box as="nav" aria-label="Journey steps">
          <List.Root
            as="ol"
            listStyleType="none"
            display="flex"
            flexDirection="row"
            gap="2"
            flexWrap="wrap"
            m="0"
            p="0"
          >
            {demoSteps.map((item, index) => (
              <List.Item key={item.slug} flex={{ base: "1 1 140px", md: "1" }}>
                <Link
                  asChild
                  w="full"
                  minH="12"
                  px="3"
                  py="2"
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight={index === step ? "semibold" : "normal"}
                  bg={index === step ? "colorPalette.subtle" : "bg.panel"}
                  color={index === step ? "colorPalette.fg" : "fg.muted"}
                  borderWidth="1px"
                  borderColor={index === step ? "colorPalette.muted" : "border"}
                  textDecoration="none"
                  _hover={{
                    bg: "colorPalette.subtle",
                    color: "colorPalette.fg",
                  }}
                >
                  <NextLink
                    href={`/demo/${item.slug}`}
                    aria-current={index === step ? "step" : undefined}
                  >
                    <Text as="span" fontWeight="bold">
                      {index + 1}.
                    </Text>{" "}
                    {item.label}
                  </NextLink>
                </Link>
              </List.Item>
            ))}
          </List.Root>
        </Box>
        <Box as="main" id="demo-main" tabIndex={-1} focusRing="outside">
          {children}
        </Box>
        <Text as="footer" fontSize="xs" color="fg.muted">
          Fictional prototype · no application is submitted and no credit check
          is performed. Demo edits stay in this browser tab. RevisionLab
          recordings are saved only when you use the widget.
        </Text>
      </Stack>
    </Box>
  );
}
