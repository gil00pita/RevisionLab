import { useEffect, useRef, useState } from "react";
import {
  MAX_COMMENT_FILES,
  MAX_COMMENT_FILE_BYTES,
  MAX_COMMENT_TOTAL_BYTES,
} from "../../../comment-rich.js";
export interface DraftFile {
  file: File;
  data?: string;
  error?: string;
}
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(
        new Error(`Could not read ${file.name}. Remove it and try again.`),
      );
    reader.readAsDataURL(file);
  });
}

export function useCommentFiles(setError: (error: string | null) => void) {
  const [files, updateFiles] = useState<DraftFile[]>([]);
  const currentFiles = useRef<DraftFile[]>([]);
  useEffect(
    () => () => {
      currentFiles.current = [];
    },
    [],
  );
  function setFiles(selected: File[]) {
    if (
      selected.length === currentFiles.current.length &&
      selected.every((file, index) => file === currentFiles.current[index].file)
    )
      return;
    if (
      selected.length > MAX_COMMENT_FILES ||
      selected.some((file) => file.size > MAX_COMMENT_FILE_BYTES) ||
      selected.reduce((sum, file) => sum + file.size, 0) >
        MAX_COMMENT_TOTAL_BYTES
    ) {
      setError("Attach up to 5 files, 3 MB each and 10 MB combined.");
      return;
    }
    if (
      selected.some(
        (file) =>
          !file.size ||
          file.name.length > 180 ||
          /[\/\\\x00-\x1f\x7f]/.test(file.name),
      )
    ) {
      setError(
        "Use non-empty files with a filename of up to 180 characters, without slashes or control characters.",
      );
      return;
    }
    const next = selected.map(
      (file) =>
        currentFiles.current.find((record) => record.file === file) ?? { file },
    );
    currentFiles.current = next;
    updateFiles(next);
    setError(null);
    for (const record of next) {
      if (record.data || record.error || files.includes(record)) continue;
      void readFile(record.file)
        .then((data) => {
          if (!currentFiles.current.includes(record)) return;
          record.data = data;
          updateFiles([...currentFiles.current]);
        })
        .catch((cause) => {
          if (!currentFiles.current.includes(record)) return;
          record.error =
            cause instanceof Error
              ? cause.message
              : "Could not read this file.";
          setError(record.error);
          updateFiles([...currentFiles.current]);
        });
    }
  }

  function resetFiles() {
    currentFiles.current = [];
    updateFiles([]);
  }
  return {
    files,
    setFiles,
    resetFiles,
    preparing: files.some((record) => !record.data),
  };
}
