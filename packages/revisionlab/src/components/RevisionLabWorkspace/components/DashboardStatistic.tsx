import { Flex, Icon, Stat, Text } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import {
  dashboardUpdateEase,
  useDashboardUpdate,
} from "../hooks/useDashboardUpdate.js";

export function DashboardStatistic({
  label,
  value,
  help,
  icon: MetricIcon,
  variant,
}: {
  label: string;
  value: number | null;
  help: string;
  icon: LucideIcon;
  variant: "review" | "inventory";
}) {
  const { ref, recentlyUpdated } = useDashboardUpdate(value);
  return (
    <Stat.Root
      unstyled
      display="flex"
      flexDirection="column"
      bg="white"
      py="3"
      minW="0"
      gap="3"
    >
      <Stat.Label color="gray.600" fontSize="sm" fontWeight="medium" lineHeight="tall">
        <Flex justify="space-between" align="center" gap="3">
          <Text as="span" flex="1" minW="0" overflowWrap="anywhere">
            {label}
          </Text>
          <Flex align="center" justify="center" flexShrink="0">
            <Icon size="sm" color="blue.600" aria-hidden="true">
              <MetricIcon />
            </Icon>
          </Flex>
        </Flex>
      </Stat.Label>
      <Stat.ValueText
        ref={ref}
        fontSize={value === null ? "xl" : variant === "review" ? "3xl" : "2xl"}
        fontWeight="semibold"
        color={recentlyUpdated ? "green.700" : "gray.900"}
        letterSpacing="tight"
        lineHeight="shorter"
        fontVariantNumeric="tabular-nums"
        overflowWrap="anywhere"
        transform={recentlyUpdated ? "scale(1.025)" : "scale(1)"}
        transformOrigin="left center"
        transitionProperty="color, transform"
        transitionDuration={recentlyUpdated ? "moderate" : "fast"}
        transitionTimingFunction={dashboardUpdateEase}
        _motionReduce={{ transform: "none", transitionDuration: "0s" }}
      >
        {value === null ? "Unavailable" : value.toLocaleString("en")}
      </Stat.ValueText>
      <Stat.HelpText as="dd" color="gray.600" fontSize="xs" lineHeight="tall">
        {value === null
          ? "A selected workspace could not provide this total. Check its connection or ask its owner to update RevisionLab."
          : help}
      </Stat.HelpText>
    </Stat.Root>
  );
}
