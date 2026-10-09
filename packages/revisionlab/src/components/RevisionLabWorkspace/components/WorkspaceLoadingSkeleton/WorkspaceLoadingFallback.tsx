"use client";

import { useSyncExternalStore } from "react";
import { getWorkspaceSkeletonPage } from "../../../../workspace-view.js";
import { WorkspaceLoadingSkeleton } from "./WorkspaceLoadingSkeleton.js";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function currentSearch() {
  return window.location.search;
}

export function WorkspaceLoadingFallback({
  initialSearch = "",
}: {
  initialSearch?: string;
}) {
  const search = useSyncExternalStore(
    subscribe,
    currentSearch,
    () => initialSearch,
  );
  return (
    <WorkspaceLoadingSkeleton
      page={getWorkspaceSkeletonPage(new URLSearchParams(search))}
    />
  );
}
