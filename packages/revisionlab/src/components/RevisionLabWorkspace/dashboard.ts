import type { WorkspaceState } from "../../workspace-instances.js";

export function dashboardStatistics(data: WorkspaceState) {
  const sources = data.workspaces.filter(
    (source) => data.selection === "all" || source.id === data.selection,
  );
  const threads = data.comments.filter((comment) => !comment.parentId);
  const screens = data.flows.flatMap((flow) => flow.steps);
  const checked = screens.filter(
    (screen) =>
      screen.capture?.accessibility &&
      screen.capture.accessibility.status !== "unavailable",
  );
  const summariesAvailable =
    sources.length > 0 && sources.every((source) => source.dashboard);
  const missingSource = sources.some(
    (source) => source.status === "unavailable" && !source.lastLoadedAt,
  );
  return {
    sources,
    accessibilityIssues: missingSource
      ? null
      : checked.reduce(
          (total, screen) =>
            total + screen.capture!.accessibility!.violationCount,
          0,
        ),
    uncheckedScreens: screens.length - checked.length,
    comments: missingSource ? null : threads.length,
    resolvedComments: missingSource
      ? null
      : threads.filter((comment) => comment.status === "resolved").length,
    flows: missingSource
      ? null
      : new Set(data.flows.map((flow) => flow.familyId)).size,
    testSessions: summariesAvailable
      ? sources.reduce(
          (total, source) => total + source.dashboard!.testSessions,
          0,
        )
      : null,
    ticketsCreated: summariesAvailable
      ? sources.reduce(
          (total, source) => total + source.dashboard!.ticketsCreated,
          0,
        )
      : null,
    personas: missingSource
      ? null
      : data.personas.filter((persona) => !persona.archivedAt).length,
    liveUrls: new Set(sources.map((source) => source.url)).size,
  };
}

export function relativeSyncTime(syncedAt: number | null, now: number): string {
  if (syncedAt === null) return "Not synced yet";
  const seconds = Math.max(0, Math.floor((now - syncedAt) / 1000));
  if (seconds === 0) return "Just now";
  const units = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ] as const;
  const [unit, size] = units.find(([, size]) => seconds >= size)!;
  return new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(
    -Math.floor(seconds / size),
    unit,
  );
}
