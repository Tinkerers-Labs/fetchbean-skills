#!/usr/bin/env node
// Generate index.json from the skills' frontmatter — the machine-readable list the fetchbean API
// serves at GET /skills (and any dashboard/footer reads). Run after adding or renaming a skill:
//   node scripts/build-index.mjs
// Commit the regenerated index.json. No timestamp is written, so the file only changes when the
// skills do (no spurious diffs).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "Tinkerers-Labs/fetchbean-skills";

/** Pull `name` and `description` out of a SKILL.md's YAML frontmatter. Both are emitted as
 *  JSON-stringified scalars, so JSON.parse handles any quotes/escapes correctly. */
function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error("no frontmatter");
  const field = (key) => {
    const line = m[1].split("\n").find((l) => l.startsWith(`${key}:`));
    if (!line) throw new Error(`missing ${key}`);
    return JSON.parse(line.slice(key.length + 1).trim());
  };
  return { name: field("name"), description: field("description") };
}

/** hub | capability | meta | provider — the taxonomy the display groups by. */
function classify(name) {
  if (name === "fetchbean") return { kind: "hub", provider: null };
  if (name === "skill-creator") return { kind: "meta", provider: null };
  if (name === "fetchbean-artifacts") return { kind: "capability", provider: null };
  if (name.startsWith("fetchbean-")) return { kind: "provider", provider: name.slice("fetchbean-".length) };
  return { kind: "other", provider: null };
}

const dirs = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const skills = dirs.map((dir) => {
  const { name, description } = frontmatter(readFileSync(join(ROOT, "skills", dir, "SKILL.md"), "utf8"));
  return {
    name,
    description,
    ...classify(name),
    install: `npx skills add ${REPO} --skill ${name}`,
    url: `https://github.com/${REPO}/blob/main/skills/${dir}/SKILL.md`,
  };
});

writeFileSync(join(ROOT, "index.json"), JSON.stringify({ repo: REPO, count: skills.length, skills }, null, 2) + "\n");
console.log(`wrote index.json — ${skills.length} skills`);
for (const s of skills) console.log(`  ${s.kind.padEnd(10)} ${s.name}`);
