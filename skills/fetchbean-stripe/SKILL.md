---
name: "fetchbean-stripe"
description: "Read and manage your Stripe account through fetchbean (one key, with your Stripe token held encrypted server-side instead of in config). Use when the user asks about their Stripe payments, customers, subscriptions, invoices, charges, refunds, balance, payouts, disputes, or payment links, or says 'my Stripe' or 'my payments' — for example listing recent payments, checking the balance, refunding a charge, cancelling a subscription, or creating a payment link. Requires connecting Stripe once in the fetchbean dashboard; calls before that return credential_required."
---

# Stripe (via fetchbean)

Read and manage your Stripe account through fetchbean. fetchbean holds your Stripe key encrypted server-side, so you call clean tools with your fetchbean key and never put a Stripe secret in config.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Stripe once: open https://fetchbean.com/app, go to Connections, pick Stripe, and paste a key from https://dashboard.stripe.com/apikeys. **Use a restricted key (`rk_…`)** scoped to what you need — it caps what any call can do; a full secret key (`sk_…`) also works but grants everything.

A tool call before connecting returns a `credential_required` error.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 5 credits per call. The call runs on your own Stripe account.

```bash
curl https://api.fetchbean.com/v1/stripe_balance \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `stripe_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"stripe","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Read tools

Lists take `limit?` / `starting_after?` (cursor); singular reads take the record id.

- `stripe_customers` / `stripe_customer` (customer_id) — customers.
- `stripe_payment_intents` / `stripe_payment_intent` (payment_intent_id) — payment intents.
- `stripe_charges` — charges. `stripe_refunds` — refunds. `stripe_disputes` — disputes/chargebacks.
- `stripe_subscriptions` / `stripe_subscription` (subscription_id) — subscriptions.
- `stripe_invoices` — invoices. `stripe_products` — products. `stripe_prices` — prices.
- `stripe_balance` () — available + pending balance. `stripe_balance_transactions` — the money ledger.
- `stripe_payouts` — payouts to your bank. `stripe_events` — recent account events.

## Write tools

- `stripe_create_refund` (charge OR payment_intent, amount?, reason?) refund — full, or partial with `amount`.
- `stripe_cancel_subscription` (subscription_id) stop recurring billing.
- `stripe_create_payment_link` (line_items) a shareable payment link (line_items reference existing prices).
- `stripe_create_checkout` (...) a hosted Checkout session.
- `stripe_create_customer` (email?, name?, metadata?) create a customer.

## Anything else

For any Stripe endpoint not covered above, use the escape hatch (form-encoded, nested params supported):

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"stripe","endpoint":"/request","input":{"path":"/v1/charges","method":"GET","params":{"limit":3}}}'
```

## Safety

This is money. Default to reads. `stripe_create_refund` and `stripe_cancel_subscription` move real funds and change a customer's billing — run them **only on an explicit request, and confirm the charge/subscription id and amount first**; a refund is not reversible. A restricted key (above) is the real backstop: it limits what any call — or mistake — can do.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=stripe` (no key needed).
