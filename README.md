# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hanafixampret/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hanafixampret/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Entry for the make.fun bounty **"Build the best GTA 6 trophy guide"**
([gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01)): an offline
web app that guides and tracks all 55 PlayStation 5 trophies of Grand Theft
Auto VI — official names, descriptions and grades, a checklist that saves in
the browser, export and import, filters by kind, a spoiler setting, a platinum
roadmap, missable flags, and a guide in our own words with its sources for
every trophy.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. It works with the network off: the only
thing the app loads is its own `app/data/trophies.json`.

## What is in it

- `app/index.html`, `app/app.js`, `app/style.css` — the guide. No libraries,
  no build step, system fonts only.
- `app/data/trophies.json` — all 55 trophies with the official name,
  description, grade, points and hidden flag, plus kind, missable / one-off
  flags, progress targets, a guide in our own words, and cited sources
  (Exophase, PSNProfiles, and PowerPyx where its facts are used).
- `screenshots/` — four real renders of the app in a browser (see
  `shots.json` for which view each one shows).
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` with
  `vendor/makefun-frontend.ts` (the kit's copy, unchanged).

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## The guide in short

55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN; 0
online — all offline, single-player, 1,350 points. PowerPyx rates the set
4/10 and about 200 hours, one playthrough, and flags exactly one trophy as
potentially missable: **Positive Mental Attitude**, whose first meditation,
at Jason's house in Chapter 1, is offered once. There is no mission replay,
and cheats disable trophies and saving — so the roadmap does the story first
(with the Chapter 1 meditation done the moment it appears), then the side
strands, then collectibles and activities, then the 100% checklist
(**A Long Road**) and the platinum, **Vice Got a Price!**.

Nine more hidden trophies read like single scenes (a cocktail on Ocean
Beach, a showroom smash, a bowling alley) and are flagged as one-off moments
to do when they appear; PowerPyx lists them as not yet pinned down, and the
guide says so rather than claiming a step nobody has checked.

## Sources

- Exophase — Grand Theft Auto VI trophies (PS5):
  <https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/>
- PSNProfiles — Grand Theft Auto VI trophies:
  <https://psnprofiles.com/trophies/43531-grand-theft-auto-vi>
- PowerPyx — GTA 6 Trophy Guide & Roadmap:
  <https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/>

Names, descriptions and grades are PlayStation's. Guide text is written for
this page in our own words and never copies another guide. This is an
unofficial fan guide, not affiliated with Rockstar Games, and it uses no
Rockstar logo or artwork.

## License

MIT — see `LICENSE`.
