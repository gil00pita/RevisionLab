import { Field, Flex, Input } from "@chakra-ui/react";
import type { RevisionLabPoint } from "../../../server/types.js";

export function PinLocationFields({
  point,
  onChange,
  disabled,
}: {
  point: RevisionLabPoint;
  onChange: (point: RevisionLabPoint) => void;
  disabled: boolean;
}) {
  return (
    <Flex gap="3">
      {(["x", "y"] as const).map((axis) => (
        <Field.Root key={axis}>
          <Field.Label>
            {axis === "x" ? "Horizontal (%)" : "Vertical (%)"}
          </Field.Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            size="sm"
            value={Math.round(point[axis] * 10000) / 100}
            disabled={disabled}
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              if (Number.isFinite(value))
                onChange({
                  ...point,
                  [axis]: Math.max(0, Math.min(100, value)) / 100,
                });
            }}
          />
        </Field.Root>
      ))}
    </Flex>
  );
}
