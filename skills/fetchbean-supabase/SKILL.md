---
name: "fetchbean-supabase"
description: "Query and inspect your Supabase projects through fetchbean (one key, connected by OAuth so no token lives in your config). Use when the user asks about their Supabase database, projects, tables, rows, or logs, or says 'my Supabase' — for example running a SQL query, listing projects, or checking recent logs. Requires connecting Supabase once in the fetchbean dashboard (one click); calls before that return credential_required."
---

# Supabase (via fetchbean)

Run SQL and inspect your Supabase projects through fetchbean. fetchbean holds your Supabase token encrypted server-side, so you call clean tools with your fetchbean key and never put a Supabase token in config.

## Your workspace

Your projects — with the `project_ref` that every tool takes — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: you can target a project by name without listing. If it's absent, run **Personalize (once)** below. If a project is missing, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Supabase once: open https://fetchbean.com/app, go to Connections, pick Supabase, and click connect (OAuth — one click, no token to paste).

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run this once and write a compact `workspace.md`:

- `supabase_projects` → each project's `name` → `ref`, plus region and status

Write it compactly, stamped with today's date, like:

```
# Supabase projects · 2026-01-01
- app-prod · ref abcdefgh… · us-east-1 · ACTIVE
- app-staging · ref ijklmnop… · us-east-1 · ACTIVE
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Supabase account.

```bash
curl https://api.fetchbean.com/v1/supabase_run_sql \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"project_ref":"<ref>","query":"select count(*) from auth.users"}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `supabase_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"supabase","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

- `supabase_projects` () your projects (id, ref, name, region, status).
- `supabase_project` (project_ref) details for one project.
- `supabase_organizations` () your organizations.
- `supabase_logs` (project_ref) recent project logs (optional `sql` + `iso_timestamp_start`/`end` filters).

## SQL

- `supabase_run_sql` (project_ref, query, read_only?) run SQL on a project. **It defaults to read-only** — a safe way to query. Pass `read_only:false` to allow writes and DDL.

## Anything else

For any Supabase Management API endpoint not covered above, use the escape hatch:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"supabase","endpoint":"/request","input":{"path":"/v1/projects","method":"GET"}}'
```

## Safety

`supabase_run_sql` runs arbitrary SQL against a real database. Reads are safe and are the default (`read_only` true). **`read_only:false` allows writes, updates, and DDL — including `drop`/`delete`/`truncate`, which can destroy production data irreversibly.** Only pass it on an explicit request, confirm the project and the exact SQL first, and prefer running against a staging project. When in doubt, leave read_only on.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=supabase` (no key needed).
