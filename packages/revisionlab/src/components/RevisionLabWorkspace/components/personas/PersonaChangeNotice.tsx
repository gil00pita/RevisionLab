import { Button, Flex, Text } from "@chakra-ui/react";
export function PersonaChangeNotice({
  notice,
  canUndo,
  disabled,
  onUndo,
}: {
  notice: string;
  canUndo: boolean;
  disabled: boolean;
  onUndo: () => void;
}) {
  if (!notice && !canUndo) return null;
  return (
    <Flex
      gap="3"
      align="center"
      flexWrap="wrap"
      bg="bg.panel"
      p="3"
      rounded="lg"
      borderWidth="1px"
      borderColor="border"
    >
      <Text role="status" fontSize="sm">
        {notice || "Persona archived."}
      </Text>
      {canUndo && (
        <Button
          size="sm"
          variant="ghost"
          colorPalette="blue"
          disabled={disabled}
          onClick={onUndo}
        >
          Undo archive
        </Button>
      )}
    </Flex>
  );
}
