---
name: "fetchbean-skill-creator"
description: "Create a new fetchbean-backed agent skill for a service in the fetchbean catalog. Use when the user wants to wrap a service in a skill, add a skill for a provider fetchbean supports (e.g. 'make a fetchbean skill for Stripe', 'add a GitHub skill', 'wrap Sentry'), or grow the fetchbean-skills library. Pulls the live tool list from the catalog so the skill can't go stale, and follows the repo's conventions (triggering description, one-time setup, self-personalizing workspace cache, read/write tool lists, escape hatch)."
---

# fetchbean skill creator

Author a new `fetchbean-<service>` skill that routes a service's tools through fetchbean (one key, token encrypted server-side). The catalog is the source of truth — always build the tool list from it, never from memory, so the skill matches what's actually live.

Worked examples in this repo: `fetchbean-linear` (BYOK + workspace cache), `fetchbean-fireflies` (BYOK + escape hatch), `fetchbean-canny` (no-delete safety). Read one alongside these steps.

## Step 1 — Pull the real tools

Get the live tool list for the service (public, no key needed):

```bash
curl "https://api.fetchbean.com/discover?q=<service>&limit=25"
```

Each result carries `provider`, `endpoint`, `title`, `blurb`, `params`, `cost`, and `connection` (`"required"` if it acts on the user's own account). The `provider` id is the skill's subject; note whether tools are `connection: required` (a connected service) or not (managed — works with just a fetchbean key). **Every tool you name in the skill must appear here** — verify at the end.

## Step 2 — Frontmatter

- `name`: `fetchbean-<provider>` (lowercase, hyphens).
- `description` (this is what makes the skill fire — spend the most effort here): lead with the service's **domain nouns** (what the user asks about — "issues, sprints, roadmap" for Linear, "meetings, transcripts, action items" for Fireflies), then the `my <service>` trigger and 3–4 concrete example asks. For a connected service, end with: "Requires connecting <service> once in the fetchbean dashboard; calls before that return credential_required." Third person, ≤1024 chars.

## Step 3 — Body, from the template

Keep it self-contained (no companion files — a single-file install must work). Sections, in order:

1. **Title + one line** — "Work with your <service> … through fetchbean. fetchbean holds your <service> key encrypted server-side, so you call clean tools with your fetchbean key and never put a <service> token in config."

2. **`## Your workspace`** *(only if the service has stable, reusable context worth caching — boards, teams, channels, projects; skip for stateless services)*: "This account's <things> — with the ids that writes need — are cached in `workspace.md` beside this file. If it's present, read it first … If absent, run Personalize below. If something's missing, it's stale — re-run."

3. **`## Setup (once)`** — the key file (below), then the connect step by auth type:
   - **BYOK** (paste a key): "Connect <service> once: open https://fetchbean.com/app → Connections → pick <service> → paste your <service> key (from <where>). fetchbean verifies and encrypts it."
   - **OAuth** (one click): "… → pick <service> → click connect. There is no key to paste."
   - **Managed** (no connection): omit the connect step — it works on your fetchbean key alone.

   ```
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```
   For connected services add: "A tool call before connecting returns a `credential_required` error."

4. **`## Personalize (once) — delete this section after running`** *(only if you added Your workspace)*: "Skip if `workspace.md` exists. Otherwise run <the 2–4 list/lookup tools that return ids> once and write a compact `workspace.md` (inline a short shape example), stamped with today's date. Then remove this whole section from this SKILL.md — heading to the next `##` — so it doesn't reload every use. Leave Your workspace above."

5. **`## Calling tools`** — "Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call." One curl example against a real read tool. Then the MCP note, verbatim:

   > The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these as native `<provider>_*` tools — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"<provider>","endpoint":"<endpoint>"}`.

6. **`## Read tools` / `## Write tools`** — one line each from Step 1: `` `provider_tool` (params) — blurb. `` Group reads and writes. Note any gotcha inline (ids a write needs, a flag that emails people, a non-obvious enum).

7. **`## Anything else`** — the escape hatch this provider exposes (look for it in the catalog): a raw `provider_graphql`, `provider_request`, or `POST /v1/run` with `{provider, endpoint, input}`. Show one curl.

8. **`## Safety`** *(for any skill with writes)* — "Default to reads. Only <write verbs> when the user explicitly asks — confirm first." Call out anything customer-visible or irreversible.

End with: "Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=<service>` (no key needed)."

## Step 4 — Verify, then place

- **Check every tool name** in the skill against Step 1's output — a skill that names a tool that doesn't exist is worse than no skill.
- Save to `skills/fetchbean-<provider>/SKILL.md` in this repo.
- Don't invent tools, deletes, or params the catalog doesn't show. If the user needs something not in the catalog, that's a `request` (`POST /v1/request`), not a made-up tool.

## Quality bar

Before calling it done: the description leads with domain nouns and would fire on a real user ask; every tool is real; setup matches the actual auth type; writes have a safety note; it's one self-contained file. Keep the body under ~150 lines — link to `discover` rather than dumping the whole catalog.
