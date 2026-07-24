---
name: "fetchbean-fireflies"
description: "Access your Fireflies.ai meeting transcripts, summaries, action items, and soundbites through fetchbean (one key, with your Fireflies token held encrypted server-side instead of in config). Use when the user asks about their meetings, recordings, calls, transcripts, action items, or who said what, for example finding decisions from a call, pulling action items from a meeting, searching past meetings, or sharing a recording. Requires connecting Fireflies once in the fetchbean dashboard; calls before that return credential_required."
---

# Fireflies (via fetchbean)

Use Fireflies meeting data (transcripts, summaries, action items, soundbites) through fetchbean. fetchbean holds your Fireflies key encrypted server-side, so you call clean tools with your fetchbean key and never put a Fireflies token in config.

## Your workspace

Your channels (meeting folders) and team groups — with the ids that writes need — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: moving a meeting takes a `channel_id`, and the cache lets you use folder names directly. If it's absent, run **Personalize (once)** below. If a channel is missing from it, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Fireflies once: open https://fetchbean.com/app, go to Connections, pick Fireflies, and paste your Fireflies API key (from https://app.fireflies.ai/settings/developer-settings). fetchbean verifies and encrypts it.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md`:

- `fireflies_channels` → each channel (folder) `name` → `id` (needed to move meetings)
- `fireflies_user_groups` → team groups, if you use them
- `fireflies_user` → note your account email

Write it compactly, stamped with today's date, like:

```
# Fireflies workspace · 2026-01-01
## Channels (channel_id for move_meeting)
- Sales Calls · id 111…
- Standups · id 222…
## Account
- you@example.com
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload on every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. Your Fireflies usage is billed to your own Fireflies account.

```bash
curl https://api.fetchbean.com/v1/fireflies_search_transcripts \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":"pricing","limit":5}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `fireflies_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"fireflies","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

- `fireflies_search_transcripts` (query?, from_date?, to_date?, participants?, limit?) search meetings by keyword, date, and participant.
- `fireflies_recent_meetings` (days?, limit?) your meetings from the last N days (default 7).
- `fireflies_transcript` (transcript_id, include_sentences?) full transcript with summary, keywords, and action items.
- `fireflies_action_items` (transcript_id) just the action items and outline.
- `fireflies_ai_app_outputs` (transcript_id?, app_id?, limit?) outputs from Fireflies AI Apps.
- `fireflies_soundbites` (transcript_id?, mine?, my_team?, limit?) shareable audio and transcript clips.
- `fireflies_active_meetings` () meetings currently in progress.
- `fireflies_analytics` (start_time?, end_time?) team and per-user conversation metrics.
- `fireflies_channels` () and `fireflies_channel` (channel_id) folders and their membership.
- `fireflies_contacts` () contacts sorted by recent meeting activity.
- `fireflies_user_groups` (mine?) team structure and group membership.
- `fireflies_user` () the connected Fireflies account.
- `fireflies_rule_executions` (limit?, cursor?, logs_per_meeting?, filters?) automation rule execution logs grouped by meeting (Enterprise plans).

## Write tools

- `fireflies_update_meeting_title` (transcript_id, title) rename a meeting.
- `fireflies_share_meeting` (transcript_id, emails[], expiry_days?) share with email addresses.
- `fireflies_revoke_meeting_access` (transcript_id, email) remove a previously granted share.
- `fireflies_move_meeting` (transcript_id or transcript_ids[], channel_id) move meetings to a channel.
- `fireflies_create_soundbite` (transcript_id, start_time, end_time, name?) clip a soundbite.

## Anything else

For any Fireflies query or mutation not covered above, run raw GraphQL through fetchbean:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"fireflies","endpoint":"/graphql","input":{"query":"query { user { email num_transcripts } }"}}'
```

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=fireflies` (no key needed).
