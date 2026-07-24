---
name: "fetchbean-dodo"
description: "Read and manage your Dodo Payments through fetchbean (one key, with your Dodo token held encrypted server-side instead of in config). Use when the user asks about their Dodo payments, subscriptions, customers, refunds, payouts, disputes, revenue, license keys, or checkout links, or says 'my Dodo' or 'my payments' — for example listing recent payments, refunding one, cancelling a subscription, checking payouts, or creating a payment link. Requires connecting Dodo once in the fetchbean dashboard; calls before that return credential_required."
---

# Dodo Payments (via fetchbean)

Read and manage your Dodo Payments account through fetchbean. fetchbean holds your Dodo API key encrypted server-side, so you call clean tools with your fetchbean key and never put a Dodo token in config.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Dodo once: open https://fetchbean.com/app, go to Connections, pick Dodo Payments, paste your Dodo API key (from https://app.dodopayments.com/developer/api-keys), and choose the **environment — `live` or `test`**. This decides whether every call below touches real money or your test data, so set it deliberately.

A tool call before connecting returns a `credential_required` error.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Dodo account, in the environment you connected.

```bash
curl https://api.fetchbean.com/v1/dodo_payments \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"page_size":20}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `dodo_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"dodo","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

Lists take `page_number?` / `page_size?`; the singular reads take the record id.

- `dodo_payments` / `dodo_payment` (payment_id) — payments; one payment in full.
- `dodo_payment_line_items` (payment_id) — line items for a payment.
- `dodo_subscriptions` / `dodo_subscription` (subscription_id) — subscriptions.
- `dodo_customers` / `dodo_customer` (customer_id) — customers.
- `dodo_products` — products.
- `dodo_refunds` — refunds. `dodo_disputes` — disputes/chargebacks.
- `dodo_payouts` — payouts. `dodo_balance_ledger` — balance ledger entries.
- `dodo_discounts` — discount codes.
- `dodo_licenses` — license keys. `dodo_validate_license` (license_key) — check a key is valid.

## Write tools

- `dodo_create_refund` (payment_id, amount?, reason?) refund a payment — full, or partial with `amount`.
- `dodo_cancel_subscription` (subscription_id) cancel a subscription.
- `dodo_create_checkout` () create a hosted checkout / payment link.
- `dodo_customer_portal` (customer_id) generate a self-serve billing-portal link for a customer.
- `dodo_create_customer` (email, name?, phone_number?) create a customer.
- `dodo_create_product` (name, ...) create a product (price/tax per Dodo's schema).
- `dodo_activate_license` (license_key, name) activate a license key on a device/instance.

## Anything else

For any Dodo endpoint not covered above, use the escape hatch, which calls any Dodo API path on your key:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"dodo","endpoint":"/request","input":{"path":"/payments","method":"GET","query":{"page_size":5}}}'
```

## Safety

This is money. Default to reads. `dodo_create_refund` and `dodo_cancel_subscription` move real funds and change a customer's billing — run them **only on an explicit request, and confirm the payment/subscription id and amount first**; a refund is not reversible. Before any write, be sure the connection's environment (`live` vs `test`) is the one intended — a "test" action won't affect real customers, and a "live" one will.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=dodo` (no key needed).
