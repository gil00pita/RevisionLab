import { useEffect, useRef, useState } from "react";
import {
  Box,
  createListCollection,
  Field,
  Icon,
  Image,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { MousePointer2 } from "lucide-react";
import type {
  RevisionLabStep,
  RevisionLabTransition,
} from "../../../server/types.js";

export function RecordedClickPreview({
  source,
  transitions,
}: {
  source: RevisionLabStep;
  transitions: RevisionLabTransition[];
}) {
  const [selected, setSelected] = useState(transitions[0]?.id ?? "");
  const visit =
    transitions.find((item) => item.id === selected) ?? transitions[0];
  const interaction = visit?.interaction;
  const pointY = interaction?.point?.y;
  const viewport = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLDivElement>(null);
  const collection = createListCollection({
    items: transitions.map((item, index) => ({
      value: item.id,
      label: `Visit ${index + 1}: ${item.interaction?.target.label ?? "Page navigation"}`,
    })),
  });
  useEffect(() => {
    if (!viewport.current || !image.current || pointY === undefined) return;
    const reveal = () => {
      if (!viewport.current || !image.current) return;
      viewport.current.scrollTop =
        pointY * image.current.clientHeight - viewport.current.clientHeight / 2;
    };
    const observer = new ResizeObserver(reveal);
    observer.observe(image.current);
    reveal();
    return () => observer.disconnect();
  }, [pointY, visit?.id, source.id]);
  return (
    <Stack gap="3" minW="0" aria-label="Recorded interaction">
      {transitions.length > 1 && (
        <Field.Root>
          <Field.Label>Recorded visit</Field.Label>
          <Select.Root
            size="sm"
            collection={collection}
            value={visit ? [visit.id] : []}
            onValueChange={(event) => setSelected(event.value[0])}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger minW="0">
                <Select.ValueText truncate />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {collection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Select.ItemText overflowWrap="anywhere">
                        {item.label}
                      </Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Field.Root>
      )}
      {interaction ? (
        <>
          <Box>
            <Text fontWeight="semibold" fontSize="sm" overflowWrap="anywhere">
              {interaction.target.label}
            </Text>
            <Text fontSize="xs" color="gray.600">
              {interaction.target.tag} ·{" "}
              {interaction.activation === "keyboard"
                ? "Keyboard activation (element center)"
                : "Pointer click"}
            </Text>
          </Box>
          {source.screenshot && source.capture && (
            <Box
              ref={viewport}
              maxH="320px"
              overflowY="auto"
              borderWidth="1px"
              borderColor="gray.300"
              borderRadius="md"
              tabIndex={0}
              aria-label="Source screenshot with click location"
              focusRing="inset"
            >
              <Box
                ref={image}
                position="relative"
                w="full"
                aspectRatio={source.capture.width / source.capture.height}
              >
                <Image
                  src={source.screenshot}
                  alt={`Source screen: ${source.title}`}
                  w="full"
                  h="full"
                  draggable={false}
                />
                {interaction.bounds && (
                  <Box
                    aria-hidden="true"
                    position="absolute"
                    pointerEvents="none"
                    left={`${interaction.bounds.x * 100}%`}
                    top={`${interaction.bounds.y * 100}%`}
                    w={`${interaction.bounds.width * 100}%`}
                    h={`${interaction.bounds.height * 100}%`}
                    borderWidth="2px"
                    borderColor="pink.700"
                    bg="pink.500/10"
                  />
                )}
                {interaction.point && (
                  <Box
                    role="img"
                    aria-label={
                      interaction.activation === "keyboard"
                        ? "Activated element center"
                        : "Click position"
                    }
                    position="absolute"
                    pointerEvents="none"
                    left={`${interaction.point.x * 100}%`}
                    top={`${interaction.point.y * 100}%`}
                    transform="translate(-50%, -50%)"
                    boxSize="6"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="pink.700"
                    color="white"
                    borderWidth="1px"
                    borderColor="white"
                    borderRadius="full"
                  >
                    <Icon boxSize="4">
                      <MousePointer2 />
                    </Icon>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          {!interaction.point && (
            <Text fontSize="xs" color="gray.600">
              The click was outside the captured image.
            </Text>
          )}
        </>
      ) : (
        <Text fontSize="sm" color="gray.600">
          Click details were not recorded for this transition.
        </Text>
      )}
    </Stack>
  );
}
