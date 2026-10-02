import { Heading, Stack, Table, Text } from "@chakra-ui/react";
import type { TestScreen, sessionMetrics } from "../../../test-sessions.js";

export function ScreenMetrics({
  screens,
  metrics,
}: {
  screens: TestScreen[];
  metrics: ReturnType<typeof sessionMetrics>;
}) {
  return (
    <Stack gap="3">
      <Heading as="h3" size="md">
        Per-screen activity
      </Heading>
      <Table.ScrollArea>
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Screen</Table.ColumnHeader>
              <Table.ColumnHeader>Time</Table.ColumnHeader>
              <Table.ColumnHeader>Clicks</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {[...metrics.screens]
              .filter(([, value]) => value.duration > 0 || value.clicks > 0)
              .map(([id, value]) => (
                <Table.Row key={id}>
                  <Table.Cell>
                    {screens.find((screen) => screen.id === id)?.title ??
                      "Before capture"}
                    <Text color="gray.600" fontSize="xs">
                      {value.route}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{(value.duration / 1000).toFixed(1)}s</Table.Cell>
                  <Table.Cell>{value.clicks}</Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  );
}
