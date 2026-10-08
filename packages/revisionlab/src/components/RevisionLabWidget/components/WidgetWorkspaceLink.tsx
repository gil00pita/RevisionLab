import { Icon, IconButton } from "@chakra-ui/react";
import NextLink from "next/link";
import { PanelsTopLeft } from "lucide-react";
import { ToolHint } from "./ToolHint.js";

export function WidgetWorkspaceLink({ href }: { href: string }) {
  return (
    <ToolHint label="Open review workspace">
      <IconButton
        asChild
        aria-label="Open review workspace"
        variant="plain"
        color="colorPalette.contrast"
        size="sm"
        boxSize="9"
        minW="9"
        borderRadius="full"
        focusRing="inset"
        _hover={{ bg: "fg/12" }}
      >
        <NextLink href={href} prefetch={false}>
          <Icon boxSize="5">
            <PanelsTopLeft />
          </Icon>
        </NextLink>
      </IconButton>
    </ToolHint>
  );
}
