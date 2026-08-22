---
name: "fetchbean-tailscale"
description: "Administer your Tailscale tailnet through fetchbean — devices and who owns them, users and roles, subnet routes and exit nodes, MagicDNS and split DNS, the access policy file (ACLs, grants, tags, groups), auth keys, device posture, webhooks and log streaming. Use when the user asks which machines are on their tailnet, whether a device is online or its key is expiring, who can reach what, why a host is unreachable, what an ACL allows, or how to approve, tag, rename or remove a node, and when they say 'my tailnet', 'my Tailscale', 'our VPN', 'the exit node', or 'the ACL'. Requires connecting Tailscale once in the fetchbean dashboard; calls before that return credential_required."
---

# Tailscale tailnet (via fetchbean)

Administer your Tailscale tailnet through fetchbean. fetchbean holds your Tailscale OAuth client credentials encrypted server-side, so you call clean tools with your fetchbean key and never put a Tailscale secret in config.

## Your workspace

This tailnet's devices, users and tags — with the ids that writes need — are cached in `workspace.md` beside this file. If it's present, read it first: nearly every write takes a `device_id` or `user_id` you cannot guess from a hostname. If absent, run Personalize below. If a device you need is missing, it's stale — re-run.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

Connect Tailscale once: open https://fetchbean.com/app → Connections → pick Tailscale → paste your OAuth client id and secret (Tailscale admin console → Settings → OAuth clients, at https://login.tailscale.com/admin/settings/oauth). fetchbean verifies and encrypts them.

A tool call before connecting returns a `credential_required` error.

**Scopes decide everything here.** The OAuth client only does what its scopes allow, and tags it isn't permitted to use are refused. If a tool 403s, the client is under-scoped rather than the call being wrong.

## Personalize (once) — delete this section after running

Skip if `workspace.md` exists. Otherwise run `tailscale_devices`, `tailscale_users` and `tailscale_dns_configuration` once and write a compact `workspace.md` beside this file, stamped with today's date:

```
# Tailnet — 2026-08-22
Devices: macbook (d_abc, 100.x.y.z, tag:laptop) · gw-uk (d_def, exit node, routes 10.0.0.0/24)
Users: aman@… (u_1, owner) · ci@… (u_2, member)
MagicDNS: on · search: acme.internal
```

Then remove this whole section from this SKILL.md — heading to the next `##` — so it doesn't reload every use. Leave Your workspace above.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call.

```bash
curl https://api.fetchbean.com/v1/tailscale_devices \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" -d '{}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these as native `tailscale_*` tools — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"tailscale","endpoint":"<endpoint>"}`.

## Read tools

- `tailscale_devices` () — every device with addresses, owner, status, OS and client version. Start here; it's where `device_id` comes from.
- `tailscale_device` (device_id) · `tailscale_device_routes` (device_id) — routes **advertised** by the device versus **enabled** for it. A subnet router that isn't working is usually advertised but not enabled.
- `tailscale_users` () · `tailscale_user` (user_id) — roles and status.
- `tailscale_policy` () — the tailnet policy file: grants, ACLs, groups, tags, posture rules. The answer to "who can reach what".
- `tailscale_validate_policy` () — check a proposed policy without applying it.
- `tailscale_preview_policy` () — show which sources, destinations and users a proposed rule would match. **Use this to answer "would this rule do what I mean" before touching the real policy.**
- `tailscale_dns_configuration` () — nameservers, split DNS, search paths and preferences in one call. Or individually: `tailscale_dns_nameservers`, `tailscale_dns_preferences`, `tailscale_dns_search_paths`, `tailscale_dns_split`.
- `tailscale_keys` () — auth keys and trust credentials visible to this client.
- `tailscale_webhooks` () · `tailscale_settings` () — endpoints and subscriptions; tailnet feature, logging and account settings.

## Write tools

**Devices** — `tailscale_authorize_device` (device_id, authorized), `tailscale_rename_device` (device_id, name), `tailscale_set_device_tags` (device_id, tags), `tailscale_set_device_routes` (device_id, routes), `tailscale_set_device_key_expiry` (device_id, keyExpiryDisabled), `tailscale_expire_device_key` (device_id), `tailscale_set_device_ip` (device_id, ipv4), `tailscale_delete_device` (device_id).

**Users** — `tailscale_update_user_role`, `tailscale_approve_user`, `tailscale_suspend_user`, `tailscale_restore_user`, `tailscale_delete_user`. Invites: `tailscale_create_user_invite`, `tailscale_resend_user_invite`, `tailscale_delete_user_invite`, and the device equivalents `tailscale_create_device_invite` / `tailscale_resend_device_invite` / `tailscale_delete_device_invite` / `tailscale_accept_device_invite`.

**Policy** — `tailscale_set_policy` (policy) replaces the **entire** access policy.

**DNS** — `tailscale_set_dns_nameservers`, `tailscale_set_dns_preferences` (magicDNS), `tailscale_set_dns_search_paths`, `tailscale_set_dns_split` / `tailscale_update_dns_split` (update is the partial one), `tailscale_set_dns_configuration`.

**Keys** — `tailscale_create_auth_key` (capabilities), `tailscale_set_key`, `tailscale_delete_key`.

**Posture** — `tailscale_set_device_posture_attribute`, `tailscale_delete_device_posture_attribute`, `tailscale_batch_update_posture_attributes` (null deletes an attribute), plus `tailscale_create_posture_integration` / `update` / `delete`.

**Webhooks** — `tailscale_create_webhook` (endpointUrl, subscriptions), `tailscale_update_webhook`, `tailscale_test_webhook`, `tailscale_rotate_webhook_secret`, `tailscale_delete_webhook`.

**Logging** — `tailscale_set_log_streaming` (log_type), `tailscale_disable_log_streaming`, `tailscale_get_aws_external_id`, `tailscale_validate_aws_external_id`.

**Services and apps** — `tailscale_update_service`, `tailscale_delete_service`, `tailscale_approve_service_device`, `tailscale_create_oauth_app`, `tailscale_update_oauth_app`, `tailscale_delete_oauth_app`.

**Tailnets** — `tailscale_create_organization_tailnet`, `tailscale_delete_tailnet`.

## Anything else

Tailscale has no raw passthrough tool of its own. For anything the tools above don't name, use the generic runner, which takes a provider and one of its endpoints:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" -H "Content-Type: application/json" \
  -d '{"provider":"tailscale","endpoint":"/devices","input":{}}'
```

Endpoints come from `GET https://api.fetchbean.com/discover?q=tailscale`. If Tailscale supports something fetchbean doesn't model at all, that's a tool request (`POST /v1/request`), not a call you can improvise.

## Safety

This is network access control for real infrastructure. Default to reads, and only write when the user explicitly asks — confirm first.

Four of these can cut people off:

- `tailscale_set_policy` **replaces the whole policy file**, so anything you omit is deleted. Run `tailscale_validate_policy` and `tailscale_preview_policy` first, every time.
- `tailscale_set_dns_nameservers` with an empty list **also disables MagicDNS**, which breaks name resolution across the tailnet.
- `tailscale_set_device_ip` and `tailscale_rename_device` break that device's existing connections and any URL using its old name.
- `tailscale_delete_tailnet` permanently destroys the tailnet, every user, device and setting. There is no undo. Never call it without an explicit, unambiguous instruction.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=tailscale` (no key needed).
