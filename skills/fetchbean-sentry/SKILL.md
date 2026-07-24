---
name: "fetchbean-sentry"
description: "Read and triage your Sentry errors through fetchbean (one key, with your Sentry token held encrypted server-side instead of in config). Use when the user asks about their Sentry issues, errors, exceptions, crashes, stacktraces, releases, or projects, or says 'my Sentry' or 'my errors' — for example listing unresolved issues, reading a stacktrace, resolving or assigning an issue, or checking recent releases. Requires connecting Sentry once in the fetchbean dashboard; calls before that return credential_required."
---

# Sentry (via fetchbean)

Read and triage your Sentry issues through fetchbean. fetchbean holds your Sentry auth token encrypted server-side, so you call clean tools with your fetchbean key and never put a Sentry token in config.

## Your workspace

Your organizations and projects — the `organization_slug` and project slugs that issue queries take — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: you can scope a query to the right org/project by name without a lookup. If it's absent, run **Personalize (once)** below. If a project is missing, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Sentry once: open https://fetchbean.com/app, go to Connections, pick Sentry, and paste a Sentry auth token (from https://sentry.io/settings/account/api/auth-tokens/). If you're on the EU or a self-hosted instance, set the host too; your default organization is auto-detected.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md`:

- `sentry_organizations` → each organization's `slug`
- `sentry_projects` (per organization) → each project's `slug`/name

Write it compactly, stamped with today's date, like:

```
# Sentry workspace · 2026-01-01
## Organizations
- acme (default)
## Projects · acme
- frontend, backend, mobile
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Sentry account.

```bash
curl https://api.fetchbean.com/v1/sentry_issues \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":"is:unresolved lastSeen:-24h","limit":10}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `sentry_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"sentry","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

- `sentry_issues` (query?, sort?, limit?, cursor?, organization_slug?) list issues — defaults to `is:unresolved`; `query` takes Sentry's search (e.g. `is:unresolved lastSeen:-24h`).
- `sentry_issue` (issue_id, organization_slug?) one issue.
- `sentry_latest_event` (issue_id, organization_slug?) the latest event — stacktrace + context. Use this to actually debug an issue.
- `sentry_issue_events` (issue_id, organization_slug?) the events for an issue.
- `sentry_projects` (organization_slug?, cursor?, limit?) an org's projects. `sentry_organizations` () your orgs.
- `sentry_releases` (organization_slug?, cursor?, limit?) an org's releases.

## Write tools

- `sentry_update_issue` (issue_id, status?, assignedTo?, priority?, organization_slug?) triage an issue — `status` is `resolved` | `unresolved` | `ignored`.

## Anything else

For any Sentry endpoint not covered above, use the escape hatch (any path under `/api/0`):

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"sentry","endpoint":"/request","input":{"path":"/organizations/acme/teams/","method":"GET"}}'
```

## Safety

Default to reads. `sentry_update_issue` changes an issue's state — resolving or ignoring it hides it from the team's triage — so only on an explicit ask, and confirm the issue first.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=sentry` (no key needed).
