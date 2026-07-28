---
name: "fetchbean-chatwoot"
description: "Work your Chatwoot support inbox through fetchbean (one key, with your Chatwoot token held encrypted server-side instead of in config). Use when the user asks about their Chatwoot conversations, support inbox, customer chats, contacts, agents, or response times, or says 'my Chatwoot' or 'my support inbox' — for example triaging open conversations, reading a thread, replying or leaving an internal note, resolving or snoozing, assigning to a teammate, labelling, or pulling first-response and resolution reports. Cloud or self-hosted. Requires connecting Chatwoot once in the fetchbean dashboard; calls before that return credential_required."
---

# Chatwoot (via fetchbean)

Work your Chatwoot support inbox through fetchbean. fetchbean holds your Chatwoot access token encrypted server-side, so you call clean tools with your fetchbean key and never put a Chatwoot token in config.

## Your workspace

Your inboxes, agents, teams, and labels — the ids that filtering and assignment take — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: assigning takes an agent or team id and filtering takes an inbox id, so the cache saves a lookup per task. If it's absent, run **Personalize (once)** below. If an inbox, agent, or label is missing, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Chatwoot once: open https://fetchbean.com/app, go to Connections, pick Chatwoot, and paste your access token (Chatwoot → Profile Settings → Access Token). Leave **Host** blank for Chatwoot cloud, or set your install's URL if you self-host. Your **account id** is resolved automatically when the token reaches exactly one account; if it spans several, pick one in the form.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md`:

- `chatwoot_inboxes` → each inbox's `name` → `id` and channel type
- `chatwoot_agents` → each teammate's `name` → `id` (what assign takes)
- `chatwoot_teams` → each team's `name` → `id`
- `chatwoot_labels` → the label **titles** (labelling takes titles, not ids)

Write it compactly, stamped with today's date, like:

```
# Chatwoot workspace · 2026-01-01
## Inboxes
- Website · id 1 · WebWidget
- Support email · id 2 · Email
## Agents (assignee_id)
- Ada Lovelace · id 11
## Teams (team_id)
- Billing · id 3
## Labels (titles)
- billing, bug, urgent, refund
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Chatwoot account.

```bash
curl https://api.fetchbean.com/v1/chatwoot_conversations \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"status":"open","assignee_type":"unassigned"}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `chatwoot_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"chatwoot","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

Every tool takes an optional `account_id` to act in an account other than the connected default.

## Read tools

- `chatwoot_conversations` (status?, assignee_type?, inbox_id?, team_id?, labels?, q?, page?) the inbox. Status: open, resolved, pending, snoozed, all. `assignee_type`: me, unassigned, assigned, all.
- `chatwoot_conversation` (conversation_id) one conversation: contact, assignee, labels, status.
- `chatwoot_filter_conversations` (payload, page?) advanced search — `{attribute_key, filter_operator, values, query_operator}` clauses, for what the plain filters can't express.
- `chatwoot_conversation_counts` (status?, inbox_id?, team_id?, labels?) queue depth (mine / unassigned / all) without pulling the list.
- `chatwoot_messages` (conversation_id, before?, after?) the thread. Page back with `before`, forward with `after` (a message id).
- `chatwoot_contacts` (sort?, page?) · `chatwoot_search_contacts` (q, sort?, page?) find someone by name, email, phone, or your identifier.
- `chatwoot_contact` (id) one contact — including the `source_id` a new conversation needs.
- `chatwoot_contact_conversations` (id) one person's full support history.
- `chatwoot_inboxes` () · `chatwoot_agents` () · `chatwoot_teams` () · `chatwoot_labels` () the ids and titles writes take.
- `chatwoot_canned_responses` () your saved replies — reuse the team's approved wording.
- `chatwoot_custom_attributes` (attribute_model?) custom fields on `contact_attribute` or `conversation_attribute`.
- `chatwoot_audit_logs` (page?) who changed what (enterprise installs).
- `chatwoot_report` (metric, since, until, type?, id?, group_by?) one metric over time — `conversations_count`, `avg_first_response_time`, `resolutions_count`, and friends. `since`/`until` are unix timestamps **as strings**.
- `chatwoot_report_summary` (since, until, type?, id?) volume, first-response time, resolution time and count for a window, in one call.

## Write tools

- `chatwoot_reply` (conversation_id, content, private?) reply to the customer. **`private: true` makes it an internal note** — it defaults false, so a plain reply is customer-visible.
- `chatwoot_toggle_status` (conversation_id, status, snoozed_until?) open / resolved / pending / snoozed.
- `chatwoot_toggle_priority` (conversation_id, priority) urgent, high, medium, low, or `none` to clear.
- `chatwoot_assign` (conversation_id, assignee_id? | team_id?) hand it to an agent or a team.
- `chatwoot_label_conversation` (conversation_id, labels) **replaces** the label set — send the full list.
- `chatwoot_create_conversation` (source_id, inbox_id, contact_id?, message?) start one on a contact's behalf; `source_id` comes from `chatwoot_contact`.
- `chatwoot_create_contact` (name?, email?, phone_number?, identifier?) · `chatwoot_update_contact` (id, …) only the fields you pass change.
- `chatwoot_label_contact` (id, labels) **replaces** a contact's label set.

## Anything else

There are no delete tools here by design — the token carries your full Chatwoot permissions, and an administrator's can wipe inboxes and contacts. For anything not covered above (including deletes), use the escape hatch. Its path is **relative to your account**, so it can't reach another account or the install-admin platform API:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"chatwoot","endpoint":"/request","input":{"method":"GET","path":"portals"}}'
```

## Safety

Default to reads. `chatwoot_reply` without `private: true` **sends a message to a real customer** — treat it like hitting send in the inbox: only on an explicit ask, and confirm the wording and the conversation first. Resolving, snoozing, assigning, and relabelling change someone's queue and are visible to your team, so confirm those too. Labelling replaces the whole set — read the current labels before writing.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=chatwoot` (no key needed).
