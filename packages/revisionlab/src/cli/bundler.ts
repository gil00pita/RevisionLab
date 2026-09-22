import ts from "typescript";

interface PackageManifest {
  scripts?: Record<string, unknown>;
}

/** Change only direct Next commands; shell wrappers and unrelated scripts stay host-owned. */
export function configureBundler(source: string, nextMajor: number) {
  const manifest = JSON.parse(source) as PackageManifest;
  const updates = new Map<string, string>();
  const warnings: string[] = [];
  const instruction =
    nextMajor >= 16
      ? "use next dev --webpack and next build --webpack"
      : "remove --turbo/--turbopack from Next.js commands (Webpack is the Next.js 15 default)";
  for (const [name, value] of Object.entries(manifest.scripts ?? {})) {
    if (typeof value !== "string") continue;
    const conventional = /^next\s+(dev|build)(?:\s+[\w./:=,+@-]+)*\s*$/.test(
      value.trim(),
    );
    const tokens = value.trim().split(/\s+/);
    if (!conventional || tokens.includes("--")) {
      if (
        name === "dev" ||
        name === "build" ||
        /\bnext\s+(dev|build)\b/.test(value)
      ) {
        warnings.push(
          `Kept custom script "${name}" unchanged. To avoid Chakra/Emotion hydration errors, ${instruction} inside your existing command.`,
        );
      }
      continue;
    }
    const withoutBundler = tokens.filter(
      (token) => !["--turbo", "--turbopack", "--webpack"].includes(token),
    );
    const updated = [
      ...withoutBundler,
      ...(nextMajor >= 16 ? ["--webpack"] : []),
    ].join(" ");
    if (
      updated !== value &&
      (nextMajor >= 16 || tokens.length !== withoutBundler.length)
    )
      updates.set(name, updated);
  }
  if (!manifest.scripts?.dev || !manifest.scripts?.build) {
    warnings.push(
      `No standard dev/build script pair was found. For Chakra/Emotion compatibility, ${instruction}.`,
    );
  }
  if (!updates.size)
    return { content: source, warnings, updatedScripts: [] as string[] };

  // Preserve the manifest's formatting, field order, and unrelated values.
  const file = ts.parseJsonText("package.json", source);
  const replacements: { start: number; end: number; value: string }[] = [];
  const statement = file.statements[0];
  if (
    statement &&
    ts.isExpressionStatement(statement) &&
    ts.isObjectLiteralExpression(statement.expression)
  ) {
    for (const node of statement.expression.properties) {
      if (
        !ts.isPropertyAssignment(node) ||
        !ts.isStringLiteral(node.name) ||
        node.name.text !== "scripts" ||
        !ts.isObjectLiteralExpression(node.initializer)
      )
        continue;
      for (const property of node.initializer.properties) {
        if (
          !ts.isPropertyAssignment(property) ||
          !ts.isStringLiteral(property.name)
        )
          continue;
        const updated = updates.get(property.name.text);
        if (updated !== undefined)
          replacements.push({
            start: property.initializer.getStart(file),
            end: property.initializer.end,
            value: JSON.stringify(updated),
          });
      }
    }
  }
  let content = source;
  for (const replacement of replacements.sort(
    (left, right) => right.start - left.start,
  )) {
    content =
      content.slice(0, replacement.start) +
      replacement.value +
      content.slice(replacement.end);
  }
  return { content, warnings, updatedScripts: [...updates.keys()] };
}
