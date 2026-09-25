import { Portal, Tooltip } from "@chakra-ui/react";
import type { ReactElement } from "react";

export function ToolHint({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <Tooltip.Root openDelay={300} positioning={{ placement: "top" }}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner data-revisionlab-ui>
          <Tooltip.Content>
            {label}
            <Tooltip.Arrow>
              <Tooltip.ArrowTip />
            </Tooltip.Arrow>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
