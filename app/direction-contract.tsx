"use client";

import { useEffect } from "react";

export function DirectionContract({ contract }: { contract: string }) {
  useEffect(() => {
    const existing = Array.from(document.body.childNodes).find(
      (node) => node.nodeType === Node.COMMENT_NODE && node.nodeValue?.includes("b4ea4c39"),
    );
    if (!existing) document.body.insertBefore(document.createComment(contract), document.body.firstChild);
  }, [contract]);

  return null;
}
