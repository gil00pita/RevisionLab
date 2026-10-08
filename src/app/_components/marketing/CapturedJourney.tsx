import { Box, Flex, Text } from "@chakra-ui/react";
import { NorthstarScreen, screenNames } from "./NorthstarScreen";
import { Signal } from "./shared";

export function CapturedJourney({ phase }: { phase: number }) {
  const captured = phase >= 3 ? 5 : phase === 2 ? 2 : phase === 1 ? 1 : 0;
  return (
    <Box mt="5">
      <Flex gap="0" align="center">
        {screenNames.map((name, i) => (
          <Flex
            key={name}
            minW="0"
            flex="1"
            align="center"
            display={{ base: i < 3 ? "flex" : "none", md: "flex" }}
          >
            <Box
              w="full"
              h={{ base: "90px", md: "115px" }}
              borderWidth="1px"
              borderColor={i === 2 && phase >= 3 ? "signal" : "gray.700"}
              rounded="sm"
              overflow="hidden"
              transform={i < captured ? "translateY(0)" : "translateY(5px)"}
              transition={`transform 400ms ease ${i * 70}ms`}
              _motionReduce={{ transition: "none" }}
            >
              {i < captured ? (
                <NorthstarScreen screen={i} compact />
              ) : (
                <Flex h="full" align="center" justify="center" bg="gray.800">
                  <Text fontFamily="mono" fontSize="9px" color="gray.400">
                    0{i + 1}
                  </Text>
                </Flex>
              )}
            </Box>
            {i < 4 && (
              <Box
                w="3"
                flexShrink="0"
                opacity={phase >= 3 ? 1 : 0}
                hideBelow={i === 2 ? "md" : undefined}
              >
                <Signal />
              </Box>
            )}
          </Flex>
        ))}
      </Flex>
      <Flex justify="space-between" mt="2">
        <Text fontFamily="mono" fontSize="8px" color="blue.300">
          {captured} CAPTURED SCREENS →{" "}
          {phase >= 3 ? "CONNECTED FLOW" : "RECORDING"}
        </Text>
        <Text fontFamily="mono" fontSize="8px" color="gray.400">
          FLOW_04 · APPLICANT
        </Text>
      </Flex>
    </Box>
  );
}
