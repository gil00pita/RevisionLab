import NextLink from "next/link";
import { Button, Flex, Icon, Link, Text } from "@chakra-ui/react";
import { ArrowUpRight } from "lucide-react";
import { RevisionLabLogo } from "revisionlab";

export function MarketingNavigation() {
  return (
    <>
      <Link
        href="#main"
        position="absolute"
        top="-20"
        left="5"
        bg="blue.600"
        color="white"
        p="3"
        zIndex="100"
        _focus={{ top: "3" }}
      >
        Skip to content
      </Link>

      <Flex
        as="header"
        bg="gray.950"
        color="gray.100"
        px={{ base: "5", md: "10", xl: "16" }}
        h={{ base: "20", md: "24" }}
        maxW="1600px"
        mx="auto"
        justify="space-between"
        align="center"
        gap="4"
        borderBottomWidth="1px"
        borderColor="gray.800"
      >
        <Link asChild color="gray.100" textDecoration="none" minH="44px">
          <NextLink href="/" aria-label="RevisionLab home">
            <RevisionLabLogo decorative />
            <Text
              fontFamily="Manrope, sans-serif"
              fontWeight="700"
              fontSize={{ base: "lg", md: "xl" }}
            >
              RevisionLab
            </Text>
          </NextLink>
        </Link>
        <Flex
          as="nav"
          aria-label="Main navigation"
          gap={{ base: "3", md: "8" }}
          align="center"
        >
          <Link
            href="#how-it-works"
            color="gray.300"
            fontSize="sm"
            minH="44px"
            hideBelow="md"
          >
            How it works
          </Link>
          <Link
            href="#review"
            color="gray.300"
            fontSize="sm"
            minH="44px"
            hideBelow="lg"
          >
            The workspace
          </Link>
          <Link
            asChild
            color="gray.300"
            fontSize="sm"
            minH="44px"
            hideBelow="lg"
          >
            <NextLink href="/setup">
              Docs
              <Icon boxSize="12px">
                <ArrowUpRight />
              </Icon>
            </NextLink>
          </Link>
          <Button
            asChild
            size="sm"
            minH="44px"
            colorPalette="blue"
            bg="blue.600"
            borderRadius="md"
            px={{ base: "3", md: "5" }}
          >
            <NextLink href="/setup">
              Install free
              <Icon size="sm">
                <ArrowUpRight />
              </Icon>
            </NextLink>
          </Button>
        </Flex>
      </Flex>
    </>
  );
}
