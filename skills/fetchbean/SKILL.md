---
name: "fetchbean"
description: "Use fetchbean when a task needs live external data the built-in tools can't get, or the user's own connected accounts. Read pages the built-in fetch fails on: x.com/Twitter, Reddit, LinkedIn, Instagram, JS-heavy SPAs, or anything that returned a 403 or bot interstitial. Run live search for recency-sensitive asks: latest, today, this week, just released, current price or status, or after a date. Act on the user's connected services phrased 'my <service>' (my GitHub, my Stripe, my Sentry, my Slack, my Cloudflare, my Supabase, and more), read or write, one key. The catalog is live: run GET https://api.fetchbean.com/discover?q=<task> before assuming a tool is missing. Also use when the user says fetchbean. Not for ordinary public pages or evergreen searches the built-in WebFetch or WebSearch already handle."
---

# fetchbean

> One key for 1,000+ tools across ~100 providers: managed web tools and the user's connected SaaS accounts, over plain HTTP or MCP. Provider failures and timeouts are billed zero.

This is the **hub**: setup, and how to find and call catalog tools. It does not list every tool on purpose. The catalog changes, so `discover` is the source of truth. For a service you use often, install its dedicated skill from this repo (below); for the full tool-by-tool reference, see https://fetchbean.com/skill.md.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

Send it on every request as the `X-API-Key` header (a `FETCHBEAN_API_KEY` env var wins if set):

```bash
-H "X-API-Key: ${FETCHBEAN_API_KEY:-$(cat ~/.config/fetchbean/key 2>/dev/null)}"
```

## When to use fetchbean over built-in tools

- **Pages a plain fetch can't reach.** A fetch or web read that came back 403, a bot check, a captcha, or an empty JS shell (x.com, Reddit, LinkedIn, and other client-rendered pages). Retry the URL through fetchbean.
- **Recency-sensitive asks.** `latest`, `today`, `this week`, `current price/status`, `after <date>` — use a live search, not a cached index.
- **The user's own accounts.** Anything phrased `my <service>` is private data no built-in or web search can reach.
- Ordinary public pages and evergreen searches: just use the built-in tools.

## Find a tool (start here)

The catalog is live and large, so never assume a tool is missing without checking (both public, no key needed):

- `GET https://api.fetchbean.com/discover?q=<task>`: ranked tools for a task, each with parameters, pricing, and the ready-made call (e.g. `?q=web search`, `?q=read a web page`, `?q=my linear issues`).
- `GET https://api.fetchbean.com/catalog`: the full, current provider and method catalog.

Then call the tool. Provider-independent tools have normalized shortcuts; listed provider operations can use the generic primitive:

```bash
# normalized shortcut (from discover): POST /v1/<tool>
curl https://api.fetchbean.com/v1/search \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" -H "Content-Type: application/json" \
  -d '{"query":"best vector databases","max_results":5}'

# registered catalog operation: POST /v1/run, validated input and provider-specific result
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" -H "Content-Type: application/json" \
  -d '{"provider":"<provider>","endpoint":"<endpoint>","input":{}}'
```

## Connected accounts ("my <service>")

Some tools act on the user's **own** provider account. Connect it once at https://fetchbean.com/app through a pasted key or OAuth. Provider credentials are encrypted at rest, supplied only to that provider, and upstream usage is billed to the user's account. A call before connecting returns `credential_required`; `discover` marks which tools need it and carries the `connect_url`.

Agent-subscription connections for Codex, Claude Code, and Antigravity are separate. An org API key can retrieve and update an existing subscription credential so an unattended runner can use it. These routes do not return provider API keys or OAuth tokens.

## Curated per-service skills (this repo)

For a service you use a lot, install its dedicated skill instead of leaning on `discover` each time — it lists that service's tools and learns your workspace on first use.

**By task** — these span several services and are the ones worth installing even if you don't know which provider you need:

- **fetchbean-read-anything** — read any URL properly, and know when a page needs a real browser
- **fetchbean-llms-txt** — create or audit a compact linked llms.txt index from a site's public surface
- **fetchbean-research** — papers by topic, author or DOI, across arXiv and Crossref
- **fetchbean-company-diligence** — SEC filings and financials, plus a company's domain and infrastructure footprint
- **fetchbean-artifacts** — publish a page and get a shareable link

**By service**:

- **Support & feedback** — fetchbean-plain, fetchbean-intercom, fetchbean-chatwoot, fetchbean-canny
- **Email & lifecycle** — fetchbean-resend, fetchbean-loops, fetchbean-buffer
- **Engineering** — fetchbean-linear, fetchbean-sentry, fetchbean-supabase, fetchbean-tailscale
- **Money** — fetchbean-stripe, fetchbean-dodo
- **Product & docs** — fetchbean-posthog, fetchbean-notion
- **Other** — fetchbean-fireflies (meetings), fetchbean-replicate (models), fetchbean-spaceship (domains), fetchbean-pvr (cinemas)

Writing one for a service that has none? Install **skill-creator**, which builds it from the live catalog.

```bash
npx skills add Tinkerers-Labs/fetchbean-skills --skill fetchbean-linear -a claude-code
```

The machine-readable list of every skill here is [`index.json`](https://github.com/Tinkerers-Labs/fetchbean-skills/blob/main/index.json).

## Errors, by code

Typed JSON: `{ "error": { "type", "code", "message", "retryable", "billable" } }`.

- `credential_required` — the tool acts on the user's own account and it isn't connected. Point them to https://fetchbean.com/app?tab=connections, then retry.
- `provider_error` — the `message` is straight from the upstream provider (a scope/permission limit, bad input, or not-found on the user's account). Surface it; it's not a fetchbean bug. Retry only if `retryable`.
- `insufficient_credits`: the balance cannot cover the upfront hold. The user tops up at https://fetchbean.com/app. Don't retry until they do.
- `spend_cap_exceeded`: the monthly admission cap must reset or be raised before another call starts.
- `rate_limited` / `timeout` — transient; back off and retry. In general retry only when `retryable` is true. Provider failures and timeouts are billed zero.

## Credits

Prepaid. 1 credit = $0.0001, with a $5 minimum top-up and 5% bonus credits at $50 or more. Each call holds its fixed price or metered estimate before execution, then settles the actual charge. A metered charge can exceed that estimate, the remaining balance, or the monthly admission cap.

## MCP

fetchbean also runs a hosted MCP server (Streamable HTTP). Add `https://api.fetchbean.com/mcp` with an `X-API-Key` header to any MCP client. It exposes exactly four meta-tools: `discover`, `describe`, `run`, and `request`. Use `discover({ q })` to find a tool, then `run({ provider, endpoint, input })`. Catalog operations are not exposed as individual MCP tools. Prefer local stdio? Run `npx -y fetchbean-mcp` with `FETCHBEAN_API_KEY` set.
