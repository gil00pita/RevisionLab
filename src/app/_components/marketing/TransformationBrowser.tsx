import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { MousePointer2 } from "lucide-react";
import { NorthstarScreen } from "./NorthstarScreen";

export function TransformationBrowser({
  phase,
  seek,
}: {
  phase: number;
  seek: (phase: number) => void;
}) {
  const mapped = phase >= 3;
  const final = phase === 9;
  const screen = phase < 2 ? 0 : phase === 2 ? 1 : 2;
  return (
    <Box
      w={{ base: mapped ? "58%" : "95%", md: mapped ? "57%" : "76%" }}
      maxW="360px"
      position="relative"
      transition="width 700ms ease, transform 700ms ease"
      _motionReduce={{ transition: "none" }}
      transform={mapped ? "translateX(-5px)" : "translateX(0)"}
    >
      <Flex
        bg="gray.100"
        h="7"
        align="center"
        px="3"
        gap="1"
        borderTopRadius="md"
      >
        <Box w="1" h="1" rounded="full" bg="gray.400" />
        <Box w="1" h="1" rounded="full" bg="gray.400" />
        <Box w="1" h="1" rounded="full" bg="gray.400" />
        <Text mx="auto" fontSize="8px" color="gray.600" truncate>
          northstar.example/apply
        </Text>
      </Flex>
      <Box
        borderWidth="1px"
        borderColor={phase === 2 || phase === 5 ? "signal" : "gray.200"}
        borderBottomRadius="md"
        overflow="hidden"
        position="relative"
      >
        <NorthstarScreen
          screen={screen}
          version={final ? 4 : 3}
          compact={mapped}
          onContinue={!mapped ? () => seek(phase < 2 ? 2 : 3) : undefined}
        />
        {phase === 5 && (
          <Box
            position="absolute"
            top="57%"
            left="5%"
            w="90%"
            h="1px"
            bg="signal"
            aria-hidden="true"
          />
        )}
        <Icon
          aria-hidden="true"
          position="absolute"
          right={phase === 1 ? "8%" : "42%"}
          bottom={phase === 1 ? "20%" : "45%"}
          opacity={phase <= 1 ? 1 : 0}
          boxSize="22px"
          color="blue.600"
          transition="right 800ms ease, bottom 800ms ease"
          _motionReduce={{ transition: "none" }}
        >
          <MousePointer2 />
        </Icon>
        {phase >= 4 && (
          <Flex
            position="absolute"
            right="-1px"
            top="58%"
            rounded="full"
            bg="blue.600"
            color="white"
            w="5"
            h="5"
            align="center"
            justify="center"
            fontSize="10px"
          >
            1
          </Flex>
        )}
      </Box>
      <Text mt="2" fontFamily="mono" fontSize="8px" color="gray.400">
        {phase === 2
          ? "SCREEN_02 CAPTURED"
          : mapped
            ? "SCREEN_03 · INCOME"
            : "REC · APPLICANT JOURNEY"}
      </Text>
    </Box>
  );
}
