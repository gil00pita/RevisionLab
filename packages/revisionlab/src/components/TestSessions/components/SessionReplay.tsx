import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { ScreenMetrics } from "./ScreenMetrics.js";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Image,
  Input,
  NativeSelect,
  Stack,
  Slider,
  Text,
} from "@chakra-ui/react";
import {
  sessionMetrics,
  timelineEvents,
  type TestDetail,
} from "../../../test-sessions.js";

function seconds(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}
export function SessionReplay({ detail }: { detail: TestDetail }) {
  const { session, events, screens } = detail;
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const metrics = useMemo(
    () => sessionMetrics(session, events),
    [session, events],
  );
  const ordered = useMemo(() => timelineEvents(events), [events]);
  const visible = ordered.filter((event) => event.t <= time).reverse();
  const screenEvent = visible.find((event) => event.type === "screen");
  const screen = screens.find((item) => item.id === screenEvent?.screenId);
  const cursor = visible.find(
    (event) =>
      (event.type === "move" || event.type === "click") &&
      event.screenId === screen?.id,
  );
  const key = visible.find(
    (event) => event.type === "key" && time - event.t < 1200,
  );
  const clicked = cursor?.type === "click" && time - cursor.t < 500;
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      setTime((value) => Math.min(metrics.duration, value + delta * speed));
    }, 40);
    return () => clearInterval(timer);
  }, [playing, speed, metrics.duration]);
  if (time >= metrics.duration && playing) setPlaying(false);
  return (
    <Stack gap="4">
      <Flex gap="6" flexWrap="wrap">
        <Text>
          <Text as="strong">{seconds(metrics.duration)}</Text> total time
        </Text>
        <Text>
          <Text as="strong">{metrics.clicks}</Text> total clicks
        </Text>
        <Text>{screens.length} saved screens</Text>
      </Flex>
      <Heading as="h3" size="md">
        Session replay
      </Heading>
      <Text fontSize="sm" color="fg.muted">
        Saved screen snapshots with timed input activity. Text entry is masked;
        intermediate animations and cross-origin content are not replayed.
      </Text>
      <Flex gap="3" align="end" flexWrap="wrap">
        <Button
          disabled={!events.length}
          onClick={() => {
            if (time >= metrics.duration) setTime(0);
            setPlaying((value) => !value);
          }}
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setTime(0);
            setPlaying(false);
          }}
        >
          Restart
        </Button>
        <Field.Root w="32">
          <Field.Label>Replay speed</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            >
              {[0.5, 1, 1.5, 2].map((value) => (
                <option value={value} key={value}>
                  {value}×
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Text>
          {seconds(time)} / {seconds(metrics.duration)}
        </Text>
      </Flex>
      <Slider.Root
        min={0}
        max={Math.max(1, metrics.duration)}
        step={100}
        value={[time]}
        onValueChange={(event) => {
          setPlaying(false);
          setTime(event.value[0]);
        }}
      >
        <Slider.Label>Replay timeline</Slider.Label>
        <Slider.Control>
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumb index={0} aria-label="Replay timeline">
            <Slider.HiddenInput />
          </Slider.Thumb>
        </Slider.Control>
      </Slider.Root>
      <Field.Root>
        <Field.Label>Replay position (seconds)</Field.Label>
        <Input
          type="number"
          min="0"
          max={metrics.duration / 1000}
          step="0.1"
          value={Number((time / 1000).toFixed(1))}
          onChange={(event) => {
            setPlaying(false);
            setTime(
              Math.max(
                0,
                Math.min(metrics.duration, Number(event.target.value) * 1000),
              ),
            );
          }}
        />
      </Field.Root>
      <Box
        borderWidth="1px"
        borderColor="border"
        bg="bg.subtle"
        borderRadius="lg"
        overflow="hidden"
      >
        <Box p="3" borderBottomWidth="1px" borderColor="border">
          <Text fontSize="sm">
            {screen?.title ?? "Waiting for the first captured screen"}{" "}
            {screen?.route}
          </Text>
          {key && <Text fontSize="sm">Key: {key.key}</Text>}
        </Box>
        {screen?.screenshot ? (
          <Box position="relative" w="full">
            <Image
              src={screen.screenshot}
              alt={`Recorded screen: ${screen.title}`}
              w="full"
            />
            {cursor?.x != null && cursor.y != null && (
              <Box
                position="absolute"
                left={`${cursor.x * 100}%`}
                top={`${cursor.y * 100}%`}
                transform="translate(-50%, -50%)"
                w={clicked ? "6" : "3"}
                h={clicked ? "6" : "3"}
                borderRadius="full"
                bg={clicked ? "orange.solid" : "blue.solid"}
                borderWidth="2px"
                borderColor="bg.panel"
                pointerEvents="none"
                aria-label={clicked ? "Recorded click" : "Recorded cursor"}
              />
            )}
          </Box>
        ) : (
          <IllustratedEmptyState illustration="images" description="No screenshot at this point in the recording." />
        )}
      </Box>
      <ScreenMetrics screens={screens} metrics={metrics} />
    </Stack>
  );
}
