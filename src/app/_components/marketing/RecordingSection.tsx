import { Box, Flex, Grid, Icon, Text } from "@chakra-ui/react";
import { GitBranch } from "lucide-react";
import { ProductTransformation } from "./ProductTransformation";
import { Section, SectionHeading } from "./shared";

export function RecordingSection() {
  return (
    <Section
      id="how-it-works"
      bg="gray.950"
      color="gray.100"
      borderTopWidth="1px"
      borderColor="gray.800"
    >
      <Grid
        maxW="1280px"
        mx="auto"
        templateColumns={{ base: "1fr", lg: "0.7fr 1fr" }}
        gap={{ base: "8", md: "16" }}
        alignItems="center"
      >
        <Box>
          <SectionHeading
            number="01 / Observe the transformation"
            title="Watch the prototype become the review."
            description="Build the prototype once. Don’t rebuild it for review. Record a journey and let the screens become a shared place to understand it."
            light
          />
          <Flex align="center" gap="3" color="gray.400" fontSize="sm">
            <Icon color="blue.300">
              <GitBranch />
            </Icon>
            <Text>One journey. Five screens. All connected.</Text>
          </Flex>
          <Text
            mt="8"
            maxW="sm"
            fontSize="xs"
            color="gray.400"
            lineHeight="1.7"
          >
            This page demonstrates the local development build. Some
            capabilities may not yet be available in the npm release.
          </Text>
        </Box>
        <ProductTransformation controlled />
      </Grid>
    </Section>
  );
}
