---
name: "fetchbean-llms-txt"
description: "Create, audit, and maintain llms.txt navigation indexes with Fetchbean-assisted site discovery and link validation. Use when the user asks to 'create llms.txt', 'fix our llms.txt', 'audit llms.txt', 'add llms-full.txt', 'make an LLM site index', 'improve AI-readable docs', or reduce a giant endpoint/page dump into a compact linked index. Works for sites, docs portals, APIs, and repositories. Needs only a fetchbean key. Does not replace robots.txt, sitemap.xml, access controls, or conventional SEO, and does not guarantee model crawling or citations."
---

# Build a useful llms.txt (via fetchbean)

Turn a site's public surface into a compact Markdown navigation index. Use Fetchbean to find the site's canonical pages and verify links; write project files only when the user asks for implementation.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

There is nothing to connect. The tools used here run on managed credentials.

## Calling tools

Fetchbean's site-inspection tools use `POST https://api.fetchbean.com/v1/run` with provider `fetchbean`:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"fetchbean","endpoint":"/sitemap","input":{"url":"https://example.com","extract_links":true,"max_urls":500}}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it exposes four meta-tools (`discover`, `describe`, `run`, `request`), not native site tools. Over MCP, call `run` with `{"provider":"fetchbean","endpoint":"/sitemap"}`.

## Workflow

1. **Read what exists.** Check `/llms.txt`, `/llms-full.txt`, `robots.txt`, and `sitemap.xml`. Use `fetchbean /read` for text and `fetchbean /http/inspect` for status, content type, and redirects.
2. **Inventory the public surface.** Run `fetchbean /sitemap` on the site root. Read navigation or documentation indexes when no sitemap exists. Use `firecrawl_scrape` only when a page is a JavaScript shell or the first read warns that content is missing.
3. **Select authoritative entry points.** Prefer canonical overview, setup, concepts, API, examples, changelog, and support pages. Use `fetchbean /url/meta` when canonical URL or title is uncertain. Exclude private, duplicate, parameterized, redirected, thin, and obsolete pages.
4. **Write the main index.** Keep `/llms.txt` below 30,000 characters. Start with one `#` heading, optionally add one short blockquote, then group descriptive Markdown links under `##` headings. Aim for 10–30 high-signal links rather than a complete crawl.
5. **Split depth from navigation.** Put exhaustive endpoint lists or long-form context in `/llms-full.txt`, `/docs/llms.txt`, `/api/llms.txt`, or another focused file. Link every deeper file from the main index.
6. **Validate.** Confirm every link is absolute, canonical, reachable, and uniquely listed. Re-read the deployed `/llms.txt` after implementation and report character count, Markdown-link count, redirects, and failures.

## Format contract

```markdown
# Product name

> One factual sentence describing the product and audience.

## Start here

- [Overview](https://example.com/docs): What the product does and where to begin.
- [Getting started](https://example.com/docs/start): Minimum setup path.

## Reference

- [API documentation](https://example.com/api): Stable API contract and examples.
- [Full reference](https://example.com/llms-full.txt): Exhaustive material omitted from this index.

## Optional

- [Changelog](https://example.com/changelog): Recent behavior and compatibility changes.
```

Use linked labels plus short factual descriptions. Do not publish a prose-only file, bare-URL list, sitemap clone, or hundreds of inline endpoints as the main index.

## Validation checks

- Starts with one `#` heading.
- Contains Markdown links to deeper public resources.
- Is under 30,000 characters (`wc -m llms.txt`).
- Links use absolute HTTPS canonical URLs and return successful responses.
- Has no duplicate URLs, redirects, credentials, private routes, or marketing filler.
- Links to `llms-full.txt` or focused section files when exhaustive content exists.
- Remains complementary to `robots.txt` and `sitemap.xml`; it never claims to control crawlers.

## Safety

Site discovery and link validation are read-only. Do not edit, publish, deploy, or overwrite an existing file unless the user asked for implementation. Preserve hand-curated links unless evidence shows they are stale or redundant. Never include secrets, authenticated URLs, internal hostnames, or customer-only documentation.

Confirm the live tools any time with `GET https://api.fetchbean.com/discover?q=read%20a%20website%20sitemap` (no key needed).
