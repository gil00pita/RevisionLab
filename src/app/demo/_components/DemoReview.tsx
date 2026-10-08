import NextLink from "next/link";
import { Box, DataList, Flex, Heading, Link, Stack } from "@chakra-ui/react";
import { pounds, type DemoDraft } from "./demoData";

export function DemoReview({ draft }: { draft: DemoDraft }) {
  const sections = [
    {
      title: "Finance options",
      slug: "finance",
      details: [
        ["Vehicle price", pounds(Number(draft.vehiclePrice))],
        ["Deposit", pounds(Number(draft.deposit))],
        ["Term", `${draft.months} months`],
      ],
    },
    {
      title: "Applicant details",
      slug: "applicant",
      details: [
        ["Name", `${draft.firstName} ${draft.lastName}`],
        ["Email address", draft.email],
      ],
    },
    {
      title: "Income and spending",
      slug: "income",
      details: [
        ["Take-home income", `${pounds(Number(draft.income))} / month`],
        ["Living costs", `${pounds(Number(draft.spending))} / month`],
      ],
    },
  ];

  return (
    <Stack gap="7">
      {sections.map((section) => (
        <Box as="section" key={section.slug}>
          <Flex align="center" justify="space-between" gap="4" mb="3">
            <Heading as="h2" size="sm">
              {section.title}
            </Heading>
            <Link asChild color="colorPalette.fg" minH="11" fontSize="sm">
              <NextLink
                href={`/demo/${section.slug}`}
                aria-label={`Edit ${section.title.toLowerCase()}`}
              >
                Edit
              </NextLink>
            </Link>
          </Flex>
          <DataList.Root orientation="horizontal" gap="3">
            {section.details.map(([label, value]) => (
              <DataList.Item key={label} flexWrap="wrap" gap="2">
                <DataList.ItemLabel flex="1" minW="36">
                  {label}
                </DataList.ItemLabel>
                <DataList.ItemValue
                  flex="1"
                  minW="0"
                  overflowWrap="anywhere"
                  fontWeight="medium"
                >
                  {value}
                </DataList.ItemValue>
              </DataList.Item>
            ))}
          </DataList.Root>
        </Box>
      ))}
    </Stack>
  );
}
