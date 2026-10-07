import { Button, Icon, Link } from "@chakra-ui/react";
import { Circle } from "lucide-react";
import { recordingLaunchHref } from "../../../client/recording-launch.js";

export function RecordFlowAction({ prototypeUrl, disabled }: {
  prototypeUrl: string;
  disabled: boolean;
}) {
  return (
    <Button asChild size="sm" minH="11" h="auto" py="2" whiteSpace="normal" colorPalette="blue" disabled={disabled}>
      <Link
        href={recordingLaunchHref(prototypeUrl)}
        aria-disabled={disabled || undefined}
        data-disabled={disabled ? "" : undefined}
        onClick={(event) => { if (disabled) event.preventDefault(); }}
      >
        <Icon aria-hidden="true"><Circle /></Icon>
        Record new flow
      </Link>
    </Button>
  );
}
