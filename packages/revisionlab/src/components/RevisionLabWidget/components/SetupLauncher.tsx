import NextLink from "next/link";
import { useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Link,
  Popover,
  Portal,
} from "@chakra-ui/react";

export function SetupLauncher({
  basePath,
  owner,
}: {
  basePath: string;
  owner: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Box
      data-revisionlab-ui
      position="fixed"
      bottom="6"
      right="6"
      zIndex="popover"
    >
      <Popover.Root
        open={open}
        onOpenChange={(event) => setOpen(event.open)}
        autoFocus={false}
        positioning={{ placement: "top-end", gutter: 12 }}
      >
        <Popover.Trigger asChild>
          <Button colorPalette="blue" borderRadius="full" size="lg">
            Setup
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner data-revisionlab-ui color="fg" colorPalette="blue">
            <Popover.Content
              maxW="calc(100vw - 2rem)"
              bg="bg.panel"
              color="fg"
              shadow="lg"
              borderRadius="lg"
            >
              <Popover.Arrow />
              <Popover.Header pr="10">
                <Popover.Title>Let’s set up RevisionLab</Popover.Title>
              </Popover.Header>
              <Popover.Body>
                <Popover.Description>
                  {owner
                    ? "Add your details, then choose how you want to review your prototype."
                    : "Your workspace owner needs to finish setup before reviewing can begin."}
                </Popover.Description>
              </Popover.Body>
              {owner && (
                <Popover.Footer>
                  <Button asChild colorPalette="blue" w="full">
                    <Link asChild>
                      <NextLink
                        href={`${basePath}?view=setup`}
                        prefetch={false}
                      >
                        Start setup
                      </NextLink>
                    </Link>
                  </Button>
                </Popover.Footer>
              )}
              <Popover.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  position="absolute"
                  top="1"
                  right="1"
                  aria-label="Close setup introduction"
                />
              </Popover.CloseTrigger>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Box>
  );
}
