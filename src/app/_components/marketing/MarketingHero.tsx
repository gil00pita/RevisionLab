import NextLink from "next/link";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Icon,
  Link,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, Play } from "lucide-react";
import { InstallCommand } from "./InstallCommand";
import { ProductTransformation } from "./ProductTransformation";
import { Eyebrow } from "./shared";

export function MarketingHero() {
  return (
    <Box bg="gray.950" color="gray.100">
      <Box
        as="section"
        aria-label="Your prototype is already the documentation"
        maxW="1600px"
        mx="auto"
        px={{ base: "5", md: "10", xl: "16" }}
        pt={{ base: "12", md: "20" }}
        pb={{ base: "12", md: "16" }}
      >
        <Grid
          templateColumns={{ base: "1fr", lg: "0.95fr 1.05fr" }}
          gap={{ base: "12", lg: "8", xl: "16" }}
          alignItems="center"
        >
          <Box pb={{ base: "0", lg: "12" }}>
            <Flex align="center" gap="2" mb="7">
              <Box w="1.5" h="1.5" rounded="full" bg="signal" />
              <Eyebrow light>The prototype is the source of truth</Eyebrow>
            </Flex>
            <Heading
              as="h1"
              fontFamily="Manrope, sans-serif"
              fontWeight="500"
              fontSize={{ base: "49px", md: "72px", lg: "65px", xl: "78px" }}
              lineHeight="1.07"
              letterSpacing="-0.06em"
              maxW="650px"
            >
              Your prototype is already the
              <Text as="span" color="signal" display="block">
                documentation.
              </Text>
            </Heading>
            <Text
              mt="7"
              color="gray.400"
              fontSize={{ base: "md", md: "18px" }}
              lineHeight="1.75"
              maxW="460px"
            >
              Record journeys, capture screens, collect feedback, test with
              users and turn evidence into development work — without rebuilding
              your prototype in another review tool.
            </Text>
            <Flex gap="4" mt="8" mb="7" align="center" wrap="wrap">
              <Button
                asChild
                colorPalette="blue"
                bg="blue.600"
                size="lg"
                minH="48px"
                px="6"
                borderRadius="md"
              >
                <NextLink href="/setup">
                  Install free
                  <Icon size="sm">
                    <ArrowRight />
                  </Icon>
                </NextLink>
              </Button>
              <Link
                href="#how-it-works"
                color="gray.200"
                minH="44px"
                fontSize="sm"
                gap="2"
              >
                <Icon size="sm">
                  <Play />
                </Icon>
                See how it works
              </Link>
            </Flex>
            <InstallCommand />
            <Text mt="4" fontSize="11px" color="gray.400">
              Free{" "}
              <Text as="span" mx="2" color="gray.600">
                /
              </Text>{" "}
              Project-owned{" "}
              <Text as="span" mx="2" color="gray.600">
                /
              </Text>{" "}
              Built for Next.js
            </Text>
          </Box>
          <Box position="relative" minW="0">
            <Flex justify="space-between" mb="3">
              <Eyebrow light>From prototype to possibility</Eyebrow>
              <Text fontFamily="mono" fontSize="9px" color="gray.400">
                RL—001
              </Text>
            </Flex>
            <ProductTransformation />
          </Box>
        </Grid>
        <Flex
          mt={{ base: "10", md: "14" }}
          pt="6"
          borderTopWidth="1px"
          borderColor="gray.800"
          justify="space-between"
          gap="5"
          wrap="wrap"
        >
          <Text fontSize="12px" color="gray.400">
            Built for the people who build, question, test and improve.
          </Text>
          <Flex gap="3" wrap="wrap" color="gray.300" fontSize="11px">
            <Text>Design</Text>
            <Text color="gray.600">/</Text>
            <Text>Product</Text>
            <Text color="gray.600">/</Text>
            <Text>Research</Text>
            <Text color="gray.600">/</Text>
            <Text>Development</Text>
            <Text color="gray.600">/</Text>
            <Text>Your clients</Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
