import { Box, Flex, Grid, SimpleGrid, Stack } from "@chakra-ui/react";
import { SkeletonBlock } from "./SkeletonBlock.js";

export function OverviewSkeleton() {
  return (
    <Grid
      templateColumns={{
        base: "minmax(0, 1fr)",
        xl: "minmax(0, 2.2fr) minmax(0, 1fr)",
      }}
      flex="1"
      minW="0"
      alignItems="start"
      aria-hidden="true"
    >
      <Stack gap="0" minW="0" px={{ base: "4", md: "6", xl: "8" }}>
        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          gap="0"
          borderBottomWidth="1px"
          borderColor="border.muted"
          py="6"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <Box
              key={index}
              minW="0"
              px={{ base: "0", md: index === 0 ? "0" : "5" }}
              borderLeftWidth={{ base: "0", md: index === 0 ? "0" : "1px" }}
              borderColor="border.muted"
            >
              <MetricSkeleton variant="review" />
            </Box>
          ))}
        </SimpleGrid>
        <Box py="7">
          <SkeletonBlock h="5" w="40" mb="6" />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="0">
            {Array.from({ length: 4 }, (_, index) => (
              <Box
                key={index}
                minW="0"
                py="5"
                pr={{ base: "0", md: index % 2 === 0 ? "6" : "0" }}
                pl={{ base: "0", md: index % 2 === 1 ? "6" : "0" }}
                borderTopWidth={index >= 2 ? "1px" : "0"}
                borderLeftWidth={{
                  base: "0",
                  md: index % 2 === 1 ? "1px" : "0",
                }}
                borderColor="border.muted"
              >
                <MetricSkeleton variant="inventory" />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Stack>
      <Stack
        minW="0"
        gap="0"
        px={{ base: "4", md: "6" }}
        py="6"
        borderLeftWidth={{ base: "0", xl: "1px" }}
        borderTopWidth={{ base: "1px", xl: "0" }}
        borderColor="border.muted"
      >
        <Stack
          gap="4"
          pb="6"
          borderBottomWidth="1px"
          borderColor="border.muted"
        >
          <SkeletonBlock h="5" w="40" />
          <ResolutionSkeleton />
          {[0, 1].map((index) => (
            <Flex key={index} justify="space-between" gap="3" align="center">
              <SkeletonBlock h="3" w="36" maxW="70%" />
              <SkeletonBlock h="4" w="4" />
            </Flex>
          ))}
          <SkeletonBlock h="3" w="full" />
        </Stack>
        <Box py="6" borderBottomWidth="1px" borderColor="border.muted">
          <MetricSkeleton variant="inventory" />
        </Box>
      </Stack>
    </Grid>
  );
}

function MetricSkeleton({ variant }: { variant: "review" | "inventory" }) {
  return (
    <Stack py="3" gap="3" minW="0">
      <Flex justify="space-between" gap="3" align="center">
        <SkeletonBlock h="4" w="70%" />
        <SkeletonBlock boxSize="4" flexShrink="0" />
      </Flex>
      <SkeletonBlock h={variant === "review" ? "9" : "8"} w="12" />
      <Stack gap="2">
        <SkeletonBlock h="3" w="full" />
        <SkeletonBlock h="3" w="80%" />
      </Stack>
    </Stack>
  );
}

function ResolutionSkeleton() {
  return (
    <Box position="relative" w="full" maxW="64" aspectRatio="1" mx="auto">
      {Array.from({ length: 48 }, (_, index) => (
        <Box
          key={index}
          position="absolute"
          top="0"
          left="50%"
          h="50%"
          w="4px"
          transformOrigin="center bottom"
          transform={`translateX(-50%) rotate(${-140 + (index * 280) / 47}deg)`}
        >
          <SkeletonBlock h="20px" w="full" borderRadius="full" />
        </Box>
      ))}
      <Stack
        position="absolute"
        inset="20%"
        align="center"
        justify="center"
        gap="3"
      >
        <SkeletonBlock h="7" w="16" />
        <SkeletonBlock h="3" w="20" />
      </Stack>
    </Box>
  );
}
