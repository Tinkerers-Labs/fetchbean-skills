# Contributing a skill

Skills here are added on demand — if fetchbean supports a service and you'd use a dedicated skill for
it, add one.

## The easy path

Install and use [`fetchbean-skill-creator`](skills/fetchbean-skill-creator) — it pulls the service's
live tool list from the catalog and writes a skill that follows the conventions below.

## By hand

Copy an existing skill as a starting point ([`fetchbean-linear`](skills/fetchbean-linear) for a
connected service with a workspace cache, [`fetchbean-fireflies`](skills/fetchbean-fireflies) for a
simpler one) and keep to these rules:

- **Name** `fetchbean-<provider>`, one directory under `skills/` with a single `SKILL.md`.
- **Self-contained.** One file — no companion files a single-file install wouldn't pull. If you cache
  per-account context, do it in a git-ignored `workspace.md` the skill generates on first use (see the
  `Personalize` sections), never checked in.
- **The catalog is the source of truth.** Build the tool list from
  `GET https://api.fetchbean.com/discover?q=<service>`, and **verify every tool name you write against
  it** — a skill that names a tool that doesn't exist is worse than no skill. Don't invent tools,
  params, or deletes the catalog doesn't show.
- **Lead the description with domain nouns.** It's what makes the skill fire. Say what the user asks
  about, third person, and include the `my <service>` trigger.
- **Writes get a safety note** and default to reads.

Then open a PR. Keep each skill's body under ~150 lines — link to `discover`, don't dump the catalog.

After adding, renaming, or removing a skill, regenerate the machine-readable index (`node scripts/build-index.mjs`) and commit `index.json` — the fetchbean API serves it at `GET /skills`.

Then run `node scripts/check.mjs`. It verifies that every tool a skill names actually exists, that
`index.json` matches the directory, and that the hub links every skill. A skill naming a tool that
isn't there is worse than no skill: the agent calls it, gets an error it cannot explain, and has no
way to tell whether it used the wrong name or the service is broken.

If a skill ships alongside new API tools that are not deployed yet, check it against the build
instead of production: `TOOLS=../fetchbean/web/public/llms-full.txt node scripts/check.mjs`.

By contributing you agree your changes are MIT licensed (see [LICENSE](LICENSE)).
