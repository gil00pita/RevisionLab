import { Flex, Icon, Stat } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";

export function DashboardStatistic({
  label,
  value,
  help,
  icon: MetricIcon,
}: {
  label: string;
  value: number | null;
  help: string;
  icon: LucideIcon;
}) {
  return (
    <Stat.Root
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p="5"
      minW="0"
      gap="3"
    >
      <Stat.Label color="gray.600" fontSize="sm">
        <Flex justify="space-between" align="center" gap="3">
          {label}
          <Icon size="md" color="blue.700" flexShrink="0">
            <MetricIcon />
          </Icon>
        </Flex>
      </Stat.Label>
      <Stat.ValueText
        fontSize={value === null ? "xl" : "4xl"}
        fontWeight="semibold"
        letterSpacing="tight"
      >
        {value === null ? "Unavailable" : value.toLocaleString("en")}
      </Stat.ValueText>
      <Stat.HelpText as="dd" color="gray.600" fontSize="xs">
        {value === null
          ? "A selected source is unavailable or does not provide this total."
          : help}
      </Stat.HelpText>
    </Stat.Root>
  );
}
