import ts from "typescript";

/** Inspect JSX with the compiler, but preserve all host formatting and providers. */
export function mountWidget(source: string, filename: string): string {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const diagnostics = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.Latest,
    },
    reportDiagnostics: true,
  }).diagnostics;
  if (
    diagnostics?.some(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    )
  ) {
    throw new Error(
      `Cannot parse ${filename}. Fix the layout's syntax before running init.`,
    );
  }

  const bodies: ts.JsxElement[] = [];
  const identifiers = new Set<string>();
  let widgetName: string | undefined;
  let mounted = false;
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "revisionlab"
    )
      continue;
    if (statement.importClause?.isTypeOnly) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      widgetName = bindings.elements.find(
        (binding) =>
          !binding.isTypeOnly &&
          (binding.propertyName?.text ?? binding.name.text) ===
            "RevisionLabWidget",
      )?.name.text;
    }
  }
  function visit(node: ts.Node) {
    if (ts.isIdentifier(node)) identifiers.add(node.text);
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(file) === "body"
    )
      bodies.push(node);
    if (
      widgetName &&
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      node.tagName.getText(file) === widgetName
    )
      mounted = true;
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (mounted) return source;
  if (bodies.length !== 1) {
    throw new Error(
      `Cannot safely mount the widget in ${filename}: expected one native <body>. ` +
        "Add <RevisionLabWidget /> from revisionlab inside your root body, then run init again.",
    );
  }

  const needsImport = !widgetName;
  widgetName ??= "RevisionLabEmbeddedWidget";
  if (needsImport) {
    let suffix = 2;
    while (identifiers.has(widgetName))
      widgetName = `RevisionLabEmbeddedWidget${suffix++}`;
  }
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const closingPosition = bodies[0].closingElement.getStart(file);
  const lineStart = source.lastIndexOf("\n", closingPosition - 1) + 1;
  const indentation = source.slice(lineStart, closingPosition);
  const insertion = /^\s*$/.test(indentation)
    ? `<${widgetName} />${eol}${indentation}`
    : `<${widgetName} />`;
  let updated =
    source.slice(0, closingPosition) +
    insertion +
    source.slice(closingPosition);
  if (needsImport) {
    // Keep directives such as "use client" at the start of the module.
    let importPosition = source.startsWith("#!") ? source.indexOf("\n") + 1 : 0;
    for (const statement of file.statements) {
      if (
        ts.isImportDeclaration(statement) ||
        (ts.isExpressionStatement(statement) &&
          ts.isStringLiteral(statement.expression))
      ) {
        importPosition = statement.end;
      } else break;
    }
    const statement = `${importPosition ? eol : ""}import { RevisionLabWidget as ${widgetName} } from "revisionlab";${eol}`;
    updated =
      updated.slice(0, importPosition) +
      statement +
      updated.slice(importPosition);
  }
  return updated;
}
