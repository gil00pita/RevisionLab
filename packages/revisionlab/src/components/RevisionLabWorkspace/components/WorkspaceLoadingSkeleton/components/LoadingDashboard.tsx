import { Box, Flex, Grid, Heading, SimpleGrid, Stack } from "@chakra-ui/react";
import { LoadingBar } from "./LoadingBar.js";

export function LoadingDashboard() {
  return (
    <Grid
      templateColumns={{ base: "minmax(0, 1fr)", xl: "minmax(0, 2.2fr) minmax(0, 1fr)" }}
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
          <Heading as="h2" fontSize="md" fontWeight="medium" mb="6">
            Workspace activity
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="0">
            {Array.from({ length: 4 }, (_, index) => (
              <Box
                key={index}
                minW="0"
                py="5"
                pr={{ base: "0", md: index % 2 === 0 ? "6" : "0" }}
                pl={{ base: "0", md: index % 2 === 1 ? "6" : "0" }}
                borderTopWidth={index >= 2 ? "1px" : "0"}
                borderLeftWidth={{ base: "0", md: index % 2 === 1 ? "1px" : "0" }}
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
        <Stack gap="4" pb="6" borderBottomWidth="1px" borderColor="border.muted">
          <Heading as="h2" fontSize="md" fontWeight="medium">
            Comment resolution
          </Heading>
          <ResolutionSkeleton />
          {[0, 1].map((index) => (
            <Flex key={index} justify="space-between" gap="3" align="center">
              <LoadingBar h="3" w="36" maxW="70%" />
              <LoadingBar h="4" w="4" />
            </Flex>
          ))}
          <LoadingBar h="3" w="full" />
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
        <LoadingBar h="4" w="70%" />
        <LoadingBar boxSize="4" flexShrink="0" />
      </Flex>
      <LoadingBar h={variant === "review" ? "9" : "8"} w="12" />
      <Stack gap="2">
        <LoadingBar h="3" w="full" />
        <LoadingBar h="3" w="80%" />
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
          <LoadingBar h="20px" w="full" borderRadius="full" />
        </Box>
      ))}
      <Stack position="absolute" inset="20%" align="center" justify="center" gap="3">
        <LoadingBar h="7" w="16" />
        <LoadingBar h="3" w="20" />
      </Stack>
    </Box>
  );
}
