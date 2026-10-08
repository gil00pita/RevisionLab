import { Box, Field, Flex, Grid, Input, Text } from "@chakra-ui/react";

const fields = [
  [
    ["Vehicle price", "£28,500"],
    ["Deposit", "£4,000"],
    ["Term", "48 months"],
  ],
  [
    ["Full name", "Alex Morgan"],
    ["Email address", "alex@example.com"],
    ["Postcode", "SW1A 1AA"],
  ],
  [
    ["Monthly take-home pay", "£3,200"],
    ["Monthly housing cost", "£850"],
    ["Other commitments", "£240"],
  ],
  [
    ["Applicant", "Alex Morgan"],
    ["Amount to finance", "£24,500"],
    ["Repayment term", "48 months"],
  ],
];

export function NorthstarFields({
  screen,
  compact,
  highlight,
}: {
  screen: number;
  compact: boolean;
  highlight: boolean;
}) {
  return (
    <Grid gap={compact ? "2" : "3"}>
      {fields[screen].map(([label, value]) =>
        compact ? (
          <Box key={label}>
            <Text fontSize="7px" mb="1" color="gray.600" truncate>
              {label}
            </Text>
            <Flex
              borderWidth="1px"
              borderColor={
                highlight && label === "Monthly housing cost"
                  ? "orange.600"
                  : "gray.500"
              }
              borderRadius="sm"
              px="2"
              py="1"
              bg="gray.50"
              justify="space-between"
            >
              <Text fontSize="8px" fontWeight="500" truncate>
                {value}
              </Text>
            </Flex>
          </Box>
        ) : (
          <Field.Root key={label}>
            <Field.Label fontSize="11px" color="gray.600">
              {label}
            </Field.Label>
            <Input
              value={value}
              readOnly
              bg="gray.50"
              color="gray.800"
              minH="44px"
              h="11"
              fontSize="13px"
              borderRadius="sm"
              borderColor={
                highlight && label === "Monthly housing cost"
                  ? "orange.600"
                  : "gray.500"
              }
              outlineWidth={
                highlight && label === "Monthly housing cost" ? "2px" : "0"
              }
              outlineStyle="solid"
              outlineColor="orange.600"
            />
          </Field.Root>
        ),
      )}
    </Grid>
  );
}
