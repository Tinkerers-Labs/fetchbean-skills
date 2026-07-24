---
name: "fetchbean-buffer"
description: "Schedule and manage your Buffer social posts through fetchbean (one key, with your Buffer token held encrypted server-side instead of in config). Use when the user asks about their Buffer posts, social scheduling, publishing queue, channels/profiles, or post analytics, or says 'my Buffer' — for example queueing a post, scheduling to a channel, listing scheduled posts, or checking post performance. Requires connecting Buffer once in the fetchbean dashboard; calls before that return credential_required."
---

# Buffer (via fetchbean)

Schedule and manage your Buffer social posts through fetchbean. fetchbean holds your Buffer API key encrypted server-side, so you call clean tools with your fetchbean key and never put a Buffer token in config.

> Buffer's API has a tight monthly quota. Prefer the cached ids in `workspace.md` (below) over re-listing channels on every task, and batch where you can.

## Your workspace

Your organizations and channels (social profiles) — with the ids that posting needs — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: `create_post` needs a `channel_id`, and the cache lets you post to a channel by name without a lookup (which also saves your quota). If it's absent, run **Personalize (once)** below. If a channel is missing, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Buffer once: open https://fetchbean.com/app, go to Connections, pick Buffer, and paste your Buffer personal API key (from https://publish.buffer.com/developers/api). fetchbean verifies and encrypts it.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md`:

- `buffer_account` → your organizations, each with its `organizationId`
- `buffer_channels` (per organization) → each channel's `name`/`service` → `channel_id`

Write it compactly, stamped with today's date, like:

```
# Buffer workspace · 2026-01-01
## Organizations
- Acme · organizationId org_111…
## Channels · Acme
- @acme (twitter) · channel_id ch_111…
- Acme (linkedin) · channel_id ch_222…
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Buffer account.

```bash
curl https://api.fetchbean.com/v1/buffer_channels \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `buffer_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"buffer","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

- `buffer_account` () your Buffer account and its organizations (each with an `organizationId`).
- `buffer_channels` (organization_id?) connected channels (social profiles) — gives the `channel_id` posts need.
- `buffer_posts` (organization_id?, channel_ids?, status?, first?, after?) list posts (Relay-paginated); filter by channel or status.
- `buffer_post_metrics` (start, end, organization_id?, channel_ids?) aggregate post analytics over an ISO time window.

## Write tools

- `buffer_create_post` (channel_id, text, mode?, due_at?, tag_ids?, assets?) schedule a post. Needs a `channel_id` (from the cache or `buffer_channels`). `mode`: `addToQueue` (default queue slot), `shareNext` (front of queue), `shareNow` (publish immediately), `customScheduled` (with `due_at`).
- `buffer_update_post` (id, text?, mode?, due_at?, ...) edit a post by its id (from `buffer_posts`).
- `buffer_delete_post` (id) delete a post by its id.

## Anything else

Buffer's API is GraphQL; for anything not covered above, run a raw query through fetchbean:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"buffer","endpoint":"/request","input":{"query":"query { account { id email } }"}}'
```

## Safety

Default to reads. `buffer_create_post` with `mode: shareNow`, `buffer_update_post`, and `buffer_delete_post` change what publishes to real social channels — only on an explicit ask, and confirm the channel and text first. Deleting a post is not reversible.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=buffer` (no key needed).
