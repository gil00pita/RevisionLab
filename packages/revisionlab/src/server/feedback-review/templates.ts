import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { TicketTemplate } from "../../feedback-review.js";
import type { ResolvedConfig } from "../config.js";
import { HttpError } from "../security.js";

const builtins = ["bug-report", "accessibility", "investigation"];
const maxBytes = 16_000;

export function templateDirectory(config: ResolvedConfig) {
  return resolve(
    config.ticketTemplatesDirectory ??
      join(
        dirname(config.aiInstructionsFile ?? ".revisionlab/ai-instructions.md"),
        "ticket-templates",
      ),
  );
}

async function readTemplate(path: string, id: string): Promise<TicketTemplate> {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > maxBytes)
      throw new Error("Invalid template file.");
    const markdown = (await file.readFile("utf8")).trim();
    const name = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim();
    if (!name || name.length > 100 || !markdown)
      throw new Error("Template needs a # Title.");
    return { id, name, markdown };
  } finally {
    await file.close();
  }
}

async function ensureDirectory(config: ResolvedConfig, create = false) {
  const directory = templateDirectory(config);
  // Check ancestors before creating/writing files so a redirected folder is rejected.
  for (const current of [directory, dirname(directory)]) {
    try {
      const info = await lstat(current);
      if (!info.isDirectory() || info.isSymbolicLink())
        throw new Error("Invalid template directory.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 });
  return directory;
}

export async function readTicketTemplates(config: ResolvedConfig) {
  const templates = await Promise.all(
    builtins.map((id) =>
      readTemplate(
        fileURLToPath(
          new URL(`../../../assets/ticket-templates/${id}.md`, import.meta.url),
        ),
        id,
      ),
    ),
  );
  let templateError = "";
  try {
    const directory = await ensureDirectory(config);
    const files = await readdir(directory, { withFileTypes: true }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      },
    );
    const candidates = files
      .filter((file) => /^[a-zA-Z0-9_-]{1,100}\.md$/.test(file.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (candidates.length > 100)
      templateError = "Only the first 100 custom templates are listed.";
    for (const file of candidates.slice(0, 100)) {
      try {
        const id = file.name.slice(0, -3);
        if (builtins.includes(id)) throw new Error("Reserved template name.");
        templates.push(await readTemplate(join(directory, file.name), id));
      } catch {
        templateError =
          "Some templates could not be loaded. Use readable .md files under 16 KB with a # Title, without symbolic links or reserved filenames.";
      }
    }
  } catch {
    templateError =
      "Custom templates could not be loaded. Check the ticket template directory and its permissions.";
  }
  return { templates, templateError };
}

export async function addTicketTemplate(
  config: ResolvedConfig,
  name: string,
  body: string,
) {
  const template = {
    id: randomUUID(),
    name,
    markdown: `# ${name}\n\n${body.trim()}`,
  };
  if (Buffer.byteLength(template.markdown) > maxBytes)
    throw new HttpError(400, "Templates must be smaller than 16 KB.");
  try {
    const directory = await ensureDirectory(config, true);
    await writeFile(join(directory, `${template.id}.md`), template.markdown, {
      flag: "wx",
      mode: 0o600,
    });
  } catch {
    throw new HttpError(
      503,
      "Could not save the Markdown template. Check writable template storage and retry; your text is retained.",
    );
  }
  return template;
}
