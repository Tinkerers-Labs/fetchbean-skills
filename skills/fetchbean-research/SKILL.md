---
name: "fetchbean-research"
description: "Find and resolve academic papers through fetchbean — search arXiv preprints and Crossref's ~160M registered works, look a paper up by DOI or arXiv id, check how many works cite it, and get abstracts with direct PDF links. Use when the user asks for papers or research on a topic, what a specific paper says, who wrote it, when it was published, how influential or cited it is, what is new in a field, or asks to resolve a DOI or an arxiv.org link. Also use for 'find me the paper on', 'is there research about', 'the original transformer paper', 'recent work on', or 'cite this'. Needs only a fetchbean key, nothing to connect. Covers scholarly literature metadata and preprints, not full-text search inside paywalled papers."
---

# Research papers (via fetchbean)

Two catalogues that answer different halves of the same question, plus the rule for which to reach for. Nothing to connect — both run on a managed credential.

**arXiv** is preprints: physics, maths, CS, biology, economics. Free full abstracts, direct PDFs, and the newest work, often months before publication.

**Crossref** is the DOI registry: ~160M works across every publisher and discipline, with citation counts. It knows about the published record, including everything arXiv doesn't cover.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

There is nothing to connect.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call.

```bash
curl https://api.fetchbean.com/v1/arxiv_search \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"query":"cat:cs.LG diffusion models","sort":"date","limit":10}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these natively — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"arxiv","endpoint":"/search"}`.

## Which one to use

| The ask | Start with |
|---|---|
| "recent work on X", "what's new in X" | `arxiv_search` with `sort: "date"` — preprints land first |
| "the most cited paper on X" | `crossref_search` with `sort: "is-referenced-by-count"` |
| "papers by <author>" | `arxiv_search` with `au:` for preprints, `crossref_search` for the published record |
| a DOI, or a doi.org link | `crossref_work` |
| an arXiv id, or an arxiv.org link | `arxiv_paper` |
| "how influential is this paper" | `crossref_work` — it carries `cited_by` |
| "give me the PDF" | `arxiv_paper` — it returns `pdf_url` |

## Tools

**arXiv** — preprints, full abstracts, PDFs
- `arxiv_search` (query, sort?, limit?, offset?) — a plain phrase searches everything. Prefix to narrow: `ti:` title, `au:` author, `abs:` abstract, `cat:` category (`cs.LG`, `hep-th`, `math.CO`). `sort` is relevance, date or updated. **An unknown prefix would return an empty feed upstream, so it is refused instead — an empty result here means genuinely nothing matched.**
- `arxiv_paper` (id) — one paper by id (`1706.03762`, or `1706.03762v5` for a version), with abstract, authors, categories, DOI, journal reference and `pdf_url`. Takes several ids comma-separated, or a full arxiv.org URL.

**Crossref** — the registered record, citation counts
- `crossref_search` (query, limit?, offset?, from_year?, until_year?, type?, sort?, order?) — `sort: "is-referenced-by-count"` for the most-cited. `type: "journal-article"` filters out datasets, chapters and preprint duplicates.
- `crossref_work` (doi) — one work by DOI, bare or as a doi.org link: title, authors, journal, date, publisher, licence, and how many works cite it.

## Reading these results well

**Crossref matches bibliographically, not semantically.** It indexes titles and metadata, so a title finds its paper cleanly while a plain-English question can rank a similarly-named work above the one you meant — searching *"attention is all you need"* returns a 2025 paper called *"Is Attention All You Need?"* above the 2017 Transformer paper. If the top hit looks wrong, it probably is: search the exact title, or find it on arXiv and resolve its DOI.

**Preprint and published versions are different records.** The same work can be an arXiv id and a DOI with different dates and no citation count on the preprint. `arxiv_paper` returns the DOI when one exists, which is the bridge between them.

**Citation counts lag.** A paper from this month has a low `cited_by` because nothing has cited it yet, not because it is unimportant. Don't rank recent work by citations.

**Date precision varies.** Crossref's `published` can be a year, a year-month, or a full date depending on what the publisher registered. `year` is always there when anything is.

## Going wider

For work that is neither on arXiv nor DOI-registered — a lab's blog, a technical report, documentation — `exa_search` (query, numResults?, type?) finds sources and `fetchbean_read` (url) reads them. For a paper's full text rather than its abstract, take the `pdf_url` and read it.

## Notes

Everything here is read-only. Both services are free and unauthenticated, and fetchbean paces its requests to stay inside what each asks for, so a burst of searches may be spaced out rather than refused.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=research%20papers` (no key needed).
