---
name: "fetchbean-plain"
description: "Work with your Plain support inbox through fetchbean — threads, conversations, customers, replies, internal notes, labels, assignment and priority, plus the B2B side: tenants, companies, and the tiers and SLAs that decide what response a customer is owed. Use when the user asks about their support queue, an open ticket, what a customer said, who a thread is assigned to, which account a customer belongs to, or what response time a customer is entitled to, and when they say 'my Plain', 'our support inbox', 'the ticket from', 'reply to that customer', or 'what's in the queue'. Requires connecting Plain once in the fetchbean dashboard; calls before that return credential_required."
---

# Plain support inbox (via fetchbean)

Work with your Plain support inbox through fetchbean. fetchbean holds your Plain API key encrypted server-side, so you call clean tools with your fetchbean key and never put a Plain token in config.

## Your workspace

This workspace's label types, tiers and snippets — with the ids that writes need — are cached in `workspace.md` beside this file. If it's present, read it first: `plain_add_labels` takes label **type** ids you cannot guess, and `plain_set_tier` takes a tier id or external id. If absent, run Personalize below. If an id you need is missing, it's stale — re-run.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

Connect Plain once: open https://fetchbean.com/app → Connections → pick Plain → paste your Plain API key (Settings → Machine Users → your machine user → Add API Key, at https://app.plain.com/settings/machine-users). fetchbean verifies and encrypts it.

A tool call before connecting returns a `credential_required` error.

Plain's permissions are per-key and granular, so a narrowly scoped key can 403 on individual tools. `plain_me` returns the exact permission list your key holds — run it first if a tool refuses.

## Personalize (once) — delete this section after running

Skip if `workspace.md` exists. Otherwise run `plain_me`, `plain_label_types`, `plain_tiers` and `plain_snippets` once and write a compact `workspace.md` beside this file, stamped with today's date:

```
# Plain workspace — 2026-08-22
Workspace: Acme (w_123) · permissions: thread:read, thread:edit, …
Label types: bug (lt_1) · billing (lt_2) · feature-request (lt_3)
Tiers: enterprise (ti_9, first response 60m) · standard (ti_4, first response 480m)
Snippets: refund-approved (sn_2) · asking-for-logs (sn_5)
```

Then remove this whole section from this SKILL.md — heading to the next `##` — so it doesn't reload every use. Leave Your workspace above.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call.

```bash
curl https://api.fetchbean.com/v1/plain_threads \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"status":"TODO","first":20}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these as native `plain_*` tools — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"plain","endpoint":"<endpoint>"}`.

## Read tools

**The inbox**
- `plain_threads` (first?, after?, status?, is_assigned?, assigned_to_user?, priority?, customer_id?, label_type_ids?) — the queue. `status` is TODO, SNOOZED or DONE. Start here.
- `plain_thread` (thread_id) — one thread in full: status, priority, assignee, labels, tenant, tier.
- `plain_search_threads` (query, first?, status?) — free text across threads, minimum 2 characters.
- `plain_thread_timeline` (thread_id, first?, after?, messages_only?, entry_types?) — what was actually said, oldest first. Each entry carries Plain's own `llmText` rendering, so it drops straight into a prompt. **This is the tool for "what did the customer say".**

**People and accounts**
- `plain_customers` (first?, after?, filters?) · `plain_customer` (id? | email? | external_id?) · `plain_search_customers` (query, first?)
- `plain_tenants` / `plain_search_tenants` — the accounts, teams or workspaces customers belong to.
- `plain_companies` / `plain_search_companies` — companies, with tier, contract value and account owner.
- `plain_tiers` (first?, after?) — support tiers **with their SLAs attached**: first-response and next-response targets in minutes, which priorities they apply to, and whether they run 24/7 or only in business hours. This is how you answer "what response is this customer owed".
- `plain_label_types` (first?, include_archived?) — the `label_type_ids` that `plain_add_labels` needs.
- `plain_snippets` (first?, after?) — the team's saved replies. **Read these before drafting a reply** so the wording matches what the team already agreed on.
- `plain_me` () — the workspace this key is scoped to, and the permissions it holds.

## Write tools

**Customer-visible — these reach a real person**
- `plain_reply_to_thread` (thread_id, text, markdown?) — replies on whichever channel the customer used (email, chat, Slack).
- `plain_send_email` (customer_id, subject, text, markdown?, thread_id?, cc?, bcc?) — outbound email. Without `thread_id` it opens a new thread, which is how you reach out first rather than answering. Takes a `customer_id` only, so resolve an address with `plain_customer` first.

**Internal**
- `plain_create_note` (customer_id, text, thread_id?, markdown?) — never visible to the customer. With a `thread_id` it pins to that thread; without one it follows the customer across all of theirs.
- `plain_update_note` (note_id, text) · `plain_delete_note` (note_id) — delete is a soft delete; the note stays on the record as removed.
- `plain_set_thread_status` (thread_id, status, duration_seconds?) — TODO, DONE or SNOOZED.
- `plain_assign_thread` (thread_id, user_id? | machine_user_id?) — with no user it unassigns.
- `plain_change_thread_priority` (thread_id, priority) — 0 urgent to 3 low.
- `plain_add_labels` (thread_id, label_type_ids) — takes label **type** ids from `plain_label_types`.
- `plain_remove_labels` (label_ids) — takes the label id off the thread (from `plain_thread`), **not** the label type id used to add it.
- `plain_create_thread` (customer_id? | email? | customer_external_id?, title?, priority?, …) — opens an empty thread; put the first message on it with `plain_send_email` or `plain_reply_to_thread`.

**Accounts**
- `plain_upsert_customer` · `plain_upsert_tenant` (external_id, name) · `plain_upsert_company` (domain, name) — create or update, keyed on the ids your own backend uses.
- `plain_set_customer_tenants` — replaces the customer's whole tenant membership set.
- `plain_set_tier` — moves one company or tenant into a tier, which is what applies that tier's SLAs. Omit the tier to take them out of one.

## Anything else

`plain_graphql` (query, variables?) runs any Plain GraphQL query or mutation on your key, for what the curated tools don't reach — tasks, discussions, the help center, webhook targets, events. Schema at `https://core-api.uk.plain.com/graphql/v1/schema.graphql`.

```bash
curl https://api.fetchbean.com/v1/plain_graphql \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" -H "Content-Type: application/json" \
  -d '{"query":"query { myWorkspace { id name } }"}'
```

## Safety

Default to reads. `plain_reply_to_thread` and `plain_send_email` **reach a real customer** — draft, show the user, and only send when they explicitly say to. A note is the safe way to leave something for the team.

`plain_set_customer_tenants` and `plain_set_tier` replace rather than add: they will silently remove memberships you didn't list. Changing a tier changes which SLAs apply to that account's threads.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=plain` (no key needed).
