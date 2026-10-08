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
        bg="blue.solid"
        color="blue.contrast"
        p="3"
        zIndex="100"
        _focus={{ top: "3" }}
      >
        Skip to content
      </Link>

      <Flex
        as="header"
        bg="bg.inverted"
        color="fg.inverted"
        px={{ base: "5", md: "10", xl: "16" }}
        h={{ base: "20", md: "24" }}
        maxW="1600px"
        mx="auto"
        justify="space-between"
        align="center"
        gap="4"
        borderBottomWidth="1px"
        borderColor="fg.inverted/20"
      >
        <Link asChild color="fg.inverted" textDecoration="none" minH="44px">
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
            color="fg.inverted/80"
            fontSize="sm"
            minH="44px"
            hideBelow="md"
          >
            How it works
          </Link>
          <Link
            href="#review"
            color="fg.inverted/80"
            fontSize="sm"
            minH="44px"
            hideBelow="lg"
          >
            The workspace
          </Link>
          <Link
            asChild
            color="fg.inverted/80"
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
          <Link
            asChild
            color="fg.inverted/80"
            fontSize="sm"
            minH="44px"
            hideBelow="md"
          >
            <NextLink href="/demo/finance">Try demo</NextLink>
          </Link>
          <Button
            asChild
            size="sm"
            minH="44px"
            colorPalette="blue"
            bg="blue.solid"
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
