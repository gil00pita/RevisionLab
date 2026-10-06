import { Flex, Icon, Stat } from "@chakra-ui/react";
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
  const review = variant === "review";
  const { ref, recentlyUpdated } = useDashboardUpdate(value);
  const valueColor = recentlyUpdated
    ? review
      ? "blue.200"
      : "blue.700"
    : review
      ? "white"
      : "gray.900";
  return (
    <Stat.Root
      unstyled
      display="flex"
      flexDirection="column"
      p={{ base: "4", md: "6" }}
      minW="0"
      gap="3"
    >
      <Stat.Label
        color={review ? "blue.100" : "gray.600"}
        fontSize="sm"
        fontWeight="medium"
        lineHeight="moderate"
      >
        <Flex justify="space-between" align="center" gap="3">
          {label}
          <Icon size="md" color={review ? "blue.200" : "blue.700"} flexShrink="0">
            <MetricIcon />
          </Icon>
        </Flex>
      </Stat.Label>
      <Stat.ValueText
        ref={ref}
        fontSize={
          value === null ? "xl" : review ? { base: "5xl", lg: "6xl" } : "3xl"
        }
        fontWeight="bold"
        color={valueColor}
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
      <Stat.HelpText
        as="dd"
        color={review ? "blue.200" : "gray.600"}
        fontSize="xs"
        lineHeight="tall"
      >
        {value === null
          ? "A selected workspace could not provide this total. Check its connection or ask its owner to update RevisionLab."
          : help}
      </Stat.HelpText>
    </Stat.Root>
  );
}
