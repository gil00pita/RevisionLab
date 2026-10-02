export const wcagVersions = ["2.0", "2.1", "2.2"] as const;
export const wcagLevels = ["A", "AA", "AAA"] as const;

export interface WcagSettings {
  wcagVersion: (typeof wcagVersions)[number];
  wcagLevel: (typeof wcagLevels)[number];
}

export const defaultWcagSettings: WcagSettings = {
  wcagVersion: "2.2",
  wcagLevel: "AA",
};

export function wcagLabel(settings: WcagSettings) {
  return `WCAG ${settings.wcagVersion} ${settings.wcagLevel}`;
}

export function wcagTags({ wcagVersion, wcagLevel }: WcagSettings): string[] {
  const tags = ["wcag2a"];
  if (wcagLevel !== "A") tags.push("wcag2aa");
  if (wcagLevel === "AAA") tags.push("wcag2aaa");
  if (wcagVersion !== "2.0") {
    tags.push("wcag21a");
    if (wcagLevel !== "A") tags.push("wcag21aa");
  }
  if (wcagVersion === "2.2" && wcagLevel !== "A") tags.push("wcag22aa");
  // Only tags supported by bundled axe; obsolete parsing rules stay excluded.
  return tags;
}
