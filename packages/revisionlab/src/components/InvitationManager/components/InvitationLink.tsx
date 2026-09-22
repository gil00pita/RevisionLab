import {
  Button,
  Clipboard,
  HStack,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Check, Copy } from "lucide-react";

export function InvitationLink({ value }: { value: string }) {
  return (
    <Clipboard.Root value={value}>
      <Stack gap="2">
        <Clipboard.Label fontWeight="medium" fontSize="sm">
          Invitation link
        </Clipboard.Label>
        <HStack
          gap="2"
          align="stretch"
          flexWrap={{ base: "wrap", sm: "nowrap" }}
        >
          <Clipboard.Input asChild>
            <Input
              readOnly
              minW="0"
              flex="1"
              onFocus={(event) => event.target.select()}
            />
          </Clipboard.Input>
          <Clipboard.Trigger asChild>
            <Button variant="outline">
              <Clipboard.Context>
                {(clipboard) => (
                  <>
                    <Icon size="sm">
                      {clipboard.copied ? <Check /> : <Copy />}
                    </Icon>
                    {clipboard.copied ? "Copied" : "Copy link"}
                  </>
                )}
              </Clipboard.Context>
            </Button>
          </Clipboard.Trigger>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          Copy this link now. You can create another invitation if you lose it.
        </Text>
      </Stack>
    </Clipboard.Root>
  );
}
