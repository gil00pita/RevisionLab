import { Avatar, Box, Flex, Grid, Heading, Icon, Text } from "@chakra-ui/react";
import { GitBranch } from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading } from "./shared";

const perspectives = [
  ["CL", "Client", "Does this solve the right problem?"],
  ["DS", "Designer", "Does the journey make sense?"],
  ["RS", "Researcher", "What happened during testing?"],
  ["AX", "Accessibility specialist", "What barriers exist?"],
  ["BA", "Business Analyst", "What requirement does this affect?"],
  ["DV", "Developer", "What exactly needs to change?"],
];

export function PeopleSection() {
  return (
    <Section bg="gray.950" color="gray.100">
      <Box maxW="1280px" mx="auto">
        <Eyebrow light>11 / Human-centred by design</Eyebrow>
        <Heading
          as="h2"
          mt="5"
          maxW="1000px"
          fontFamily="Manrope, sans-serif"
          fontSize={{ base: "34px", md: "56px" }}
          fontWeight="500"
          lineHeight="1.15"
          letterSpacing="-0.045em"
        >
          AI shouldn’t remove people from product design.
          <Text as="span" color="gray.400" display="block" mt="2">
            It should remove the repetitive work around them.
          </Text>
        </Heading>
        <Flex mt="10" gap={{ base: "3", md: "5" }} wrap="wrap" align="center">
          {[
            "People",
            "Observe",
            "Evidence",
            "Discuss",
            "Decision",
            "AI assistance",
            "Reviewed change",
          ].map((name, i) => (
            <Flex key={name} align="center" gap="4">
              <Text
                fontFamily="mono"
                fontSize="11px"
                color={i === 5 ? "blue.300" : "gray.300"}
                borderBottomWidth="1px"
                borderColor={i === 5 ? "signal" : "gray.700"}
                py="3"
              >
                {name}
              </Text>
              {i < 6 && (
                <Text aria-hidden="true" color="signal">
                  →
                </Text>
              )}
            </Flex>
          ))}
        </Flex>
        <Box mt={{ base: "16", md: "24" }}>
          <SectionHeading
            number="Different perspectives. Shared context."
            title="One prototype. Different perspectives."
            light
          />
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}
            gap={{ base: "6", md: "8" }}
            alignItems="center"
          >
            <Flex direction="column" gap="6">
              {perspectives.slice(0, 3).map(([initials, role, quote]) => (
                <Perspective
                  key={role}
                  initials={initials}
                  role={role}
                  quote={quote}
                />
              ))}
            </Flex>
            <Box px={{ base: "6", md: "2" }} position="relative">
              <Box
                aria-hidden="true"
                position="absolute"
                left="-8"
                right="-8"
                top="50%"
                h="1px"
                bg="blue.700"
                hideBelow="md"
              />
              <Box
                position="relative"
                borderWidth="1px"
                borderColor="blue.500"
                rounded="md"
                overflow="hidden"
                maxW="260px"
                mx="auto"
              >
                <NorthstarScreen screen={2} compact />
              </Box>
              <Flex justify="center" gap="2" align="center" mt="5">
                <Icon color="blue.300" size="sm">
                  <GitBranch />
                </Icon>
                <Text fontSize="11px" color="blue.200">
                  The same source. One review history.
                </Text>
              </Flex>
            </Box>
            <Flex direction="column" gap="6">
              {perspectives.slice(3).map(([initials, role, quote]) => (
                <Perspective
                  key={role}
                  initials={initials}
                  role={role}
                  quote={quote}
                />
              ))}
            </Flex>
          </Grid>
        </Box>
      </Box>
    </Section>
  );
}

function Perspective({
  initials,
  role,
  quote,
}: {
  initials: string;
  role: string;
  quote: string;
}) {
  return (
    <Flex
      gap="4"
      align="start"
      borderBottomWidth="1px"
      borderColor="gray.800"
      pb="5"
    >
      <Avatar.Root
        flexShrink="0"
        w="10"
        h="10"
        bg="gray.950"
        borderWidth="1px"
        borderColor="gray.600"
        color="blue.200"
      >
        <Avatar.Fallback fontFamily="mono" fontSize="10px">
          {initials}
        </Avatar.Fallback>
      </Avatar.Root>
      <Box>
        <Text color="gray.400" fontSize="11px">
          {role}
        </Text>
        <Text
          fontFamily="Manrope, sans-serif"
          mt="2"
          fontSize="lg"
          lineHeight="1.4"
        >
          “{quote}”
        </Text>
      </Box>
    </Flex>
  );
}
