import { useId } from "react";
import { Box, Collapsible, IconButton, Image, Spinner } from "@chakra-ui/react";
import type { PageAccessibility } from "../hooks/usePageAccessibility.js";

const markUrl = new URL("../../../../assets/widget-mark.svg", import.meta.url)
  .href;
const issuesUrl = new URL(
  "../../../../assets/accessibility-issues.svg",
  import.meta.url,
).href;

export function WidgetToggle({
  expanded,
  accessibility,
}: {
  expanded: boolean;
  accessibility: PageAccessibility;
}) {
  const statusId = useId();
  const checking = accessibility.status === "checking";
  const showBadge =
    !expanded && (checking || accessibility.status === "issues");
  const status = checking
    ? "Accessibility: checking this page"
    : "Accessibility: issues found";
  const label = expanded
    ? "Collapse RevisionLab widget"
    : "Expand RevisionLab widget";
  return (
    <Collapsible.Trigger asChild>
      <IconButton
        data-widget-toggle
        aria-label={label}
        title={label}
        aria-describedby={showBadge ? statusId : undefined}
        variant="plain"
        color="white"
        size="sm"
        boxSize="9"
        minW="9"
        position="relative"
        flexShrink="0"
        borderRadius="full"
        _hover={{ bg: "blackAlpha.200" }}
        focusRing="inset"
      >
        <Image src={markUrl} alt="" w="16px" h="18px" flexShrink="0" />
        {showBadge && (
          <Box
            as="span"
            id={statusId}
            role="status"
            aria-label={status}
            title={status}
            position="absolute"
            top="-2"
            right="0"
            boxSize="5"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="full"
            bg={checking ? "white" : "blue.700"}
            color="blue.700"
            shadow="sm"
            pointerEvents="none"
          >
            {checking ? (
              <Spinner
                aria-hidden
                size="xs"
                _motionReduce={{ animation: "none" }}
              />
            ) : (
              <Image src={issuesUrl} alt="" w="20px" h="20px" />
            )}
          </Box>
        )}
      </IconButton>
    </Collapsible.Trigger>
  );
}
