import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoots = ["app", "components", "hooks", "lib"];
const sourceFiles = [];

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) sourceFiles.push(path);
  }
}

for (const directory of sourceRoots) collect(join(root, directory));

test("frontend source contains no pictographic emoji", () => {
  const pictographic = /\p{Extended_Pictographic}/u;
  const offenders = sourceFiles
    .filter((path) => pictographic.test(readFileSync(path, "utf8")))
    .map((path) => relative(root, path));
  assert.deepEqual(offenders, []);
});

test("Lucide React is installed and no alternate icon library is imported", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(packageJson.dependencies["lucide-react"]);
  const alternateLibrary = /from\s+["'](?:react-icons|@heroicons|@fortawesome|bootstrap-icons|iconoir|phosphor)[^"']*["']/;
  const offenders = sourceFiles
    .filter((path) => alternateLibrary.test(readFileSync(path, "utf8")))
    .map((path) => relative(root, path));
  assert.deepEqual(offenders, []);
});
