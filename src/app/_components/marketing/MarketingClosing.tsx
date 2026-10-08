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
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { InstallCommand } from "./InstallCommand";
import { FinalReviewLoop } from "./FinalReviewLoop";
import { Eyebrow, Section } from "./shared";

export function MarketingClosing() {
  return (
    <>
      <Section bg="white" color="gray.900">
        <Flex
          maxW="1280px"
          mx="auto"
          justify="space-between"
          gap="8"
          align="center"
          wrap="wrap"
        >
          <Box>
            <Eyebrow>No plans. No pricing puzzle.</Eyebrow>
            <Heading
              as="h2"
              mt="4"
              fontFamily="Manrope, sans-serif"
              fontSize={{ base: "64px", md: "100px" }}
              fontWeight="500"
              letterSpacing="-0.06em"
              lineHeight="1"
            >
              Free.
            </Heading>
            <Text
              mt="5"
              maxW="xl"
              color="gray.600"
              fontSize="lg"
              lineHeight="1.7"
            >
              RevisionLab is built to reduce the friction between prototyping,
              review and delivery.
            </Text>
          </Box>
          <Button
            asChild
            size="lg"
            minH="48px"
            colorPalette="blue"
            bg="blue.600"
          >
            <NextLink href="/setup">
              Install RevisionLab
              <Icon size="sm">
                <ArrowRight />
              </Icon>
            </NextLink>
          </Button>
        </Flex>
      </Section>
      <Section bg="gray.950" color="gray.100" pb={{ base: "12", md: "16" }}>
        <Box maxW="1280px" mx="auto">
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 0.7fr" }}
            gap={{ base: "10", md: "16" }}
            alignItems="center"
          >
            <Box>
              <Eyebrow light>Ready for another review.</Eyebrow>
              <Heading
                as="h2"
                fontFamily="Manrope, sans-serif"
                fontSize={{ base: "42px", md: "62px" }}
                fontWeight="500"
                letterSpacing="-0.055em"
                lineHeight="1.1"
                mt="6"
              >
                Stop rebuilding your prototype for review.
              </Heading>
              <Text
                fontFamily="Manrope, sans-serif"
                color="blue.300"
                fontSize={{ base: "22px", md: "28px" }}
                letterSpacing="-0.03em"
                mt="6"
                mb="8"
              >
                Turn it into the review workspace.
              </Text>
              <InstallCommand />
              <Link asChild mt="6" minH="44px" color="gray.200" fontSize="sm">
                <NextLink href="/setup">
                  Get started with the installation guide
                  <Icon size="sm">
                    <ArrowUpRight />
                  </Icon>
                </NextLink>
              </Link>
            </Box>
            <FinalReviewLoop />
          </Grid>
          <Box mt="14" pt="6" borderTopWidth="1px" borderColor="gray.800">
            <Text fontSize="11px" color="gray.400" lineHeight="1.8" maxW="4xl">
              All Northstar Finance screens, people and evidence are fictional
              demonstrations. The local development build includes features that
              may not be in the npm release. Codex assistance requires a local,
              signed-in CLI and existing permissions. Jira drafts are handed off
              manually.
            </Text>
          </Box>
        </Box>
      </Section>
    </>
  );
}
