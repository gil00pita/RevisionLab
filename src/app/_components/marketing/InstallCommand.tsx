"use client";

import { useState } from "react";
import { Box, Code, Flex, Icon, IconButton, Text } from "@chakra-ui/react";
import { Check, Copy, Terminal } from "lucide-react";

export function InstallCommand({ dark = true }: { dark?: boolean }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText("npx revisionlab@latest init");
      setMessage("Installation command copied.");
    } catch {
      setMessage("Copy unavailable. Select the command and copy it manually.");
    }
  }
  return (
    <Box maxW="full">
      <Flex
        align="center"
        gap="3"
        borderWidth="1px"
        borderColor={dark ? "gray.700" : "gray.300"}
        bg={dark ? "gray.900" : "white"}
        borderRadius="md"
        ps="4"
        pe="1"
        w="fit-content"
        maxW="full"
      >
        <Icon color={dark ? "gray.500" : "gray.600"} flexShrink="0" size="sm">
          <Terminal />
        </Icon>
        <Code
          bg="transparent"
          color={dark ? "gray.200" : "gray.800"}
          p="0"
          fontSize={{ base: "11px", sm: "13px" }}
          whiteSpace="nowrap"
          userSelect="all"
        >
          npx revisionlab@latest init
        </Code>
        <IconButton
          variant="ghost"
          color={dark ? "gray.400" : "gray.600"}
          minW="44px"
          minH="44px"
          aria-label="Copy installation command"
          onClick={copy}
          _hover={{ bg: dark ? "gray.800" : "gray.100" }}
        >
          <Icon size="sm">
            {message === "Installation command copied." ? <Check /> : <Copy />}
          </Icon>
        </IconButton>
      </Flex>
      <Text
        role="status"
        fontSize="xs"
        color={dark ? "gray.300" : "gray.600"}
        mt={message ? "2" : "0"}
      >
        {message}
      </Text>
    </Box>
  );
}
