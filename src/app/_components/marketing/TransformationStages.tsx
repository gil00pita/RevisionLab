import { Button, Grid, Text } from "@chakra-ui/react";
import { transformationPhases as phases } from "./transformation";

export function TransformationStages({
  phase,
  reducedMotion,
  seek,
}: {
  phase: number;
  reducedMotion: boolean;
  seek: (phase: number) => void;
}) {
  return (
    <>
      <Grid
        role="group"
        templateColumns={{ base: "repeat(5, 1fr)", md: "repeat(10, 1fr)" }}
        gap="1"
        mt="3"
        aria-label="Transformation stages"
      >
        {phases.map((name, i) => (
          <Button
            key={name}
            unstyled
            display="flex"
            alignItems="center"
            justifyContent="center"
            minH="44px"
            w="full"
            borderTopWidth="2px"
            borderColor={phase === i ? "signal" : "gray.700"}
            color={phase === i ? "blue.300" : "gray.400"}
            fontFamily="mono"
            fontSize="10px"
            aria-label={`Show stage ${i + 1}: ${name}`}
            aria-pressed={phase === i}
            onClick={() => seek(i)}
            _hover={{ bg: "gray.800" }}
            _focusVisible={{
              outlineWidth: "2px",
              outlineStyle: "solid",
              outlineColor: "blue.300",
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </Button>
        ))}
      </Grid>
      <Text mt="2" fontSize="10px" color="gray.400">
        Fictional product demonstration ·{" "}
        {reducedMotion
          ? "Reduced motion: explore stages manually."
          : "A connected story in 22 seconds."}
      </Text>
    </>
  );
}
