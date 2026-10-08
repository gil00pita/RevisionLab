import { Box, DataList, Heading, Stack, Text } from "@chakra-ui/react";
import {
  monthlyPayment,
  pounds,
  validateDemoStep,
  type DemoDraft,
} from "./demoData";

export function DemoEstimate({
  draft,
  showAffordability,
}: {
  draft: DemoDraft;
  showAffordability: boolean;
}) {
  const payment = monthlyPayment(draft);
  const remaining =
    Number(draft.income) - Number(draft.spending) - (payment ?? 0);
  const validIncome = Object.keys(validateDemoStep(draft, 2)).length === 0;
  const details =
    payment === null
      ? []
      : [
          [
            "Amount to borrow",
            pounds(Number(draft.vehiclePrice) - Number(draft.deposit)),
          ],
          ["Term", `${draft.months} months`],
        ];
  return (
    <Stack
      as="aside"
      aria-label="Example payment"
      gap="6"
      bg="colorPalette.subtle"
      p={{ base: "6", md: "8" }}
      borderRadius="xl"
      h="fit-content"
    >
      <Box>
        <Heading as="h2" size="sm" color="colorPalette.fg">
          Your example payment
        </Heading>
        <Text
          fontSize="4xl"
          fontWeight="bold"
          letterSpacing="tight"
          mt="3"
          color="colorPalette.fg"
        >
          {payment === null ? "—" : pounds(payment)}
          <Text as="span" fontSize="sm" fontWeight="normal">
            {" "}
            / month
          </Text>
        </Text>
        {payment === null && (
          <Text fontSize="sm" color="fg.muted">
            Enter valid finance details to see an estimate.
          </Text>
        )}
      </Box>
      <DataList.Root>
        {details.map(([label, value]) => (
          <DataList.Item key={label}>
            <DataList.ItemLabel color="fg.muted">{label}</DataList.ItemLabel>
            <DataList.ItemValue fontWeight="semibold">
              {value}
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
      {showAffordability && payment !== null && validIncome && (
        <Box borderTopWidth="1px" borderColor="colorPalette.muted" pt="5">
          <Text fontSize="sm">Left after living costs and this payment</Text>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            mt="1"
            color={remaining < 0 ? "fg.error" : "colorPalette.fg"}
          >
            {pounds(remaining)} / month
          </Text>
          <Text fontSize="sm" color="fg.muted" mt="2">
            {remaining < 0
              ? "This example is over budget. Try adjusting the finance options or your sample costs."
              : "An illustration to explore the journey, not an affordability decision."}
          </Text>
        </Box>
      )}
      <Text fontSize="xs" color="fg.muted">
        Illustrative estimate only: borrowing plus a simple 1.55% per year,
        divided by the term. This is not a quote or an APR calculation.
      </Text>
    </Stack>
  );
}
