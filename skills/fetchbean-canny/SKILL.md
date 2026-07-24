---
name: "fetchbean-canny"
description: "Read and triage your Canny feedback through fetchbean (one key, with your Canny token held encrypted server-side instead of in config). Use when the user asks about their Canny boards, feature requests, bug reports, feedback, votes, roadmap, or changelog, or says 'my Canny' — for example listing top-voted requests, searching feedback, filing or updating a post, moving it along the roadmap, or publishing a changelog entry. Requires connecting Canny once in the fetchbean dashboard; calls before that return credential_required."
---

# Canny (via fetchbean)

Read and triage your Canny feedback boards through fetchbean. fetchbean holds your Canny API key encrypted server-side, so you call clean tools with your fetchbean key and never put a Canny token in config.

## Your workspace

This account's boards, categories, and tags — with the ids that writes need — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: filing, tagging, or recategorizing a post all take an id, and the cache lets you use board and category names directly. If it's absent, run **Personalize (once)** below. If a board, category, or tag is missing from it, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Canny once: open https://fetchbean.com/app, go to Connections, pick Canny, and paste your Canny secret API key (from your Canny admin → Settings → API). Optionally set an admin user id — the user new posts and status changes act as. fetchbean verifies and encrypts it.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run these once and write a compact `workspace.md` capturing the ids you'll reuse:

- `canny_boards` → each board's `name` → `id`
- `canny_categories` (once per board, passing `boardID`) → category `name` → `id`
- `canny_tags` (once per board, passing `boardID`) → tag `name` → `id`
- `canny_users` (a page) → note your own admin user's `id` if you'll author posts or change status

Write it compactly, stamped with today's date, like:

```
# Canny workspace · 2026-01-01
## Boards
- Feature Requests · id 111…
- Bugs · id 222…
## Categories · Feature Requests
- Billing · id c11…
- Mobile · id c22…
## Tags · Bugs
- regression · id t11…
## Acting user (authorID / changerID)
- Ada Lovelace · id u11…
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload on every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Canny account.

```bash
curl https://api.fetchbean.com/v1/canny_posts \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"status":"open","sort":"score","limit":20}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `canny_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"canny","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

- `canny_boards` () your boards (id, name, post count). The boardID everything else filters by.
- `canny_posts` (boardID?, search?, status?, sort?, limit?, skip?, tagIDs?) feedback posts — sort by `score`, `trending`, `newest`, or `statusChanged`. Statuses: open, under review, planned, in progress, complete, closed.
- `canny_post` (id) one post in full: details, status, score, author, tags.
- `canny_comments` (postID?, boardID?, limit?, skip?) comments on a post or board.
- `canny_votes` (postID?, boardID?, limit?) who voted on a post — the demand behind a request.
- `canny_users` (limit?, cursor?) users in your workspace (cursor-paginated).
- `canny_user` (id) one user by Canny id.
- `canny_tags` (boardID, limit?) a board's tags (pass their ids as `tagIDs` to filter posts).
- `canny_categories` (boardID, limit?) a board's categories.
- `canny_status_changes` (limit?, skip?) roadmap activity: every status move, newest first.
- `canny_changelog` (type?, sort?, limit?) your changelog entries (new, improved, fixed).

## Write tools

- `canny_create_post` (boardID, title, details, authorID?, categoryID?) file a request or bug.
- `canny_update_post` (postID, title?, details?) edit a post.
- `canny_change_status` (postID, status, changerID?, shouldNotifyVoters?, commentValue?) move a post along the roadmap. **Voters are only emailed when `shouldNotifyVoters` is true** — it defaults false, so a routine status move stays quiet.
- `canny_add_tag` / `canny_remove_tag` (postID, tagID) tag or untag a post.
- `canny_change_board` (postID, boardID) move a post to another board.
- `canny_change_category` (postID, categoryID) recategorize a post.
- `canny_create_comment` (postID, value, authorID?, internal?) reply on a post (`internal` keeps it team-only).
- `canny_upsert_user` (email?, name?, userID?) create or update a user, then use its id as an author.
- `canny_create_entry` (title, details, type?, published?, notify?, postIDs?) write a changelog entry. **Saves as a draft unless `published` is true**; `notify` emails subscribers.

## Anything else

Canny has no delete tools here by design — the key is workspace-wide, and a deleted post can't be recovered. For any endpoint not covered above (including deletes), use the raw escape hatch, which POSTs any Canny endpoint on your key:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"canny","endpoint":"/request","input":{"path":"companies/list","params":{}}}'
```

## Safety

Default to reads. Only file, edit, change status, comment, or publish a changelog entry when the user explicitly asks — confirm first. A status change with `shouldNotifyVoters` and a published changelog entry are both visible to your customers, so be deliberate.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=canny` (no key needed).
