"use client";
import { useState } from "react";
import { Avatar, Box, Button, Flex, Grid, Icon, Text } from "@chakra-ui/react";
import { MessageSquare } from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";
import { Eyebrow, Section, SectionHeading } from "./shared";

export function ContextualComments() {
  const [open, setOpen] = useState(true);
  return (
    <Section bg="white" color="gray.900">
      <Box maxW="1280px" mx="auto">
        <SectionHeading
          number="05 / Contextual comments"
          title="Feedback knows where it came from."
          description="A comment belongs to the screen that caused it. Not an inbox, a slide or someone’s memory."
        />
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 0.8fr" }}
          gap={{ base: "6", md: "12" }}
          alignItems="center"
        >
          <Box
            bg="gray.100"
            p={{ base: "5", md: "10" }}
            rounded="lg"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Box
              maxW="360px"
              mx="auto"
              rounded="md"
              overflow="hidden"
              boxShadow="md"
            >
              <NorthstarScreen
                screen={2}
                onComment={() => setOpen((current) => !current)}
              />
            </Box>
            <Text
              fontFamily="mono"
              fontSize="10px"
              color="gray.600"
              mt="5"
              textAlign="center"
            >
              SCREEN_03 / INCOME / VERSION_03
            </Text>
          </Box>
          <Box>
            <Flex align="center" gap="3" mb="5">
              <Box h="1px" w="10" bg="signal" />
              <Eyebrow>COMMENT_08 · Pinned to repayment estimate</Eyebrow>
            </Flex>
            {open ? (
              <Box borderLeftWidth="2px" borderColor="blue.500" ps="6">
                <Flex gap="3" align="center">
                  <Avatar.Root w="10" h="10" bg="blue.100" color="blue.800">
                    <Avatar.Fallback
                      name="Sarah M."
                      fontSize="xs"
                      fontWeight="700"
                    />
                  </Avatar.Root>
                  <Box>
                    <Text fontWeight="600" fontSize="sm">
                      Sarah M.
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Business Analyst
                    </Text>
                  </Box>
                </Flex>
                <Text
                  as="blockquote"
                  fontFamily="Manrope, sans-serif"
                  fontSize={{ base: "21px", md: "26px" }}
                  lineHeight="1.55"
                  letterSpacing="-0.025em"
                  mt="6"
                >
                  “The repayment figure is useful, but I’m not sure users
                  understand how it relates to the affordability questions
                  below.”
                </Text>
                <Flex mt="6" gap="2" wrap="wrap">
                  {["Applicant flow", "Version 3", "Income"].map((label) => (
                    <Text
                      key={label}
                      bg="gray.100"
                      px="3"
                      py="1"
                      rounded="sm"
                      fontSize="10px"
                      color="gray.600"
                    >
                      {label}
                    </Text>
                  ))}
                </Flex>
              </Box>
            ) : (
              <Text color="gray.600">
                Select the numbered pin to reopen Sarah’s thread on its source
                screen.
              </Text>
            )}
            <Button
              mt="6"
              variant="ghost"
              color="blue.700"
              minH="44px"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
            >
              <Icon size="sm">
                <MessageSquare />
              </Icon>
              {open ? "Close example thread" : "Open example thread"}
            </Button>
          </Box>
        </Grid>
      </Box>
    </Section>
  );
}
