---
name: "fetchbean-spaceship"
description: "Manage your Spaceship domains and DNS through fetchbean (one key, with your Spaceship credentials held encrypted server-side instead of in config). Use when the user asks about their domains, DNS records, nameservers, domain expiry or auto-renew, or domain availability, or says 'my domains' or 'my DNS' — for example listing domains, adding a DNS record, pointing a subdomain, checking when a domain expires, or seeing if a name is available. Requires connecting Spaceship once in the fetchbean dashboard; calls before that return credential_required."
---

# Spaceship (via fetchbean)

Manage your Spaceship domains and DNS through fetchbean. fetchbean holds your Spaceship API key + secret encrypted server-side, so you call clean tools with your fetchbean key and never put Spaceship credentials in config.

## Your workspace

The domains in your account — with their expiry, auto-renew, and nameservers — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: you can act on a domain by name and confirm it's actually yours before any DNS or nameserver change. If it's absent, run **Personalize (once)** below. If a domain is missing, it's stale — re-run.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Spaceship once: open https://fetchbean.com/app, go to Connections, pick Spaceship, and paste your Spaceship **API key and API secret** (both from https://www.spaceship.com/application/api-manager/). fetchbean verifies and encrypts them.

A tool call before connecting returns a `credential_required` error.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise, run this once and write a compact `workspace.md`:

- `spaceship_domains` → each domain, with its expiry date, auto-renew state, and nameservers

Write it compactly, stamped with today's date, like:

```
# Spaceship domains · 2026-01-01
- example.com — expires 2027-03-14 · auto-renew on · NS: launch1.spaceship.net, launch2.spaceship.net
- example.dev — expires 2026-11-02 · auto-renew off · NS: (custom) ns1.vercel-dns.com, ns2.vercel-dns.com
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your workspace" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Spaceship account.

```bash
curl https://api.fetchbean.com/v1/spaceship_dns_records \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com"}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `spaceship_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"spaceship","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

- `spaceship_domains` (take?, skip?) the domains in your account (expiry, auto-renew, nameservers).
- `spaceship_domain` (domain) details for one domain.
- `spaceship_dns_records` (domain, take?, skip?) the DNS records for a domain.
- `spaceship_domain_available` (domain) check whether a name is available to register.

## Write tools

- `spaceship_dns_save` (domain, items) add or update DNS records (upsert). `items` follows Spaceship's record schema (type, name, value, ttl).
- `spaceship_dns_delete` (domain, items) delete the DNS records passed in `items`.
- `spaceship_set_nameservers` (domain, ...) set a domain's nameservers (a provider preset or custom hosts).
- `spaceship_set_autorenew` (domain, ...) turn auto-renew on or off.

## Anything else

For registration, renewal, transfers, contacts, or async operations, use the escape hatch — it calls any Spaceship endpoint on your key:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"spaceship","endpoint":"/request","input":{"path":"/v1/domains","method":"GET"}}'
```

## Safety

These changes affect live infrastructure. Default to reads. `spaceship_dns_save`/`dns_delete` can take a site or email offline (a wrong MX, A, or CNAME record), `spaceship_set_nameservers` can move a domain's entire DNS away from where it's served, and `spaceship_set_autorenew` off can let a domain lapse. Run any write **only on an explicit request, and confirm the domain and the exact records first** — read `spaceship_dns_records` and show the current state before changing it.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=spaceship` (no key needed).
