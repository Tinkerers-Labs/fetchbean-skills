---
name: "fetchbean-company-diligence"
description: "Research a company through fetchbean — SEC filings and reported financials for US public companies, plus the technical footprint of any company with a domain: subdomains from certificate transparency, DNS and registration records, what the site says about itself, and whether an email address is deliverable. Use when the user asks to look into, research, vet or do diligence on a company, wants its revenue, net income or annual report, asks what a company filed or disclosed, who owns a domain, what infrastructure or subdomains a company runs, or how one company compares to others. Also use for 'check out this company', 'is this legit', 'what do we know about', 'their 10-K', or 'their tech stack'. Needs only a fetchbean key, nothing to connect."
---

# Company diligence (via fetchbean)

Two halves that rarely overlap: what a company **filed**, and what it **runs**. Filings only exist for US public companies; the technical footprint works for anyone with a domain. Start by deciding which half the question is actually about.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

Everything below works without a separate provider connection. The Ahrefs tools can also use a connected Ahrefs key; check `discover` for current managed and connected pricing.

## Calling tools

Most tools are `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call.

**fetchbean's own tools are the exception**: they have no `/v1/<name>` route and go through the generic runner instead, as `{"provider":"fetchbean","endpoint":"<endpoint>"}`. Those are written below as `fetchbean /endpoint`.

```bash
curl https://api.fetchbean.com/v1/sec_company \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" -d '{"ticker":"AAPL"}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these natively — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"sec","endpoint":"/company"}`.

## Filings and financials — US public companies

- `sec_company` (ticker? | cik? | company?) — start here. A ticker, a CIK or a name resolves to the company: every ticker and exchange it trades on, industry (SIC) code, EIN, fiscal year end, website and business address. **A name matching several companies comes back naming them**, so `"bank"` tells you it matched 168 rather than guessing one.
- `sec_filings` (ticker/cik/company, form?, since?, limit?) — filings newest first, each with a **direct link to the filed document**. `form` narrows to `10-K` (annual), `10-Q` (quarterly), `8-K` (material event), `4` (insider trade), `S-1` (IPO). Covers roughly the last 1000 filings and tells you when older ones exist.
- `sec_concept` (ticker/cik/company, tag, taxonomy?) — one reported figure across every period, from XBRL rather than scraped from a page. Useful tags: `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax`, `NetIncomeLoss`, `Assets`, `Liabilities`, `StockholdersEquity`, `CashAndCashEquivalentsAtCarryingValue`.
- `sec_frames` (tag, period, unit?, limit?) — the same figure for **every company that reported it** in a period, which is how you rank or compare. `period` is `CY2024` or `CY2024Q1` for a duration measure like Revenues, and `CY2024Q1I` for an instant one like Assets. Getting that trailing `I` wrong is the usual mistake.
- `sec_search` (q, forms?, start_date?, end_date?) — full text **inside** filed documents, not just their titles. Quote a phrase for an exact match. This is how you answer "which companies discuss X" or "did they mention Y in their 10-K".

## Technical footprint — any company with a domain

- `crtname_subdomains` (apex, limit?) — every subdomain ever issued a TLS certificate, each with when it was first seen. This is the fastest read on what a company actually runs: staging hosts, internal tools, vendors, acquisitions. Built from certificate transparency, so it is a history of names that were ever certificated — some no longer resolve, and a host that never had its own certificate is not in there.
- `fetchbean /dns` (domain, types?) — live records. Pair with the above: subdomains tell you what existed, DNS tells you what answers now. MX reveals the email provider, NS the DNS host, TXT the SaaS vendors that verify by TXT.
- `fetchbean /domain` (domain) — registration: registrar, creation and expiry dates, nameservers. A domain registered three months ago is a different proposition to one registered in 2009.
- `fetchbean /read` (url) — the site's own words, as text rather than markup. `fetchbean /url/meta` (url) — what the page says about itself: OpenGraph, JSON-LD, canonical.
- `fetchbean /sitemap` (url, max_urls?) — every page they publish. Customer lists, pricing, careers and changelog pages are usually in here.
- `fetchbean /email/deliverability` (email, dns?, typo?, disposable?, freeProvider?) — whether an address is real and deliverable, and whether the domain is disposable.
- `logodev_search` (q) — brand and logo lookup by name or domain.
- `exa_search` (query, numResults?) — news, funding and coverage that isn't on the company's own site.
- `ahrefs_domain_rating` (domain): Domain Rating as a rough proxy for backlink strength. Keep the attribution returned with the result next to any displayed rating.

## Worked pattern

> **"Do diligence on Acme (acme.com)"**
>
> 1. `sec_company` with `company: "Acme"` — if it resolves, they're US-public and the filings half applies. If it 404s, they're private: skip to step 4.
> 2. `sec_filings` with `form: "10-K"` — the latest annual report, with a link to the document.
> 3. `sec_concept` with `tag: "Revenues"` — the actual reported trend, no interpretation needed.
> 4. `fetchbean /domain` + `fetchbean /dns` — how old, who hosts, who handles their mail.
> 5. `crtname_subdomains` — what they run. Scan for `staging`, `internal`, `admin`, vendor names.
> 6. `fetchbean /read` on the homepage and `fetchbean /sitemap` for pricing and customers.
> 7. `exa_search` for funding and news.

## Notes

Everything here is read-only.

Two honest limits. **The SEC half is US public companies only** — a private company, or one listed elsewhere, has no filings, and `sec_company` returning 404 means exactly that rather than that the company doesn't exist. And **certificate transparency is a history, not an inventory**: a subdomain in the list may be long gone, and one that never got its own certificate was never there to find.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=sec%20filings` (no key needed).
