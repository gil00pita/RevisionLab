import { Button } from "@chakra-ui/react";
import type { ReactNode, RefObject } from "react";

export function WorkspaceNavigationButton({
  active,
  onClick,
  children,
  buttonRef,
  disabled,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Button
      ref={buttonRef}
      disabled={disabled}
      variant="ghost"
      justifyContent="flex-start"
      minH={{ base: "11", lg: "10" }}
      bg={active ? "blue.subtle" : "transparent"}
      color={active ? "blue.fg" : "fg"}
      _hover={{ bg: active ? "blue.muted" : "blue.subtle" }}
      focusRing="inside"
      focusRingColor="blue.focusRing"
      aria-current={active ? "page" : undefined}
      fontWeight={active ? "semibold" : "normal"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
