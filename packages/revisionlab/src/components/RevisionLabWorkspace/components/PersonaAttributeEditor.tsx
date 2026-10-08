import { useState } from "react";
import { Button, Checkbox, Field, Flex, Input, NativeSelect, Stack, Text, Textarea } from "@chakra-ui/react";
import type { PersonaField, PersonaValue } from "../../../persona-profile.js";
import type { PersonaProfileAction } from "./PersonaProfileEditor.js";

function initialText(value?: PersonaValue) {
  if (Array.isArray(value?.value)) return value.value.join(", ");
  return value?.value == null ? "" : String(value.value);
}

export function PersonaAttributeEditor({ field, value, busy, onSave, onCancel, onUploadFile }: {
  field: PersonaField;
  value?: PersonaValue;
  busy: boolean;
  onSave: (action: PersonaProfileAction) => Promise<void>;
  onCancel: () => void;
  onUploadFile?: (file: File) => Promise<string>;
}) {
  const [text, setText] = useState(initialText(value) || (field.validation.defaultValue == null ? "" : String(field.validation.defaultValue)));
  const [checked, setChecked] = useState(value?.value === true || (!value && field.validation.defaultValue === true));
  const [choices, setChoices] = useState<string[]>(Array.isArray(value?.value) ? value.value.map(String) : Array.isArray(field.validation.defaultValue) ? field.validation.defaultValue.map(String) : []);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const multi = field.type === "multi-select" || field.type === "tags";
  async function submit() {
    let next: unknown = text.trim();
    if (field.type === "boolean") next = checked;
    else if (field.type === "number" || field.type === "rating") next = Number(text);
    else if (field.type === "multi-select") next = field.options.length ? choices : text.split(",").map((item) => item.trim()).filter(Boolean);
    else if (field.type === "tags") next = text.split(",").map((item) => item.trim()).filter(Boolean);
    if (field.required && (next === "" || (Array.isArray(next) && !next.length))) { setError("Enter a value for this required field."); return; }
    try {
      await onSave({ action: value ? "value.update" : "value.add", id: value?.id, fieldId: field.id, value: next, position: value?.position ?? 0 });
      onCancel();
    } catch { setError("Could not save this value. Review the message above."); }
  }
  return (
    <Stack gap="3" p="4" borderWidth="1px" borderColor="border" rounded="md" bg="bg.subtle">
      <Field.Root required={field.required} disabled={busy}>
        <Field.Label>{field.name}{field.required && <Field.RequiredIndicator />}</Field.Label>
        {field.type === "boolean" ? (
          <Checkbox.Root checked={checked} onCheckedChange={(event) => setChecked(event.checked === true)}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>Yes</Checkbox.Label></Checkbox.Root>
        ) : field.type === "single-select" || field.type === "rating" ? (
          <NativeSelect.Root><NativeSelect.Field value={text} onChange={(event) => setText(event.target.value)}>
            <option value="">Select an option</option>
            {(field.type === "rating" ? ["1", "2", "3", "4", "5"] : field.options).map((option) => <option key={option} value={option}>{option}</option>)}
          </NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root>
        ) : field.type === "multi-select" && field.options.length ? (
          <Stack gap="2">{field.options.map((option) => <Checkbox.Root key={option} checked={choices.includes(option)} onCheckedChange={(event) => setChoices((previous) => event.checked === true ? [...previous, option] : previous.filter((item) => item !== option))}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>{option}</Checkbox.Label></Checkbox.Root>)}</Stack>
        ) : field.type === "file" && onUploadFile ? (
          <Stack gap="2"><Input type="file" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) { setUploading(true); void onUploadFile(file).then(setText).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not upload the file.")).finally(() => setUploading(false)); } }} /><Text fontSize="sm" color="fg.muted">{uploading ? "Uploading file…" : text ? "File ready to save." : "Choose a file up to 3 MB."}</Text></Stack>
        ) : field.type === "file" ? (
          <Text color="fg.muted" fontSize="sm">Upload files after creating a persona from this template.</Text>
        ) : field.type === "long-text" ? (
          <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={field.placeholder} maxLength={typeof field.validation.maxLength === "number" ? field.validation.maxLength : 5000} rows={4} />
        ) : (
          <Input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"} value={text} onChange={(event) => setText(event.target.value)} placeholder={multi ? "Separate values with commas" : field.placeholder} maxLength={typeof field.validation.maxLength === "number" ? field.validation.maxLength : 5000} />
        )}
        {field.type === "file" && !onUploadFile && <Field.HelperText>Files are added on the persona profile.</Field.HelperText>}
      </Field.Root>
      {error && <Text role="alert" color="red.fg" fontSize="sm">{error}</Text>}
      <Flex gap="2"><Button size="sm" colorPalette="blue" loading={busy || uploading} disabled={uploading || (field.type === "file" && !onUploadFile)} onClick={() => void submit()}>Save</Button><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button></Flex>
    </Stack>
  );
}
