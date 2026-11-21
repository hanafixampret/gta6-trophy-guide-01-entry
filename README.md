# Vice Ledger — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hanafixampret/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hanafixampret/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A free offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a checklist saved in your browser, a roadmap to the platinum, the 6 missables flagged, and a guide to each in our own words that cites its sources.

## What it does

- **Tracker** — checklist over all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze), progress saved in localStorage, with export and import as JSON.
- **Filters & search** — by kind (story, missable, collectibles, activities), by grade, by earned state, plus free-text search.
- **Spoiler setting** — hides the names and descriptions of story trophies until you earn them.
- **Roadmap** — 5 stages to the platinum (story first, map sweep, activities, money & mayhem, the last mile), each with its own progress bar.
- **Missables** — 6 trophies flagged, each with why it can be missed and what to do while the story is live.
- **Next up** — a planner that queues missables first, then the earliest unfinished stage.
- **Cited guides** — every guide names its sources (Exophase for the official list, PSNProfiles for progress targets); where a guide is our advice from the official description rather than a checked fact, it says so. A Sources page lists where the guides disagree and what is still unconfirmed.
- **Two themes** — paper and night, one coral accent. Fully offline: no network requests, no Rockstar art.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Screenshots

```sh
node render-shots.mjs
# writes screenshots/1-checklist.jpg … 4-missables.jpg
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/dossier.json from app/ and screenshots/
```

Built for make.fun's `gta6-trophy-guide-01` bounty ([bounty page](https://make.fun/bounty/gta6-trophy-guide-01)). MIT licensed. Referral: https://make.fun/r/hnbaye7d
