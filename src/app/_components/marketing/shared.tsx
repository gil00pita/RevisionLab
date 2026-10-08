import { Box, Flex, Heading, Text, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Text
      fontFamily="mono"
      fontSize="11px"
      fontWeight="medium"
      letterSpacing="0.12em"
      textTransform="uppercase"
      color={light ? "blue.300" : "blue.700"}
    >
      {children}
    </Text>
  );
}

export function Section({ children, ...props }: BoxProps) {
  return (
    <Box
      as="section"
      py={{ base: "16", md: "24" }}
      px={{ base: "5", md: "10", xl: "16" }}
      {...props}
    >
      {children}
    </Box>
  );
}

export function SectionHeading({
  number,
  title,
  description,
  light = false,
}: {
  number: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <Box maxW="3xl" mb={{ base: "8", md: "12" }}>
      <Eyebrow light={light}>{number}</Eyebrow>
      <Heading
        as="h2"
        fontFamily="Manrope, sans-serif"
        fontSize={{ base: "30px", md: "44px", lg: "48px" }}
        fontWeight="500"
        lineHeight="1.15"
        letterSpacing="-0.045em"
        mt="4"
      >
        {title}
      </Heading>
      {description && (
        <Text
          mt="5"
          maxW="2xl"
          color={light ? "gray.400" : "gray.600"}
          fontSize={{ base: "md", md: "lg" }}
          lineHeight="1.7"
        >
          {description}
        </Text>
      )}
    </Box>
  );
}

export function Signal({ vertical = false }: { vertical?: boolean }) {
  return (
    <Flex
      aria-hidden="true"
      align="center"
      justify="center"
      flexDirection={vertical ? "column" : "row"}
    >
      <Box
        bg="signal"
        w={vertical ? "1px" : "100%"}
        h={vertical ? "8" : "1px"}
      />
      <Box
        w="5px"
        h="5px"
        bg="signal"
        transform="rotate(45deg)"
        flexShrink="0"
      />
    </Flex>
  );
}
