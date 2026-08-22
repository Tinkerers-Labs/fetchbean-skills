---
name: "fetchbean-pvr"
description: "Find what's playing in Indian cinemas through fetchbean — movies, showtimes, cinemas near you, IMAX and 4DX screenings, seat availability, and ticket prices across 116 cities. Use when the user asks what to watch, what's showing this weekend, where a film is playing, when the next show is, whether a film is out in IMAX, what tickets cost, whether seats are left, or what's releasing soon in India. Also use when they mention 'PVR,' 'INOX,' 'movie tickets,' 'showtimes,' 'cinema near me,' 'book a movie,' or 'what's in theatres.' No connection or account setup needed, just a fetchbean key. Covers the PVR INOX chain in India only — not other chains, not BookMyShow, not other countries — and it reads showtimes rather than booking them."
---

# PVR INOX cinemas (via fetchbean)

What's playing in Indian cinemas, from the same API pvrcinemas.com uses. Read-only: it finds shows, seats and prices, and hands you a link to finish booking in a browser.

## Setup (once)

Get a fetchbean key at https://fetchbean.com/app and save it where any shell can read it:

```bash
mkdir -p ~/.config/fetchbean
printf '%s' 'fb_...' > ~/.config/fetchbean/key
chmod 600 ~/.config/fetchbean/key
```

There is nothing to connect. These tools run on a managed credential, so the fetchbean key is all you need.

## Calling tools

Every tool is `POST https://api.fetchbean.com/v1/<name>`, JSON in and out, 10 credits per call (`pvr_showtimes` is 15).

```bash
curl https://api.fetchbean.com/v1/pvr_showtimes \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"city":"Mumbai","film":"odyssey","experience":"imax","available_only":true}'
```

The fetchbean MCP server (`https://api.fetchbean.com/mcp`) is an alternative transport, but it does **not** expose these as native `pvr_*` tools — it exposes exactly four meta-tools (`discover`, `describe`, `run`, `request`). Over MCP, call `run` with `{"provider":"pvr","endpoint":"<endpoint>"}`.

## Read tools

- `pvr_showtimes` (city, date?, film?, language?, experience?, after?, before?, available_only?, accessible_only?, cinema_id?, lat?, lng?, max_distance_km?, all_cinemas?, full?, limit?) — showtimes across a city or near a point, one block per cinema. The main tool; start here.
- `pvr_cinemas` (city, film?, query?, lat?, lng?, max_distance_km?, full?, limit?) — cinemas with distance and show counts. `film` keeps only the ones playing that title.
- `pvr_movies` (city, status?, query?, language?, genre?, experience?, full?, limit?) — what's on. `status: "coming_soon"` is the release calendar, out about a year, with cast, director, synopsis and trailer.
- `pvr_cinema` (city, cinema_id, date?, + the same show filters) — one cinema's schedule, plus `days`: the dates actually open for booking.
- `pvr_seats` (token) — seat map and ticket prices for one show.
- `pvr_cities` (query?, region?, limit?) — the 116 cities served, with cinema counts.

City names are matched loosely, so "bangalore" finds Bengaluru. You rarely need `pvr_cities` first.

## Reading the results

Responses keep the upstream's own nesting: `showTimeSessions[] → cinemaMovieSessions[] → experienceSessions[] → shows[]`. A cinema is `cinemaRe`, a film is `movieRe`, and the showtimes are the leaves.

- **Filter hard.** These payloads are large. Always pass `film`, `experience`, a time window, or `available_only` when you can, and never pass `full: true` unless the user needs each cinema's entire film list.
- **`statusTxt`** is `Available`, `Sold Out`, or `Lapsed` (already started). `available_only: true` drops the last two.
- **`experience`** is the premium format: `imax`, `4dx`, `luxe`, `pxl`, `screen-x`, `mx4d`, `insignia`, `laser` and others.
- **Time filters** take `"18:00"` or `"6:00 PM"`.
- **Every show carries `encrypted`** — pass it to `pvr_seats`, and give the user `https://www.pvrcinemas.com/seatlayout/<encrypted>` to finish booking.
- **In a seat map**, `s: 1` is free and `s: 2` is taken; entries with no `sn` are aisles. `priceList` gives each class's price with the convenience fee and GST split out. Prices vary more by cinema than by format, so compare cinemas before assuming IMAX costs more.

## Two things that will surprise you

**Booking windows are short.** Cinemas typically open only the next three or four days. If a date returns nothing, it is probably not on sale yet rather than sold out — check `days` from `pvr_cinema` to see what is actually open.

**Today is much cheaper than any other date.** Today is one call covering many cinemas; any other date costs one upstream call per cinema, so narrow it with `film` (or a `cinema_id`) when asking about a future date.

## Pairing with the user's watchlist

fetchbean also carries Trakt and TMDB, which makes a question no single service answers well:

1. `trakt_watchlist` — what they already want to see.
2. `pvr_movies` for their city — what is actually playing.
3. Match on title, then `pvr_showtimes` with the matched `film` for times, and `pvr_seats` for prices.

TMDB (`tmdb_search`, `tmdb_movie`) fills in ratings, runtime and synopsis when a PVR title is unfamiliar — useful because PVR titles carry format and language suffixes, like `THE ODYSSEY (ENGLISH WITH ENGLISH SUBTITLE)`.

## Anything else

For a call the curated tools don't cover, `POST /v1/run` takes the provider and endpoint directly:

```bash
curl https://api.fetchbean.com/v1/run \
  -H "X-API-Key: $(cat ~/.config/fetchbean/key)" \
  -H "Content-Type: application/json" \
  -d '{"provider":"pvr","endpoint":"/cinema","input":{"city":"Mumbai","cinema_id":"540"}}'
```

If something genuinely isn't in the catalog, file it with `POST /v1/requests` (a `need` in plain words) rather than inventing a tool.

## Safety

Every tool here is a read, and none of them books or pays for anything — hand the user the seat-layout link and let them finish. Don't dump raw responses into the conversation; they run to tens of kilobytes of nested JSON. Summarize the shows, and quote times, cinemas and prices.

Confirm the live tool list any time with `GET https://api.fetchbean.com/discover?q=pvr` (no key needed).
