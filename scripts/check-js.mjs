import { readdir, readFile } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { format } from "prettier";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const scope = process.argv[2];
if (scope && !["frontend", "backend"].includes(scope))
  throw Error("Expected frontend or backend scope.");
const excluded = new Set([
  "node_modules",
  ".next",
  ".git",
  ".npm-cache",
  "data",
  "dist",
]);
const sources = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(file)) sources.push(file);
  }
}
await walk(scope ? join(root, scope) : root);
let failures = 0;
for (const file of sources) {
  try {
    if (/\.tsx?$/.test(file))
      throw Error(
        "Authored TypeScript is not allowed. Use .jsx for React or .js for logic.",
      );
    // Babel parses JSX without accepting TypeScript. Formatting output is not written.
    await format(await readFile(file, "utf8"), {
      filepath: file,
      parser: "babel",
    });
    if (!file.endsWith(".jsx")) {
      const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8",
      });
      if (result.error) throw result.error;
      if (result.status !== 0) throw Error(result.stderr);
    }
  } catch (error) {
    failures++;
    console.error(`${relative(root, file)}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
else
  console.log(
    `JavaScript syntax checks passed (${sources.length} files${scope ? `, ${scope}` : ""}).`,
  );
