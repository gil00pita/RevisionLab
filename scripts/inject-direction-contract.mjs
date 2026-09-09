import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const serverDirectory = path.resolve(".next/server");
const seed = "b4ea4c39";
const directionContract = JSON.parse(await readFile(new URL("../app/direction-contract.json", import.meta.url), "utf8"));

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  }));
  return nested.flat();
}

const contractComment = `<!--${directionContract.contract}-->`;
let injected = 0;
let present = 0;

for (const file of await htmlFiles(serverDirectory)) {
  const html = await readFile(file, "utf8");
  if (html.includes(`<!--${directionContract.contract}`)) {
    present += 1;
    continue;
  }
  if (!html.includes("<body")) continue;
  const nextHtml = html.replace(/(<body[^>]*>)/, `$1${contractComment}`);
  if (nextHtml.includes(seed)) {
    await writeFile(file, nextHtml);
    injected += 1;
  }
}

if (injected + present === 0) throw new Error("Direction contract was not found in any production HTML files.");
console.log(`Direction contract present in ${injected + present} production HTML file${injected + present === 1 ? "" : "s"}.`);
