import { chmodSync } from "node:fs";

// npm runs package scripts from the package root. tsc preserves the shebang,
// but fresh output needs executable permissions before CI packs without scripts.
chmodSync("dist/cli/index.js", 0o755);
