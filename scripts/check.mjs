#!/usr/bin/env node
// Verify the skills against reality:
//
//   1. Every tool a skill names actually exists in the fetchbean catalog. A skill that names a tool
//      that isn't there is worse than no skill — the agent tries it and gets a 404 it can't explain.
//   2. index.json matches the skills directory.
//   3. The hub links every skill, so nothing ships invisible. The hub named 3 of 15 for a while,
//      which is why this check exists.
//
//   node scripts/check.mjs                                    # against production
//   TOOLS=../fetchbean/web/public/llms-full.txt node scripts/check.mjs   # against an undeployed build
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// llms-full.txt is the public surface carrying the flat `provider_tool` names the HTTP API actually
// routes on. /catalog exposes each op's endpoint (`/threads/reply`) but never its id, and the two do
// not line up — plain.reply_to_thread is served at /v1/plain_reply_to_thread, not /v1/plain_threads_reply.
const TOOLS = process.env.TOOLS ?? "https://fetchbean.com/llms-full.txt";

// A path rather than a URL reads a local build, so a skill can be checked against the API it is
// about to ship alongside rather than against what is currently deployed.
let listing;
let listingSource = TOOLS;
if (/^https?:\/\//.test(TOOLS)) {
  let res = await fetch(TOOLS);
  // Rollout compatibility: the short index and llms-full.txt may not deploy atomically. Production's
  // former llms.txt is itself the complete generated inventory, so it remains authoritative until
  // the new full path exists. An explicit TOOLS override never falls back.
  if (!res.ok && !process.env.TOOLS && res.status === 404) {
    listingSource = "https://fetchbean.com/llms.txt";
    res = await fetch(listingSource);
  }
  if (!res.ok) {
    console.error(`could not read the tool list at ${listingSource}: ${res.status}`);
    process.exit(2);
  }
  listing = await res.text();
} else {
  listing = readFileSync(TOOLS, "utf8");
}
const tools = new Set([...listing.matchAll(/POST \/v1\/([a-z0-9_]+)/g)].map(([, name]) => name));
if (tools.size < 100) {
  console.error(`only ${tools.size} tools parsed from ${listingSource} — the format probably changed`);
  process.exit(2);
}
// Only names containing an underscore contribute a provider prefix: there are top-level aliases
// (`read`, `search`) whose whole name has none, and treating those as prefixes would read prose like
// `read_page` or `read_only` as tool references.
const knownProviders = new Set([...tools].filter((t) => t.includes("_")).map((t) => t.split("_")[0]));

const dirs = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const problems = [];

for (const dir of dirs) {
  const md = readFileSync(join(ROOT, "skills", dir, "SKILL.md"), "utf8");
  // Three places a skill unambiguously names a tool. Matching on a known provider prefix alone is
  // not enough: a prefix is only "known" if that provider already ships, so a skill written ahead of
  // its provider would exempt itself entirely — which is exactly the case this check must catch.
  const referenced = new Set([
    // 1. a call against fetchbean's own host. Scoped to it because upstream docs and examples carry
    //    their own /v1/ paths (Stripe's /v1/charges, Loops' /v1/contacts) that are not our tools.
    ...[...md.matchAll(/api\.fetchbean\.com\/v1\/([a-z][a-z0-9_]*)/g)].map(([, name]) => name),
    // 2. a tool list item — but only inside a tools section, since other lists carry error codes
    //    (`credential_required`) and enum values (`html`, `binary`) in the same shape.
    ...[...md.matchAll(/^##+ .*$|^\s*[-*]\s+`([a-z][a-z0-9_]*)`/gm)]
      .reduce(
        (acc, m) => {
          if (m[1] === undefined) return { inTools: /tool/i.test(m[0]), names: acc.names };
          return { inTools: acc.inTools, names: acc.inTools ? [...acc.names, m[1]] : acc.names };
        },
        { inTools: false, names: [] },
      ).names,
    // 3. any backticked identifier whose prefix is a provider that already ships
    ...[...md.matchAll(/`([a-z][a-z0-9]*)_([a-z0-9_]+)`/g)]
      .filter(([, prefix]) => knownProviders.has(prefix))
      .map(([, prefix, rest]) => `${prefix}_${rest}`),
  ]);
  // The meta-tools are routes rather than catalog entries.
  for (const meta of ["run", "request", "discover", "describe", "catalog"]) referenced.delete(meta);
  const unknown = [...referenced].filter((t) => !tools.has(t)).sort();
  if (unknown.length) problems.push(`${dir}: names ${unknown.length} tool(s) not in the catalog — ${unknown.join(", ")}`);
}

// index.json has to match what's on disk.
const index = JSON.parse(readFileSync(join(ROOT, "index.json"), "utf8"));
const indexed = new Set(index.skills.map((s) => s.name));
const onDisk = new Set(
  dirs.map((d) => JSON.parse(/^name:\s*(.+)$/m.exec(readFileSync(join(ROOT, "skills", d, "SKILL.md"), "utf8"))[1])),
);
for (const name of onDisk) if (!indexed.has(name)) problems.push(`index.json is missing ${name} — run scripts/build-index.mjs`);
for (const name of indexed) if (!onDisk.has(name)) problems.push(`index.json lists ${name}, which is not in skills/`);

// The hub is the entry point; a skill it doesn't name is a skill nobody finds.
const hub = readFileSync(join(ROOT, "skills", "fetchbean", "SKILL.md"), "utf8");
for (const name of onDisk) {
  if (name === "fetchbean") continue;
  if (!hub.includes(name)) problems.push(`the hub skill does not link ${name}`);
}

if (problems.length) {
  console.error(`FAIL — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`OK — ${dirs.length} skills, every referenced tool exists, index and hub are in sync`);
