import { Icon, IconButton, Menu, Portal } from "@chakra-ui/react";
import { Check, History } from "lucide-react";
import type { RevisionLabFlow } from "../../../server/types.js";

export function FlowVersionMenu({
  flow,
  versions,
  disabled,
  onSelect,
}: {
  flow: RevisionLabFlow;
  versions: RevisionLabFlow[];
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <IconButton
          size="sm"
          variant="ghost"
          flexShrink="0"
          aria-label={`Flow versions, current v${flow.version}`}
          title={`Flow versions (v${flow.version})`}
          disabled={disabled}
        >
          <Icon>
            <History />
          </Icon>
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner data-revisionlab-ui color="fg" colorPalette="blue">
          <Menu.Content
            aria-label="Flow versions"
            minW="48"
            maxH="80"
            overflowY="auto"
            colorPalette="blue"
          >
            <Menu.RadioItemGroup
              value={flow.id}
              onValueChange={(event) => onSelect(event.value)}
            >
              {versions.map((version) => (
                <Menu.RadioItem
                  key={version.id}
                  value={version.id}
                  disabled={disabled}
                >
                  <Menu.ItemText>
                    v{version.version}
                    {version.status === "recording" ? " - Recording" : ""}
                  </Menu.ItemText>
                  <Menu.ItemIndicator>
                    <Icon>
                      <Check />
                    </Icon>
                  </Menu.ItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
