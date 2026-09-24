import { Button, Dialog, Flex, Icon, IconButton } from "@chakra-ui/react";
import { Camera, Circle, MessageSquare } from "lucide-react";

export function WidgetLauncher({
  recording,
  count,
  canRecord,
  onRecord,
}: {
  recording: boolean;
  count: number;
  canRecord: boolean;
  onRecord: () => void;
}) {
  return (
    <Flex
      position="fixed"
      bottom="6"
      right="6"
      zIndex="docked"
      gap="2"
      align="center"
    >
      {canRecord && !recording && (
        <IconButton
          aria-label="Record prototype"
          title="Record prototype"
          size="lg"
          borderRadius="full"
          colorPalette="red"
          bg="white"
          color="red.600"
          borderWidth="1px"
          borderColor="red.200"
          shadow="lg"
          onClick={onRecord}
          _hover={{ bg: "red.50" }}
        >
          <Icon fill="red.600">
            <Circle />
          </Icon>
        </IconButton>
      )}
      <Dialog.Trigger asChild>
        <Button
          colorPalette="blue"
          size="lg"
          borderRadius="full"
          shadow="lg"
          aria-label={
            recording ? "Open RevisionLab recording" : "Open RevisionLab"
          }
        >
          <Icon>{recording ? <Camera /> : <MessageSquare />}</Icon>
          {recording ? `Recording · ${count}` : "Review"}
        </Button>
      </Dialog.Trigger>
    </Flex>
  );
}
