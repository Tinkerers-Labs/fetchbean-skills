# fetchbean skills

Agent skills for [fetchbean](https://fetchbean.com) — one key for ~400 tools across 40+ services:
live web tools and your own connected SaaS accounts, with each service's token held encrypted
server-side instead of sitting in your config.

Each skill is a `SKILL.md` that any agent (Claude Code, Codex, Cursor, or anything that reads skill
files) loads to know when and how to reach a set of fetchbean tools. Install the **hub** for general
access to the whole catalog, and a **per-service** skill for anything you use a lot.

## Why through fetchbean

- **One key, not one per service.** Your Linear, Canny, and Fireflies tokens live encrypted in
  fetchbean, never in a dozen `settings.json` files.
- **Curated, normalized tools.** Clean inputs and stable JSON out, on prepaid credits you can't
  overspend. Provider failures and timeouts are billed zero.
- **Always current.** The skills point at the live catalog rather than hardcoding it —
  `GET https://api.fetchbean.com/discover?q=<task>` confirms any tool, any time (no key needed).

## Available skills

Start with the **hub** for general access to any of ~400 tools via `discover` + `run`; add a
**per-service** skill for anything you use a lot (it lists that service's tools and learns your
workspace on first use).

| Skill | What it does |
|-------|--------------|
| [fetchbean](skills/fetchbean) | **The hub** — one key, find and call any tool. Blocked-page reads, live search, and `my <service>` accounts. Install this first. |
| [fetchbean-linear](skills/fetchbean-linear) | Your Linear issues, projects, and teams — search, list, file, update, comment |
| [fetchbean-canny](skills/fetchbean-canny) | Your Canny feedback — boards, requests, votes, roadmap status, changelog |
| [fetchbean-fireflies](skills/fetchbean-fireflies) | Your Fireflies meetings — transcripts, action items, soundbites, sharing |
| [fetchbean-skill-creator](skills/fetchbean-skill-creator) | Author a new fetchbean skill for any service in the catalog, from the live tool list |

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

That's the whole setup. Connect the matching service in the dashboard, and the skill's tools work.

## Self-personalizing

Each skill ships generic, then learns your workspace on first use: a one-time **Personalize** step reads
your boards / teams / channels (with their ids) and caches them in a local `workspace.md` beside the skill,
so the agent can act on things by name without repeated lookups. That file is generated from your own
account, holds workspace-specific ids and names, and is **git-ignored — never committed**.

## Links

- **fetchbean** — https://fetchbean.com
- **Catalog** (every service, live) — https://fetchbean.com/catalog
- **Request a tool** — https://fetchbean.com/requests

---

By [Tinkerers Labs](https://tinkererslabs.com). MIT licensed — copy, adapt, and ship these however you like.
