import { Badge, Tabs } from "@chakra-ui/react";

export function SessionTabs({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  return (
    <Tabs.List
      aria-label="Test session groups"
      colorPalette="blue"
      borderBottomWidth="0"
      minH="11"
      gap={{ base: "2", md: "5" }}
      flexWrap="wrap"
      w="full"
    >
      {[
        { value: "current", label: "Current sessions", count: current },
        { value: "previous", label: "Previous sessions", count: previous },
      ].map((group) => (
        <Tabs.Trigger
          key={group.value}
          value={group.value}
          minH="11"
          h="auto"
          minW="0"
          px="1"
          py="3"
          maxW="full"
          whiteSpace="normal"
          textAlign="start"
          color="fg.muted"
          _selected={{ color: "blue.fg" }}
          focusRing="inside"
          focusRingColor="blue.focusRing"
          _motionReduce={{ transition: "none" }}
        >
          {group.label}
          <Badge colorPalette="blue" flexShrink="0">
            {group.count}
          </Badge>
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
