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
      bg={active ? "blue.100" : "transparent"}
      color={active ? "blue.800" : "gray.800"}
      _hover={{ bg: active ? "blue.200" : "gray.200" }}
      focusRing="inside"
      focusRingColor="blue.700"
      aria-current={active ? "page" : undefined}
      fontWeight={active ? "semibold" : "normal"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
