---
name: "fetchbean-loops"
description: "Work with your Loops lifecycle email through fetchbean — contacts and their properties, mailing lists and audience segments, marketing campaigns, transactional emails, events that trigger automations, and multi-step workflows. Use when the user asks who is on a list, whether someone is subscribed or suppressed, what a campaign said or when it sends, why an onboarding or drip email did or didn't fire, or wants to add a contact, send a transactional email, or trigger an event, and when they say 'my Loops', 'our onboarding emails', 'the welcome sequence', 'the drip', or 'lifecycle email'. Requires connecting Loops once in the fetchbean dashboard; calls before that return credential_required."
---

# Loops lifecycle email (via fetchbean)

Work with your Loops account through fetchbean. fetchbean holds your Loops API key encrypted server-side, so you call clean tools with your fetchbean key and never put a Loops token in config.

## Your workspace

This account's mailing lists, transactional emails and contact properties — with the ids that writes need — are cached in `workspace.md` beside this file. If it's present, read it first: sending a transactional email needs its id, and setting a contact property needs the property to already exist. If absent, run Personalize below. If something's missing, it's stale — re-run.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

Connect Loops once: open https://fetchbean.com/app → Connections → pick Loops → paste your Loops API key (Loops → Settings → API, at https://app.loops.so/settings?page=api). fetchbean verifies and encrypts it.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip if `workspace.md` exists. Otherwise run `loops_account`, `loops_mailing_lists`, `loops_contact_properties` and `loops_published_transactional_emails` once and write a compact `workspace.md` beside this file, stamped with today's date:

```
# Loops — 2026-08-22
Team: Acme
Mailing lists: product-updates (ml_1) · beta (ml_2)
Contact properties: plan (string) · signupSource (string) · seats (number)
Transactional (published): welcome (tr_9) · password-reset (tr_3) · invoice-failed (tr_7)
```

Then remove this whole section from this SKILL.md — heading to the next `##` — so it doesn't reload every use. Leave Your workspace above.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call.

```bash
curl https://api.fetchbean.com/v1/loops_contact \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com"}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these as native `loops_*` tools — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"loops","endpoint":"<endpoint>"}`.

## Read tools

**People**
- `loops_contact` (email or userId) — find one contact. Start here for "is X subscribed", "what plan is X on".
- `loops_contact_suppression` () — whether a contact is suppressed. **Check this before wondering why someone stopped receiving mail**; a suppressed contact silently gets nothing.
- `loops_contact_properties` () — the custom properties this account defines. A property must exist before you can set it.
- `loops_mailing_lists` () · `loops_audience_segments` () · `loops_audience_segment` (audienceSegmentId)

**Campaigns and content**
- `loops_campaigns` () · `loops_campaign` (campaignId) · `loops_campaign_groups` () · `loops_campaign_group` (campaignGroupId)
- `loops_transactional_emails` () · `loops_published_transactional_emails` () · `loops_transactional_email` — the ids `loops_send_transactional_email` needs. Only published ones can be sent.
- `loops_transactional_groups` () · `loops_transactional_group`
- `loops_email_message` · `loops_check_email_message` — the message body behind a campaign, and a validity check on it.
- `loops_components` () · `loops_component` (componentId) — reusable blocks. `loops_themes` () · `loops_theme`
- `loops_dedicated_sending_ips` ()

**Automation**
- `loops_workflows` () · `loops_workflow` · `loops_workflow_node` — the multi-step sequences and their individual steps. This is where "why didn't the drip fire" is answered.
- `loops_event_patterns` () · `loops_event_pattern` · `loops_event_pattern_by_name` — the events workflows listen for. **Check the pattern exists before sending an event**, or the event lands and triggers nothing.
- `loops_account` () — tests the connected key and returns its team.

## Write tools

**Reaches real people**
- `loops_send_transactional_email` — sends immediately to the address given, using a published transactional email id.
- `loops_send_event` — records an event for a contact, which **can trigger a workflow that emails them**. Sending an event is not a quiet operation.
- `loops_create_campaign` / `loops_update_campaign` — creates a **draft**; scheduling or sending it is done in the Loops UI.

**Contacts**
- `loops_create_contact` · `loops_update_contact` (updates or creates) · `loops_delete_contact`
- `loops_remove_contact_suppression` — **re-enables mail to someone who was suppressed.** Suppression usually exists because they unsubscribed or bounced; removing it can mail someone who asked not to be mailed.
- `loops_create_contact_property`

**Content** — `loops_create_transactional_email`, `loops_update_transactional_email`, `loops_ensure_transactional_draft`, `loops_publish_transactional_email`, `loops_create_component`, `loops_update_component`, `loops_update_email_message`, `loops_preview_email_message`, `loops_create_theme`, `loops_update_theme`, `loops_create_campaign_group`, `loops_update_campaign_group`, `loops_create_audience_segment`, `loops_create_transactional_group`, `loops_update_transactional_group`, `loops_create_upload`, `loops_complete_upload`.

**Workflows** — `loops_create_workflow`, `loops_update_workflow`, `loops_change_workflow_mailing_list`, `loops_create_workflow_node`, `loops_add_workflow_branch`, `loops_update_workflow_node`, `loops_delete_workflow_node`, `loops_delete_workflow_nodes`.

## Anything else

Loops has no raw passthrough tool of its own. For anything the tools above don't name, use the generic runner, which takes a provider and one of its endpoints:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" -H "Content-Type: application/json" \
  -d '{"provider":"loops","endpoint":"/contact","input":{}}'
```

Endpoints come from `GET https://api.fetchbean.com/discover?q=loops`. If Loops supports something fetchbean doesn't model at all, that's a tool request (`POST /v1/request`), not a call you can improvise.

## Safety

Default to reads. Only send, trigger an event, or change a workflow when the user explicitly asks — confirm first.

Three things here reach real inboxes and cannot be recalled:

- `loops_send_transactional_email` sends the moment it is called.
- `loops_send_event` looks like bookkeeping but fires whatever workflow listens for that event, which usually means email. Check `loops_event_patterns` first to see what it will set off.
- `loops_remove_contact_suppression` undoes an unsubscribe or a bounce. Confirm the user genuinely intends to mail that person again.

Editing a live workflow changes what everyone currently in it receives next. `loops_delete_workflow_nodes` removes steps in bulk.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=loops` (no key needed).
