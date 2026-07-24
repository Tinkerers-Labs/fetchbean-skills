---
name: "fetchbean-linear"
description: "Work with your Linear issues, projects, and teams through fetchbean (one key, with your Linear token held encrypted server-side instead of in config). Use when the user asks about their Linear issues, tickets, bugs, projects, teams, sprints, or roadmap, or says 'my Linear' — for example listing issues assigned to me, searching tickets, checking a project's status, filing a bug, updating an issue's state, or commenting on one. Requires connecting Linear once in the fetchbean dashboard; calls before that return credential_required."
---

# Linear (via fetchbean)

Work with your Linear issues, projects, teams, and comments through fetchbean. fetchbean holds your Linear API key encrypted server-side, so you call clean tools with your fetchbean key and never put a Linear token in config.

## Your workspace

This account's teams, workflow states, labels, and members — with the ids that writes need — are cached in **`workspace.md`** beside this file. **If it's present, read it first** and use it instead of re-looking things up: you can then move an issue, assign it, or tag it by name without a lookup call. If it's absent, run **Personalize (once)** below to create it. If a team, state, or label you need is missing from it, it's stale — re-run Personalize.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Linear once: open https://fetchbean.com/app, go to Connections, pick Linear, and paste your Linear personal API key (from https://linear.app/settings/account/security). fetchbean verifies and encrypts it.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these four reads once and write a compact `workspace.md` capturing the ids you'll reuse:

- `linear_teams` → each team's `key` → `id`
- `linear_workflow_states` (once per team, passing `team_key`) → state `name`/`type` → `id` (needed to move issues)
- `linear_users` → member `name`/`email` → `id` (needed to assign)
- `linear_labels` → label `name` → `id` (needed to tag)

Write it compactly, stamped with today's date, like:

```
# Linear workspace · 2026-01-01
## Teams
- ENG — Engineering · id 1111…
## States · ENG
- Todo (unstarted) · id bbbb…
- In Progress (started) · id cccc…
## Members
- Ada Lovelace <ada@example.com> · id u111…
## Labels
- Bug · id l111…
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading down to (not including) the next `##` — so it doesn't reload on every use. Leave the "## Your workspace" section above in place; that's the pointer you read each session.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Linear account.

```bash
curl https://api.fetchbean.com/v1/linear_search \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":"login redirect","first":10}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `linear_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"linear","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## IDs and priority

Linear reads accept either a UUID or the human identifier `ENG-123`. **Writes need UUIDs**: `teamId`, `stateId`, and `assigneeId` are all UUIDs. Get a team's UUID from `linear_teams`; get the state UUIDs you can move an issue *to* from the team-states query below.

**Priority is not a 0→4 scale.** `1` is the highest: `0` none · `1` urgent · `2` high · `3` medium · `4` low.

## Read tools

- `linear_search` (query, first?) free-text search across your issues. Start here for "find the ticket about X".
- `linear_issues` (first?, team_key?, assigned_to_me?, state_type?, priority?, filter?) list issues, filtered by team, state, assignee, or priority. `assigned_to_me: true` is "my issues"; `state_type` is one of `backlog|unstarted|started|completed|canceled`.
- `linear_issue` (id? or identifier?) one issue in full by UUID or `ENG-123`, including its state and assignee UUIDs.
- `linear_comments` (id or identifier, first?) the comment thread on an issue (by UUID or `ENG-123`).
- `linear_teams` (first?) your teams (id, key, name) — the `teamId` create_issue needs.
- `linear_workflow_states` (team_key?, first?) a team's workflow states (id, name, type) — the `stateId` to move an issue to. Filter by `team_key`.
- `linear_users` (first?) workspace members (id, name, email) — the `assigneeId` for creating or reassigning.
- `linear_labels` (first?) issue labels (id, name, team) — the `labelIds` for create/update.
- `linear_projects` (first?) projects with status and progress.
- `linear_viewer` () the Linear account your key authenticates as.

## Write tools

- `linear_create_issue` (teamId, title, description?, assigneeId?, stateId?, priority?, projectId?) file an issue. `teamId` is required — list teams first.
- `linear_update_issue` (id, title?, description?, stateId?, assigneeId?, priority?) update an issue by its UUID. Only the fields you pass change.
- `linear_create_comment` (issueId, body) comment on an issue (issueId is the UUID).

## Moving an issue's status ("move to In Progress")

A status change needs the target state's UUID. Get it from `linear_workflow_states` (filter by the issue's team), pick the state whose `name`/`type` you want, then call `linear_update_issue`:

```bash
# 1. list the team's states
curl https://api.fetchbean.com/v1/linear_workflow_states \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"team_key":"ENG"}'

# 2. move the issue to the chosen state
curl https://api.fetchbean.com/v1/linear_update_issue \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"id":"<issue-uuid>","stateId":"<state-uuid>"}'
```

Reassign the same way with `linear_users` → `assigneeId`; tag with `linear_labels` → `labelIds`.

## Anything else

For any Linear query or mutation the curated tools don't cover, use `linear_graphql`. It runs raw GraphQL on your own key and returns the data **unwrapped** (no `.data` envelope). Introspect with `{ __schema { mutationType { fields { name } } } }` or see https://linear.app/developers/graphql.

```bash
curl https://api.fetchbean.com/v1/linear_graphql \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { viewer { id name } }"}'
```

## Safety

Default to reads. Only create, update, comment, or change state when the user explicitly asks for that write — confirm first. Issue bodies and comments often carry account ids, emails, and incident detail, so summarize rather than dumping raw payloads unless asked.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=linear` (no key needed).
