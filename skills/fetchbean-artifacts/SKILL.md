---
name: "fetchbean-artifacts"
description: "Publish a web page and get a shareable link, from any agent, through fetchbean. Use when the user wants to share a report, dashboard, chart, slides, landing page, write-up, or small interactive app as a URL a human can open in a browser — 'publish this', 'give me a shareable link', 'make a page/report/dashboard I can send', 'host this'. Works the same in Claude Code, Codex, Cursor, or any agent (unlike a host's built-in artifacts), because it's just a fetchbean API call. Needs only a fetchbean key — no connection or credential to set up."
---

# Artifacts (via fetchbean)

Publish a rendered page — markdown or interactive HTML — to a fetchbean URL a human opens in a browser, and get the link back. fetchbean handles styling (Tailwind + a base stylesheet) and hosting; you send the content.

**Why this over a host's native artifacts:** it's a plain API call, so it works identically in **any** agent — Claude Code, Codex, Cursor, a custom harness — not just ones with a built-in artifact panel. The URL is persistent and shareable, versioned, and you manage it (update, roll back, make private, delete) from the same tools.

## Setup (once)

Just a fetchbean key — artifacts are hosted by fetchbean, so there's **no service to connect** and no `credential_required`.

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key   # from https://fetchbean.com/app
chmod 600 ~/.config/fetchbean/key
```

## Calling tools

Artifacts are first-party fetchbean endpoints, called through the generic primitive: `POST https://api.fetchbean.com/v1/run` with `{"provider":"fetchbean","endpoint":"/artifacts…","input":{…}}`. JSON in and out.

Publish a page (returns `{ id, url, … }` — give the `url` to the user):

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"fetchbean","endpoint":"/artifacts","input":{
        "title":"Q3 report","type":"md","content":"# Q3\n\nRevenue up 12%…"}}'
```

`type` is one of `md` (markdown), `html` (full interactive page), `react`, `mermaid` (a diagram), or `code`. `visibility` is `unlisted` (default — anyone with the link) or `private` (your org only). `ttl` is `1h` | `24h` | `7d` | `never` (default `24h`).

Over MCP the same thing is `run` with `{"provider":"fetchbean","endpoint":"/artifacts","input":{…}}` — the MCP server exposes four meta-tools (`discover`, `describe`, `run`, `request`), not native artifact tools.

## Create and edit

- `/artifacts` (title, type, content, visibility?, ttl?) — publish a new page. Returns the shareable `url`.
- `/artifacts/update` (id, content, title?) — replace the body in place (same URL); the prior version is kept.
- `/artifacts/patch` (id, edits, replace_all?, title?) — find/replace edits instead of resending the whole body; best for small changes to a large page. `edits` is a list of `{old_string, new_string}`.
- `/artifacts/rollback` (id, version_id?) — restore a prior version (defaults to the last), same URL. Non-destructive.

## Manage

- `/artifacts/list` () — your artifacts (id, url, title, type, visibility, expiry, views).
- `/artifacts/get` (id) — one artifact in full, including its current content.
- `/artifacts/versions` (id) — the version timeline (version id, title, saved-at).
- `/artifacts/visibility` (id, visibility) — switch between `unlisted` and `private`.
- `/artifacts/delete` (id) — permanently delete the artifact and its history.

## Safety

`unlisted` means **anyone with the link can open it** (no login) — don't publish secrets or private data that way; use `private` (your org only) if unsure. `/artifacts/delete` is permanent and takes the version history with it. Both writes only on an explicit ask.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=artifact` (no key needed).
