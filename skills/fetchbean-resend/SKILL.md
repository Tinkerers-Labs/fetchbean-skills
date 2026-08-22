---
name: "fetchbean-resend"
description: "Send and inspect email through your Resend account via fetchbean — send or schedule a message, check whether one was delivered, bounced or opened, read email received at your domain, manage templates, contacts, audiences and broadcasts, verify sending domains, and handle suppressions. Use when the user asks to email someone, whether a message arrived, why an email bounced or landed in spam, what was sent to a customer, whether a domain is verified, or wants to schedule or cancel a send, and when they say 'my Resend', 'our transactional email', 'did that email go out', or 'send them an email'. Requires connecting Resend once in the fetchbean dashboard; calls before that return credential_required."
---

# Resend email (via fetchbean)

Send and inspect email through your Resend account via fetchbean. fetchbean holds your Resend authorization encrypted server-side, so you call clean tools with your fetchbean key and never put a Resend token in config.

## Your workspace

This account's verified domains, audiences and templates — with the ids that writes need — are cached in `workspace.md` beside this file. If it's present, read it first: a send fails unless the from-address is on a verified domain, and a broadcast needs an audience id. If absent, run Personalize below. If something's missing, it's stale — re-run.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

Connect Resend once: open https://fetchbean.com/app → Connections → pick Resend → click connect. There is no key to paste.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip if `workspace.md` exists. Otherwise run `resend_domains`, `resend_templates` and `resend_segments` once and write a compact `workspace.md` beside this file, stamped with today's date:

```
# Resend — 2026-08-22
Domains: acme.com (verified, dm_1) · mail.acme.com (pending, dm_2)
Send from: hello@acme.com, support@acme.com
Templates: welcome (tp_4, published) · receipt (tp_9, draft)
Segments/audiences: all-users (sg_1) · beta (sg_2)
```

Then remove this whole section from this SKILL.md — heading to the next `##` — so it doesn't reload every use. Leave Your workspace above.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call.

```bash
curl https://api.fetchbean.com/v1/resend_emails \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" -d '{}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these as native `resend_*` tools — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"resend","endpoint":"<endpoint>"}`.

## Read tools

**Did it arrive**
- `resend_emails` () — sent email with each one's latest delivery event. Start here for "did that go out".
- `resend_email` (id) — one message in full: content, tags, schedule, and its latest delivery event (delivered, bounced, complained, opened).
- `resend_email_metrics` () — account-level delivery numbers.
- `resend_logs` () — request-level logs, for when a send didn't happen at all.

**Inbound**
- `resend_received_emails` () · `resend_received_email` (id) — email received at your domain, with its content.

**Setup and audience**
- `resend_domains` () · `resend_domain` (id) — sending domains and their verification state. **An unverified domain is the usual reason a send is refused.**
- `resend_templates` () · `resend_template` (id) — only a published template can be used in a send.
- `resend_contacts` () · `resend_contact` (id) · `resend_segments` () · `resend_topics` ()
- `resend_broadcasts` () · `resend_broadcast` (id)
- `resend_suppressions` () — addresses that will silently receive nothing. **Check here before investigating "they never got it".**
- `resend_webhooks` ()

## Write tools

**Reaches real inboxes**
- `resend_send_email` — sends or schedules one message. Resend validates the sender, recipients, content, template, attachments and quota.
- `resend_batch_emails` — many at once, through Resend's batch API.
- `resend_send_broadcast` (id) — sends a broadcast **to an entire audience**. This is the largest-blast-radius tool here.
- `resend_update_email` (id) / `resend_cancel_email` (id) — only work while a message is still scheduled. Once sent, neither does anything.

**Content and audience**
- `resend_create_template`, `resend_update_template`, `resend_publish_template`
- `resend_create_contact`, `resend_update_contact`, `resend_delete_contact`
- `resend_create_segment`, `resend_create_topic`
- `resend_add_suppression` — stops mail to an address. `resend_remove_suppression` — **starts it again**, which usually undoes an unsubscribe or a bounce.

**Domains and plumbing**
- `resend_create_domain`, `resend_update_domain`, `resend_verify_domain`
- `resend_create_webhook`

## Anything else

Resend has no raw passthrough tool of its own. For anything the tools above don't name, use the generic runner, which takes a provider and one of its endpoints:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" -H "Content-Type: application/json" \
  -d '{"provider":"resend","endpoint":"/emails","input":{}}'
```

Endpoints come from `GET https://api.fetchbean.com/discover?q=resend`. If Resend supports something fetchbean doesn't model at all, that's a tool request (`POST /v1/request`), not a call you can improvise.

## Safety

Default to reads. Only send when the user explicitly asks — draft it, show them, then send.

- `resend_send_email` and `resend_batch_emails` deliver immediately unless scheduled, and there is no recall once delivered. Scheduling buys you `resend_cancel_email`; sending does not.
- `resend_send_broadcast` mails an entire audience. Confirm the audience and its size before calling it, not after.
- `resend_remove_suppression` re-enables mail to someone who unsubscribed or hard-bounced. Continuing to mail those addresses damages domain reputation as well as being unwanted — confirm the user means it.
- `resend_delete_contact` is permanent.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=resend` (no key needed).
