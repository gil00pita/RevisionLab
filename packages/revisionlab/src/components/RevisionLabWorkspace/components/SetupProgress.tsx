import { List, Steps } from "@chakra-ui/react";

export function SetupProgress({
  step,
  titles,
}: {
  step: number;
  titles: string[];
}) {
  return (
    <Steps.Root
      step={step}
      count={titles.length}
      size={{ base: "xs", md: "sm" }}
      colorPalette="blue"
    >
      <List.Root
        aria-label="Setup progress"
        listStyleType="none"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap="1"
      >
        {titles.map((title, index) => (
          <Steps.Item
            key={title}
            asChild
            index={index}
            title={title}
            gap="1"
            minW="0"
          >
            <List.Item>
              <Steps.Indicator
                boxSize={{ base: "6", md: "8" }}
                fontSize={{ base: "xs", md: "sm" }}
                borderWidth="2px"
                _icon={{ boxSize: { base: "14px", md: "16px" } }}
              />
              <Steps.Title hideBelow="lg" fontSize="xs">
                {title}
              </Steps.Title>
              <Steps.Separator h="2px" mx="1" />
            </List.Item>
          </Steps.Item>
        ))}
      </List.Root>
    </Steps.Root>
  );
}
