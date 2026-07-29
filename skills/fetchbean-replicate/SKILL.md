---
name: "fetchbean-replicate"
description: "Run any AI model on Replicate through fetchbean (one key, with your Replicate token held encrypted server-side instead of in config). Use when the user wants to generate an image, video, audio, speech, or text with an open model, upscale or restore a photo, remove a background, transcribe audio, run a specific Replicate model, browse or search the model catalog, check a prediction, or start a fine-tune — or says 'my Replicate'. Requires connecting Replicate once in the fetchbean dashboard; calls before that return credential_required."
---

# Replicate (via fetchbean)

Run any model on Replicate through fetchbean. fetchbean holds your Replicate token encrypted server-side, so you call clean tools with your fetchbean key and never put an `r8_` token in config. GPU time is billed by Replicate to your own account.

## Your models

The models you actually use — and their **input schemas**, which are per-version and not guessable — are cached in **`workspace.md`** beside this file. **If it's present, read it first**: it's the difference between writing correct `input` on the first try and burning a run on a rejected field. If it's absent, run **Personalize (once)** below. If a model rejects an input you sent, its version moved — re-read it with `replicate_model` and update the cache.

## Setup (once)

1. Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

   ```bash
   mkdir -p ~/.config/fetchbean
   printf '%s' 'fb_...' > ~/.config/fetchbean/key
   chmod 600 ~/.config/fetchbean/key
   ```

2. Connect Replicate once: open https://fetchbean.com/app, go to Connections, pick Replicate, and paste an API token from https://replicate.com/account/api-tokens.

**You can skip step 2 for a first look.** Without a connection, model search and browsing still work, and `replicate_run` still runs the flux image models on fetchbean's token — metered per image (see Cost below). Connect your own token to run *any* model, uncapped, at the flat rate. Everything account-scoped (your predictions, files, trainings, deployments) needs the connection and returns `credential_required` without it.

## Personalize (once) — delete this section after running

Skip this if `workspace.md` already exists next to this file. Otherwise pick the two or three models you'll actually use (`replicate_search` or `replicate_collections` to find them), then for each run `replicate_model` and record the fields from `latest_version.openapi_schema`.

Write it compactly, stamped with today's date, like:

```
# Replicate models · 2026-01-01
## <owner>/<model> (official — address by model, no version)
- input: <copy the field names, types and defaults straight out of openapi_schema>
- notes: typical runtime, whether it fits inside the 60s wait
## <owner>/<model> (community — needs version)
- version: <version-id>
- input: <same, from that version's openapi_schema>
```

Then **remove this entire "## Personalize (once)" section from this SKILL.md** — from its heading to the next `##` — so it doesn't reload every use. Leave the "## Your models" section above in place.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out.

```bash
curl https://api.fetchbean.com/v1/replicate_run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"model":"black-forest-labs/flux-schnell","input":{"prompt":"a red bicycle on a beach at sunset"}}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does
**not** expose these as native `replicate_*` tools — it exposes exactly four meta-tools (`discover`,
`describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"replicate","endpoint":"<endpoint>"}`.
The HTTP calls below are the shortest path.

## Cost

**Connected** — 5 credits a call, the same flat rate as every other connected provider, for any model with no output caps. The GPU bill goes to your own Replicate account.

**Not connected** — `replicate_run` uses fetchbean's token and charges per image, at Replicate's published price plus fetchbean's margin:

| Model | Charged |
|---|---|
| `black-forest-labs/flux-schnell` | 43 credits/image |
| `black-forest-labs/flux-dev` | 358 credits/image |
| `black-forest-labs/flux-1.1-pro` | 572 credits/image |

Ask for 4 images, pay for 4 — the count comes from `num_outputs` in `input`, capped at 4 per call on the shared token. Any other model returns a 402 telling you to connect: Replicate never reports what a prediction cost, so fetchbean can only bill on our own key for models whose price is published per image.

## Running a model — the three things that bite

1. **Official models take `model`; everything else takes `version`.** `{"model":"black-forest-labs/flux-schnell"}` works for official models. A community model needs `{"version":"<version-id>"}` from `replicate_versions`. Passing the wrong one is the most common error.
2. **`input` is model-specific and unguessable.** The authoritative field list is the version's `openapi_schema`, via `replicate_model`. Don't invent field names.
3. **`replicate_run` waits up to 60 seconds.** If the model takes longer you get the prediction back with `status: "processing"` — that is **not an error**. Poll `replicate_prediction` with its `id`. For anything slow by nature (video, long generations), use `replicate_create_prediction` instead: it returns immediately instead of holding your request open for a minute.

**Outputs are URLs that expire in about an hour.** If the user needs to keep an image, download it or republish it somewhere permanent — `fetchbean_artifact_create` is one way to hand back a lasting link.

## Read tools

- `replicate_search` (query, limit?) find a model by name or description. The way in when you don't know the exact owner/name.
- `replicate_collections` () · `replicate_collection` (slug) curated collections (text-to-image, upscalers, speech…) — often better than search for "what should I use for X".
- `replicate_models` (sort_by?, sort_direction?) browse public models.
- `replicate_model` (model) one model **including `latest_version.openapi_schema`** — read this before running something new.
- `replicate_versions` (model) · `replicate_version` (model, version_id) versions and their input schemas.
- `replicate_readme` (model) · `replicate_examples` (model) docs and known-good example inputs.
- `replicate_prediction` (prediction_id) status, output, logs, metrics. What you poll after a run came back processing.
- `replicate_predictions` (created_after?, created_before?, source?) your prediction history.
- `replicate_trainings` () · `replicate_training` (training_id) your fine-tunes.
- `replicate_deployments` () · `replicate_deployment` (deployment) models on your dedicated hardware.
- `replicate_files` () · `replicate_file` (file_id) · `replicate_file_download` (file_id, owner?, expiry?, signature?) files you've uploaded as model inputs.
- `replicate_account` () · `replicate_hardware` () who you are, and the GPU tiers available.

**Paginating:** every list read takes `cursor`. Replicate's list responses carry a `next` URL — pull the `cursor` query value off it and pass it back to get the following page.

## Write tools

- `replicate_run` (model | version, input, wait?, cancel_after?) **the main one** — run and wait for the output. `wait` is 1–60 seconds (default 60). `cancel_after` (e.g. `5m`) caps GPU time.
- `replicate_create_prediction` (model | version, input, webhook?) start without waiting; returns a pending prediction. Use for slow models.
- `replicate_run_deployment` (deployment, input, wait?) run one of your deployments and wait.
- `replicate_cancel_prediction` (prediction_id) stop a running prediction — and stop paying for it.
- `replicate_create_training` (model, version_id, destination, input) start a fine-tune. Long-running and billed by the second.
- `replicate_cancel_training` (training_id) stop a fine-tune.

## Anything else

No delete tools here by design — the token can destroy models, versions, files, and deployments. For anything not covered above (including deletes and webhook secrets), use the escape hatch:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"replicate","endpoint":"/request","input":{"method":"GET","path":"/webhooks/default/secret"}}'
```

## Safety

**Every run costs the user real money on their own Replicate account**, billed per second of GPU. That makes this different from a read-only integration: don't run models speculatively, don't retry a failed generation in a loop, and don't kick off a fine-tune without an explicit ask — trainings can run for hours. Prefer `cancel_after` on anything unfamiliar, and check `replicate_hardware` if cost matters, since the tier drives the per-second rate. Generating images of real people, or content the user will publish, deserves a confirm first.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=replicate` (no key needed).
