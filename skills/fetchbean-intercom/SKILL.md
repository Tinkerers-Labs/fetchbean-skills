---
name: "fetchbean-intercom"
description: "Work your Intercom inbox through fetchbean (one key, with your Intercom token held encrypted server-side instead of in config). Use when the user asks about their Intercom conversations, support inbox, customer chats, contacts, leads, companies, tickets, or help center articles, or says 'my Intercom' — for example searching open conversations, reading a thread, replying as a teammate, leaving an internal note, closing or snoozing, assigning, tagging, filing a ticket, or finding the article to send someone. Requires connecting Intercom once in the fetchbean dashboard; calls before that return credential_required."
---

# Intercom (via fetchbean)

Work your Intercom conversations, contacts, and help center through fetchbean. fetchbean holds your Intercom access token encrypted server-side, so you call clean tools with your fetchbean key and never put an Intercom token in config.

## Your workspace

Your teammates, teams, tags, ticket types, and searchable attributes are cached in **`workspace.md`** beside this file. **If it's present, read it first**: assigning takes an admin or team id, tagging takes a tag id, filing a ticket takes a ticket type id, and search queries have to name real attribute fields. If it's absent, run **Personalize (once)** below. If something's missing, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Intercom once: open https://fetchbean.com/app, go to Connections, pick Intercom, paste an access token (Developer Hub → your app → Configure → Authentication), and choose your **data region** (US / EU / Australia — a workspace lives in exactly one, and the other two reject its token). The **admin id** your replies act as is resolved automatically at connect.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md`:

- `intercom_admins` → each teammate's `name` → `id` (what assign takes; yours is the default author)
- `intercom_teams` → each team's `name` → `id`
- `intercom_tags` → each tag's `name` → `id`
- `intercom_ticket_types` → each type's `name` → `id`
- `intercom_data_attributes` with `{"model":"contact"}` → your custom attribute names, so searches use real fields

Write it compactly, stamped with today's date, like:

```
# Intercom workspace · 2026-01-01
## Teammates (assignee_id)
- Ada Lovelace · id 5017690 (me)
## Teams
- Billing · id 8342
## Tags
- vip · id 7522907
## Ticket types
- Bug · id 42
## Contact attributes
- plan, mrr, signup_source
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Intercom workspace.

```bash
curl https://api.fetchbean.com/v1/intercom_search_conversations \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":{"field":"open","operator":"=","value":"true"},"per_page":25}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `intercom_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"intercom","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Search is the workhorse

`intercom_search_conversations`, `intercom_search_contacts`, and `intercom_search_tickets` all take the same shape: `query` is either `{field, operator, value}` or `{operator:"AND"|"OR", value:[…]}`, and pagination is `per_page` (≤150) + the `starting_after` cursor. Reach for these over the plain list tools — listing is newest-first with no filters. Field names come from `intercom_data_attributes`.

## Read tools

- `intercom_conversations` (per_page?, starting_after?) · `intercom_search_conversations` (query, per_page?, starting_after?) the inbox.
- `intercom_conversation` (conversation_id, display_as?) one conversation, full thread, plaintext bodies by default.
- `intercom_contacts` (per_page?, starting_after?) · `intercom_search_contacts` (query, …) users and leads.
- `intercom_contact` (id) · `intercom_contact_notes` (id) · `intercom_contact_segments` (id) one person in depth.
- `intercom_events` (email? | user_id? | intercom_user_id?, summary?) what a person actually did in your product.
- `intercom_companies` (name?, company_id?, tag_id?, segment_id?, page?) · `intercom_company` (id) · `intercom_company_contacts` (id) accounts.
- `intercom_admins` () · `intercom_teams` () · `intercom_tags` () · `intercom_segments` () the ids writes take.
- `intercom_data_attributes` (model?) the fields available on contacts, companies, or conversations — the vocabulary searches use.
- `intercom_articles` (page?, per_page?) · `intercom_article` (id) · `intercom_search_articles` (phrase, state?) find the help center article to send before writing a reply.
- `intercom_search_tickets` (query, …) · `intercom_ticket` (id) · `intercom_ticket_types` ().
- `intercom_me` () the admin and workspace this connection acts as.

## Write tools

Every write acts as your connected teammate; pass `admin_id` to act as someone else.

- `intercom_reply` (conversation_id, body) **a customer-visible reply**.
- `intercom_note` (conversation_id, body) an internal note the customer never sees. Accepts some HTML.
- `intercom_close` (conversation_id, body?) · `intercom_reopen` (conversation_id) · `intercom_snooze` (conversation_id, snoozed_until) — `snoozed_until` is a unix timestamp.
- `intercom_assign` (conversation_id, assignee_id, type?) route to a teammate, or a team with `type: "team"`. `assignee_id` `0` unassigns.
- `intercom_tag_conversation` (conversation_id, tag_id) · `intercom_tag_contact` (id, tag_id) tags must already exist.
- `intercom_create_note` (id, body) context on a person that follows them across conversations.
- `intercom_create_contact` (role, email?, external_id?, name?, …) · `intercom_update_contact` (id, …) only the fields you pass change.
- `intercom_create_ticket` (ticket_type_id, contacts, ticket_attributes?) `contacts` is `[{id}]` or `[{email}]`.

## Anything else

There are no delete tools here by design — the token can hard-delete contacts and conversations. For anything not covered above (including deletes, news items, and help center collections), use the escape hatch, which stays pinned to the same API version:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"intercom","endpoint":"/request","input":{"method":"GET","path":"/help_center/help_centers"}}'
```

## Safety

Default to reads. `intercom_reply` **sends a message to a real customer** — treat it like hitting send in the inbox: only on an explicit ask, and confirm the wording and the conversation first (`intercom_note` is the safe choice for anything internal). Closing, snoozing, assigning, and tagging change your team's queue, and creating a ticket can notify the customer, so confirm those too.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=intercom` (no key needed).
