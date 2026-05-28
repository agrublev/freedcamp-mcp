#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PKG_PATH = resolve(ROOT, "package.json");
const VERSION_PATH = resolve(ROOT, "common/version.js");

const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
};

const bump = (version, type) => {
  const [major, minor, patch] = version.split(".").map(Number);
  if ([major, minor, patch].some(Number.isNaN)) {
    throw new Error(`Invalid version: ${version}`);
  }
  switch (type) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
    default:
      if (/^\d+\.\d+\.\d+$/.test(type)) return type;
      throw new Error(`Unknown bump type: ${type}. Use patch | minor | major | x.y.z`);
  }
};

const arg = process.argv[2] || "patch";

const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"));
const currentVersion = pkg.version;
const nextVersion = bump(currentVersion, arg);

console.log(`Bumping version: ${currentVersion} -> ${nextVersion}`);

pkg.version = nextVersion;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");

const versionFile = readFileSync(VERSION_PATH, "utf8");
const updatedVersionFile = versionFile.replace(
  /export const VERSION = ".*?";/,
  `export const VERSION = "${nextVersion}";`
);
writeFileSync(VERSION_PATH, updatedVersionFile);

const status = execSync("git status --porcelain", { cwd: ROOT }).toString().trim();
if (!status) {
  console.error("No changes to commit. Aborting.");
  process.exit(1);
}

run(`git add package.json common/version.js`);
run(`git commit -m "chore(release): v${nextVersion}"`);
run(`git tag v${nextVersion}`);
run(`git push`);
run(`git push --tags`);
run(`npm publish`);

console.log(`\nReleased v${nextVersion}`);
