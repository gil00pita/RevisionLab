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
      bg={active ? "whiteAlpha.200" : "transparent"}
      color="white"
      _hover={{ bg: "whiteAlpha.300" }}
      aria-current={active ? "page" : undefined}
      fontWeight={active ? "semibold" : "normal"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
