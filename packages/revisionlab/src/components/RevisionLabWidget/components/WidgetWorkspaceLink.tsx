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
        color="white"
        size="sm"
        boxSize="9"
        minW="9"
        borderRadius="full"
        focusRing="inset"
        _hover={{ bg: "blackAlpha.200" }}
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
