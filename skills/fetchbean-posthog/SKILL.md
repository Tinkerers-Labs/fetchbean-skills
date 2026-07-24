---
name: "fetchbean-posthog"
description: "Query your PostHog product analytics through fetchbean (one key, with your PostHog token held encrypted server-side instead of in config). Use when the user asks about their PostHog analytics, events, funnels, retention, feature flags, insights, dashboards, or error tracking, or says 'my analytics' or 'my HogQL' — for example running a HogQL query over events, checking a funnel, listing feature flags, or toggling a flag. Requires connecting PostHog once in the fetchbean dashboard; calls before that return credential_required."
---

# PostHog (via fetchbean)

Query your PostHog analytics and manage feature flags through fetchbean. fetchbean holds your PostHog personal API key encrypted server-side, so you call clean tools with your fetchbean key and never put a PostHog token in config.

## Your workspace

Your **project id** — which every query needs unless your connection resolved a default — plus the event names you actually track (the schema HogQL references) are cached in **`workspace.md`** beside this file. **If it's present, read it first**: pass its `project_id` on calls, and write HogQL against real event names instead of guessing. If it's absent, run **Personalize (once)** below. If a call returns `project_id is required`, or the events look out of date, re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect PostHog once: open https://fetchbean.com/app, go to Connections, pick PostHog, paste your personal API key (`phx_...`, from https://app.posthog.com/settings/user-api-keys), and choose your region (US / EU / self-hosted). fetchbean tries to resolve your default project at connect — but if a query returns `project_id is required`, your connection didn't carry one; run Personalize below to cache it and pass it on calls.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md`:

- `posthog_projects` → this returns your PostHog user; your **current project id is `team.id`** (PostHog calls projects "teams"), and `organizations` lists the rest. Note the `project_id`.
- `posthog_query` with that `project_id` and a schema probe → your live event names, so HogQL uses real ones:
  `{"project_id":<id>,"query":"select event, count() c from events where timestamp > now() - interval 30 day group by event order by c desc limit 40"}`

Write it compactly, stamped with today's date, like:

```
# PostHog workspace · 2026-01-01
## Project
- Web App · project_id 53951 (pass this on every call)
## Top events (last 30d)
- $pageview, $identify, signup_completed, checkout_started, feature_used, …
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own PostHog account.

```bash
curl https://api.fetchbean.com/v1/posthog_query \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":"select event, count() from events where timestamp > now() - interval 7 day group by event order by count() desc limit 10"}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `posthog_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"posthog","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## HogQL is the workhorse

`posthog_query` runs HogQL (PostHog's SQL over your events, persons, and analytics) and answers almost every "what happened / how many / which users" question — funnels, retention, breakdowns, top events. Reach for it first; the other reads are for listing saved objects. **Pass `project_id`** (from `workspace.md`, or `posthog_projects` → `team.id`) unless your connection resolved a default — a query without it returns `project_id is required`.

## Read tools

- `posthog_query` (query, project_id?) run a HogQL/SQL query over your events, persons, and analytics. The main read.
- `posthog_projects` () your account, organization, and accessible projects (the ids the other tools can take).
- `posthog_insights` (limit?, project_id?) your saved insights.
- `posthog_dashboards` (limit?, project_id?) your dashboards.
- `posthog_feature_flags` (limit?, project_id?) your feature flags.
- `posthog_feature_flag` (flag_id, project_id?) one feature flag by id.
- `posthog_error_issues` (limit?, project_id?) grouped error-tracking issues.

## Write tools

- `posthog_create_feature_flag` (key, name?, active?, project_id?) create a feature flag. Pass any PostHog flag fields (e.g. filters, rollout).
- `posthog_update_feature_flag` (flag_id, active?, project_id?) update a flag — toggle `active`, change rollout, etc.

## Anything else

For any PostHog REST endpoint not covered above, call it directly through fetchbean (`{project_id}` in the path is filled from your connection):

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"posthog","endpoint":"/request","input":{"path":"/api/projects/{project_id}/actions/","method":"GET"}}'
```

## Safety

Reads (including HogQL) are safe. `posthog_create_feature_flag` and `posthog_update_feature_flag` change what ships to your users — toggling a flag can turn a feature on or off in production — so only on an explicit ask, and confirm the flag and target state first.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=posthog` (no key needed).
