import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { MessageSquare, ScanLine } from "lucide-react";
import { Eyebrow } from "./shared";

export function TransformationEvidence({ phase }: { phase: number }) {
  return (
    <Box flex="1" minW="0" pt="5" maxW="250px">
      <Eyebrow light>
        {phase >= 7 ? "Feedback Review" : "Evidence, in context"}
      </Eyebrow>
      <Box
        mt="3"
        p={{ base: "2", md: "3" }}
        borderWidth="1px"
        borderColor="gray.700"
        bg="gray.800"
        rounded="md"
      >
        <Flex gap="2" align="center" color="blue.300">
          <Icon boxSize="12px">
            <MessageSquare />
          </Icon>
          <Text fontSize="9px" fontWeight="600">
            Sarah · Business Analyst
          </Text>
        </Flex>
        <Text
          mt="2"
          fontSize={{ base: "10px", md: "11px" }}
          lineHeight="1.6"
          color="gray.200"
        >
          The repayment estimate feels disconnected from the affordability
          question.
        </Text>
      </Box>
      {phase >= 5 && (
        <Box
          mt="2"
          p={{ base: "2", md: "3" }}
          borderWidth="1px"
          borderColor="gray.700"
          rounded="md"
        >
          <Flex align="center" gap="2" color="orange.300">
            <Icon boxSize="12px">
              <ScanLine />
            </Icon>
            <Text fontSize="9px">WCAG 2.2 AA</Text>
          </Flex>
          <Text mt="1" fontSize="10px" color="gray.300">
            Form control needs an accessible name.
          </Text>
        </Box>
      )}
      {phase >= 6 && (
        <Box mt="2" p={{ base: "2", md: "3" }} bg="gray.800" rounded="md">
          <Text fontFamily="mono" fontSize="8px" color="gray.400">
            TEST · PARTICIPANT 04
          </Text>
          <Text fontSize="11px" mt="1" color="gray.200">
            18.2s · 3 clicks
          </Text>
          <Text fontSize="8px" mt="1" color="gray.400">
            Observation, not a conclusion.
          </Text>
        </Box>
      )}
    </Box>
  );
}
