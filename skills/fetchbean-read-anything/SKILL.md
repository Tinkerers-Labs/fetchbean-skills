---
name: "fetchbean-read-anything"
description: "Read any URL properly through fetchbean and know when a page needs more than a plain fetch. Use when a fetch or web read came back 403, a bot check, a captcha, an empty JavaScript shell, or obvious navigation chrome instead of the article, and when the user asks to read, open, summarise or extract a page, a PDF, an RSS or Atom feed, a JSON endpoint, or a whole site's pages. Also use for pages the built-in reader routinely fails on — x.com, Reddit, LinkedIn, Instagram and other client-rendered sites. Needs only a fetchbean key, nothing to connect. Not for ordinary public pages the built-in WebFetch already handles cleanly."
---

# Read anything on the web (via fetchbean)

A ladder for getting the actual content of a URL, cheapest rung first. The point of this skill is knowing **which rung to start on and when to climb**, because the common failures are paying for a browser you didn't need, or accepting a bot wall as if it were the article.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

There is nothing to connect. Every tool here runs on a managed credential, so the fetchbean key is all you need.

## Calling tools

Most tools are `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call.

**fetchbean's own tools are the exception**: they have no `/v1/<name>` route and go through the generic runner instead, as `{"provider":"fetchbean","endpoint":"<endpoint>"}`. Those are written below as `fetchbean /endpoint`.

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"fetchbean","endpoint":"/read","input":{"url":"https://en.wikipedia.org/wiki/Apollo_11"}}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these natively — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"fetchbean","endpoint":"/read"}`.

## The ladder

**1. `fetchbean /read` (url, max_chars?) — start here, always.**

It fetches the URL and returns what it actually turned out to be, in a `kind` field:

- `html` — the article's prose with navigation, header, footer and scripts stripped, plus `links`
- `json` — parsed, in `data` (it sniffs past a wrong `content-type`)
- `feed` — RSS or Atom reduced to `items` of `{title, link, published, summary}`
- `text` — plain text as-is
- `api` — the page was read through the site's **own API** instead of scraped, because that returns the content rather than the chrome. `resolved_via` names the endpoint it actually called
- `binary` — not readable text; it describes the file rather than mangling it

A 4xx or 5xx **throws** rather than handing back an error page as content.

**2. Read the `warning` field before you trust the content.**

When the fetch succeeded but the body isn't the content — a captcha, a bot check, a page that renders client-side — `warning` says so. That is the signal to climb, and the only reliable one: the markup of a bot wall looks like a successful read.

**3. `jina_read` (url, format?) or `firecrawl_scrape` (url, formats?, onlyMainContent?) — when there's a warning.**

Both drive a real browser, so they get pages that need JavaScript. Use them **when rung 1 warned**, not by default — they cost more and are slower. `firecrawl_scrape` with `onlyMainContent: true` is the closest equivalent to rung 1's article extraction.

**4. `tikhub` — for social platforms.**

x.com, Instagram, TikTok and friends actively block readers; a browser renderer often isn't enough either. Run `GET https://api.fetchbean.com/discover?q=<platform>` to find the right tool.

## Around the edges

- `fetchbean /url/meta` (url) — title, full meta tags, OpenGraph and Twitter cards, JSON-LD, icons, canonical. Use this when you want **what the page says about itself** rather than its text: previewing a link, checking a share card, pulling structured data. It also handles non-HTML gracefully, reporting size, filename and last-modified.
- `fetchbean /http/inspect` (url, method?) — status, headers and redirect chain, no body parsing. For "is this up", "where does this redirect to", "what's the content type".
- `fetchbean /sitemap` (url, extract_links?, max_urls?) — every page a site publishes. The way to answer "read their whole docs" or "how many blog posts do they have": get the URL list here, then `fetchbean /read` the ones you want.
- `fetchbean /youtube/transcript` (url, lang?) — a video's transcript, which is the readable form of a YouTube link.
- `exa_search` (query, numResults?, type?) / `tavily_search` (query, ...) / `jina_search` (q) / `firecrawl_search` (query, limit?) — when you don't have a URL yet. `tavily_search` with `include_answer` gives a direct answer; `exa_search` is strongest at finding sources to then read.

## Worked pattern

> "Summarise this blog post" → `fetchbean /read`. `kind: "html"`, no warning, done in one call.
>
> "Summarise this SPA dashboard page" → `fetchbean /read` returns `warning: "…renders client-side"` → `firecrawl_scrape` with `onlyMainContent: true`.
>
> "What's on their engineering blog this year" → `fetchbean /sitemap` for the URL list → filter by path or date → `fetchbean /read` each one you want.
>
> "Read this arXiv paper" → `fetchbean /read` returns `kind: "api"` with the abstract, having routed to arXiv's export API. For the full text, use the `pdf_url` it gives you.

## Notes

Everything here is read-only, so there is nothing to confirm before calling. The costs to watch are credits and latency, not damage: rung 1 answers most pages in one call, and climbing when there was no warning just spends more for the same text.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=read%20a%20url` (no key needed).
