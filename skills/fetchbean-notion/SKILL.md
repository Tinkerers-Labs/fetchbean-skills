---
name: "fetchbean-notion"
description: "Read and write your Notion workspace through fetchbean (one key, connected by OAuth so no token lives in your config). Use when the user asks about their Notion pages, docs, databases, notes, or wiki, or says 'my Notion' — for example searching the workspace, reading a page as markdown, querying a database, creating a page, or appending content. Requires connecting Notion once in the fetchbean dashboard (one click, pick the pages to share); calls before that return credential_required."
---

# Notion (via fetchbean)

Read and write your Notion pages and databases through fetchbean. fetchbean holds your Notion access token encrypted server-side, so you call clean tools with your fetchbean key and never put a Notion token in config.

## Your workspace

Your databases — with the ids that `query_database` and `create_page` need — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: you can query or add to a database by name without a search. If it's absent, run **Personalize (once)** below. If a database is missing, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Notion once: open https://fetchbean.com/app, go to Connections, pick Notion, and click connect. Notion authorizes by OAuth — **you choose which pages the integration can see**, so a tool only ever reaches pages you shared. There is no key to paste.

A tool call before connecting returns a `credential_required` error. If a specific page or database 404s, it usually wasn't shared with the integration — reconnect and add it.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md`:

- `notion_search` with `{"filter":"database"}` → each database's `title` → `id`
- `notion_users` (optional) → people's `name` → `id`, for mentions or people-property values

Write it compactly, stamped with today's date, like:

```
# Notion workspace · 2026-01-01
## Databases
- Tasks · id 111…
- CRM · id 222…
## People
- Ada Lovelace · id u11…
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Notion workspace.

```bash
curl https://api.fetchbean.com/v1/notion_search \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":"onboarding","filter":"page"}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `notion_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"notion","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## The usual flow

`notion_search` to find a page or database id → `notion_read_page` for a page's text, or `notion_query_database` for a database's rows. Ids returned by search (or cached in `workspace.md`) are what every other tool takes.

## Read tools

- `notion_search` (query?, filter?, page_size?, start_cursor?) full-text search across pages and databases. `filter` is `page` or `database` to narrow the object type.
- `notion_read_page` (page_id) the whole page as markdown — recursively flattens the block tree. Use this to actually read a doc.
- `notion_page` (page_id) one page's properties + metadata (not its body — use `read_page` for content).
- `notion_database` (database_id) a database's schema: title and properties.
- `notion_query_database` (database_id, filter?, sorts?, page_size?, start_cursor?) query a database's rows with filter/sorts. One page of results; paginate with `start_cursor`.
- `notion_users` (page_size?, start_cursor?) the workspace's people and bots.

## Write tools

- `notion_create_page` (parent, properties, children?) create a page under a parent page or database. `children` is block content.
- `notion_append_blocks` (block_id, children) append blocks to a page (or a block's children).
- `notion_comment` (parent? or discussion_id?, body? or rich_text?) comment on a page (via `parent`) or an existing discussion (via `discussion_id`).

## Anything else

For any Notion endpoint not covered above, call it directly through fetchbean (host pinned to api.notion.com):

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"notion","endpoint":"/request","input":{"path":"/v1/users/me","method":"GET"}}'
```

## Safety

Default to reads. `notion_create_page`, `notion_append_blocks`, and `notion_comment` write to your workspace — only on an explicit ask, and confirm the target page/database first.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=notion` (no key needed).
