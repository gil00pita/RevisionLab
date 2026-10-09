import { forwardRef } from "react";
import { Textarea, type TextareaProps } from "@chakra-ui/react";

export const ControlledCommentTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps & { value: string }
>(function ControlledCommentTextarea(props, ref) {
  // Combobox.Input injects defaultValue through asChild even when its inputValue
  // is controlled. Keep the comment draft as the textarea's only value source.
  const controlledProps = { ...props };
  delete controlledProps.defaultValue;
  return <Textarea {...controlledProps} ref={ref} />;
});
