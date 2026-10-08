import NextLink from "next/link";
import { Flex, Icon, Link, Text } from "@chakra-ui/react";
import { ArrowUpRight } from "lucide-react";
import { RevisionLabLogo } from "revisionlab";

export function MarketingSiteFooter() {
  return (
    <Flex
      as="footer"
      px={{ base: "5", md: "10", xl: "16" }}
      py="7"
      bg="gray.950"
      color="gray.400"
      borderTopWidth="1px"
      borderColor="gray.800"
      justify="space-between"
      align="center"
      gap="5"
      wrap="wrap"
    >
      <Flex gap="2" align="center">
        <RevisionLabLogo decorative />
        <Text
          fontFamily="Manrope, sans-serif"
          color="gray.200"
          fontWeight="700"
        >
          RevisionLab
        </Text>
        <Text fontSize="10px" ms="3">
          Prototype fast. Learn together.
        </Text>
      </Flex>
      <Flex as="nav" aria-label="Footer navigation" gap="6" fontSize="xs">
        <Link asChild color="gray.300" minH="44px">
          <NextLink href="/setup">Installation</NextLink>
        </Link>
        <Link asChild color="gray.300" minH="44px">
          <NextLink href="/revisionlab">
            Open workspace
            <Icon size="xs">
              <ArrowUpRight />
            </Icon>
          </NextLink>
        </Link>
        <Link href="#main" color="gray.300" minH="44px">
          Back to top ↑
        </Link>
      </Flex>
    </Flex>
  );
}
