import { useState } from "react";
import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import type { PersonaProfileAction } from "./PersonaProfileEditor.js";

export function PersonaProfileTemplateReset({ busy, onSave }: {
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  return <Stack gap="3" p="5" borderWidth="1px" borderColor="border" rounded="lg" bg="bg.panel">
    <Text fontWeight="semibold">Reapply template</Text>
    <Text color="fg.muted" fontSize="sm">Update this persona from its saved template. Current attributes are removed from the visible profile; their history and evidence links remain available. Research status and credentials stay as they are.</Text>
    {confirming ? <Flex gap="2" flexWrap="wrap"><Button size="sm" colorPalette="orange" loading={busy} onClick={() => void onSave({ action: "template.reset" }).then(() => setConfirming(false)).catch(() => undefined)}>Reapply template suggestions</Button><Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button></Flex> : <Button size="sm" variant="outline" alignSelf="start" onClick={() => setConfirming(true)}>Reapply template…</Button>}
  </Stack>;
}
