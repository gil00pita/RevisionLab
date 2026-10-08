import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { TestSession } from "../../test-sessions.js";

export function ParticipantEntry({
  session,
  name,
  busy,
  error,
  onName,
  onStart,
}: {
  session: TestSession;
  name: string;
  busy: boolean;
  error: string;
  onName: (name: string) => void;
  onStart: () => void;
}) {
  return (
    <Dialog.Root
      open
      closeOnEscape={false}
      closeOnInteractOutside={false}
      placement="center"
      motionPreset="none"
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner data-revisionlab-ui color="fg" colorPalette="blue">
          <Dialog.Content bg="bg.panel" color="fg" fontFamily="body" mx="4">
            <Dialog.Header>
              <Dialog.Title>{session.name}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                <Dialog.Description>
                  This test records screens, cursor movements, clicks, and
                  keyboard actions for up to {session.maxMinutes} minutes. Typed
                  characters and input fields are masked. The test organizer can
                  stop the session.
                </Dialog.Description>
                <Field.Root required>
                  <Field.Label>User Name</Field.Label>
                  <Input
                    value={name}
                    maxLength={80}
                    onChange={(event) => onName(event.target.value)}
                    autoComplete="off"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && name.trim() && !busy)
                        onStart();
                    }}
                  />
                </Field.Root>
                {error && (
                  <Text role="alert" color="red.fg">
                    {error}
                  </Text>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onStart} loading={busy} disabled={!name.trim()}>
                Start
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
