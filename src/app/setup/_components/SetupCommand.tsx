import { Code } from "@chakra-ui/react";

export function SetupCommand({ children }: { children: string }) {
  return (
    <Code
      display="block"
      whiteSpace="pre-wrap"
      overflowWrap="anywhere"
      p="4"
      bg="gray.900"
      color="gray.100"
    >
      {children}
    </Code>
  );
}
