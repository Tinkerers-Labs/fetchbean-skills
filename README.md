# fetchbean skills

Agent skills for [fetchbean](https://fetchbean.com): one key for 1,000+ tools across ~100 providers,
including managed web tools and your connected SaaS accounts. Provider credentials are stored
encrypted server-side instead of sitting in your agent config.

Each skill is a `SKILL.md` that any agent (Claude Code, Codex, Cursor, or anything that reads skill
files) loads to know when and how to reach a set of fetchbean tools. Install the **hub** for general
access to the whole catalog, and a **per-service** skill for anything you use a lot.

## Why through fetchbean

- **One runtime key across services.** Your Linear, Canny, and Fireflies tokens live encrypted in
  fetchbean, never in a dozen `settings.json` files.
- **Clear tool contracts.** Inputs are validated against each listed operation. Provider failures and
  timeouts are billed zero.
- **Check the current catalog.** `GET https://api.fetchbean.com/discover?q=<task>` confirms the tool,
  parameters, and pricing model before a call, with no key needed.

## Available skills

Start with the **hub** for general access to 1,000+ listed tools via `discover` + `run`. Then add
either a **task** skill (these span several services and are useful before you know which provider
you need) or a **per-service** skill for anything you use a lot.

| Skill | What it does |
|-------|--------------|
| [fetchbean](skills/fetchbean) | **The hub**: one key to find and call listed tools. Blocked-page reads, live search, and `my <service>` accounts. Install this first. |
| [fetchbean-read-anything](skills/fetchbean-read-anything) | **By task** — read any URL properly: articles, JSON, feeds, PDFs, and when a page needs a real browser |
| [fetchbean-llms-txt](skills/fetchbean-llms-txt) | **By task** — create or audit a compact linked llms.txt index, with site discovery and link validation |
| [fetchbean-research](skills/fetchbean-research) | **By task** — papers by topic, author, DOI or arXiv id, across arXiv and Crossref |
| [fetchbean-company-diligence](skills/fetchbean-company-diligence) | **By task** — SEC filings and financials, plus a company's domain, DNS and subdomain footprint |
| [fetchbean-linear](skills/fetchbean-linear) | Your Linear issues, projects, and teams — search, list, file, update, comment |
| [fetchbean-canny](skills/fetchbean-canny) | Your Canny feedback — boards, requests, votes, roadmap status, changelog |
| [fetchbean-fireflies](skills/fetchbean-fireflies) | Your Fireflies meetings — transcripts, action items, soundbites, sharing |
| [fetchbean-buffer](skills/fetchbean-buffer) | Your Buffer social scheduling — channels, queue, scheduled posts, analytics |
| [fetchbean-dodo](skills/fetchbean-dodo) | Your Dodo Payments — payments, subscriptions, customers, refunds, payouts, checkout links |
| [fetchbean-notion](skills/fetchbean-notion) | Your Notion — search, read pages as markdown, query databases, create and append |
| [fetchbean-posthog](skills/fetchbean-posthog) | Your PostHog analytics — HogQL queries, insights, dashboards, feature flags, error tracking |
| [fetchbean-spaceship](skills/fetchbean-spaceship) | Your Spaceship domains and DNS — domains, records, nameservers, auto-renew, availability |
| [fetchbean-stripe](skills/fetchbean-stripe) | Your Stripe — payments, customers, subscriptions, invoices, refunds, balance, payouts, payment links |
| [fetchbean-sentry](skills/fetchbean-sentry) | Your Sentry — issues, stacktraces, releases, projects; resolve and assign |
| [fetchbean-supabase](skills/fetchbean-supabase) | Your Supabase — run SQL, projects, logs (read-only by default) |
| [fetchbean-replicate](skills/fetchbean-replicate) | Run any model on Replicate — images, video, audio, text; search the catalog, poll predictions, fine-tune |
| [fetchbean-chatwoot](skills/fetchbean-chatwoot) | Your Chatwoot support inbox — conversations, replies and notes, resolve, assign, label, reports |
| [fetchbean-intercom](skills/fetchbean-intercom) | Your Intercom inbox — search conversations and contacts, reply, close, snooze, assign, tickets, help center |
| [fetchbean-artifacts](skills/fetchbean-artifacts) | Publish a report/dashboard/page and get a shareable URL — from any agent, no connection |
| [fetchbean-plain](skills/fetchbean-plain) | Your Plain support inbox — threads, replies, notes, labels, plus tenants, companies, tiers and SLAs |
| [fetchbean-tailscale](skills/fetchbean-tailscale) | Your Tailscale tailnet — devices, users, routes, DNS, the access policy, auth keys, posture |
| [fetchbean-loops](skills/fetchbean-loops) | Your Loops lifecycle email — contacts, lists, campaigns, transactional sends, events, workflows |
| [fetchbean-resend](skills/fetchbean-resend) | Your Resend email — send and schedule, delivery status, templates, contacts, broadcasts, domains |
| [fetchbean-pvr](skills/fetchbean-pvr) | What's playing in Indian cinemas — showtimes, seats, prices across PVR INOX |
| [skill-creator](skills/skill-creator) | Author a new fetchbean skill for any service in the catalog, from the live tool list |

More are added on demand — [request one](https://fetchbean.com/requests), or if a service is already
[in the fetchbean catalog](https://fetchbean.com/catalog) you can reach it today via the
[fetchbean skill](https://fetchbean.com/skill.md)'s `discover` + `run`.

## Install a skill

**With [`npx skills`](https://github.com/vercel-labs/skills)** (the standard installer):

```bash
npx skills add Tinkerers-Labs/fetchbean-skills --skill fetchbean-linear -a claude-code
# --list to see all · --all for every skill · -a codex / -a cursor for other agents
```

**Or by hand** — drop the `SKILL.md` into your agent's skills directory:

```bash
SKILLS=~/.claude/skills          # Codex: ~/.codex/skills
NAME=fetchbean-linear
mkdir -p "$SKILLS/$NAME"
curl -fsSL "https://raw.githubusercontent.com/Tinkerers-Labs/fetchbean-skills/main/skills/$NAME/SKILL.md" \
  -o "$SKILLS/$NAME/SKILL.md"
```

**Or just ask your agent:** *"install the fetchbean-linear skill from github.com/Tinkerers-Labs/fetchbean-skills"* — it can fetch the file and drop it in place itself.

Then get a fetchbean key at https://fetchbean.com/app and save it once:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

Managed tools work immediately. For tools that act on your data, connect the matching service once in the dashboard.

## Self-personalizing

Skills with reusable workspace context can learn it on first use: a one-time **Personalize** step reads
your boards / teams / channels (with their ids) and caches them in a local `workspace.md` beside the skill,
so the agent can act on things by name without repeated lookups. That file is generated from your own
account, holds workspace-specific ids and names, and is **git-ignored — never committed**.

## Links

- **fetchbean** — https://fetchbean.com
- **Catalog** (every service, live) — https://fetchbean.com/catalog
- **Request a tool** — https://fetchbean.com/requests

---

By [Tinkerers Labs](https://tinkererslabs.com). MIT licensed — copy, adapt, and ship these however you like.
