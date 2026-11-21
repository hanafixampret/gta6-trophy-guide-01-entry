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
things the app loads are its own `app/data/trophies.json` and
`app/data/steps.json`.

## What is in it

- `app/index.html`, `app/app.js`, `app/style.css` — the guide. No libraries,
  no build step, system fonts only.
- `app/data/trophies.json` — all 55 trophies with the official name,
  description, grade, points and hidden flag, plus kind, missable / one-off
  flags, progress targets, a guide in our own words, and cited sources
  (Exophase, PSNProfiles, PowerPyx, KeenGamer and Push Square where their
  facts are used).
- `app/data/steps.json` — the cited steps behind every guide: 236 numbered
  steps in total (PowerPyx 182, KeenGamer 34, Push Square 13, Exophase 6,
  PSNProfiles 1), each carrying its source beside it, plus each trophy's
  roadmap stage, chapter, mission, "when" line, and Exophase earned rate as
  of 20 November 2026. Checked 21 Nov 2026.
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
4/10 and about 200 hours (Push Square: up to 300 hours), one playthrough, and flags exactly one trophy as
potentially missable: **Positive Mental Attitude**, whose first meditation,
at Jason's house in Chapter 1, is offered once. There is no mission replay,
and cheats disable trophies and saving — so the roadmap does the story first
(with the Chapter 1 meditation done the moment it appears), then the side
strands, then collectibles and activities, then the 100% checklist
(**A Long Road**) and the platinum, **Vice Got a Price!**.

Seven hidden trophies read like single scenes (a cocktail on Ocean
Beach, a showroom smash, a bowling alley) and are flagged as one-off moments
to do when they appear; their methods are now verified from PowerPyx,
KeenGamer and Push Square, including "Bad Luck, I Guess", whose method was
unknown in v2. Three trophies v2 flagged as one-off moments (Personal Best,
Actions Speak Louder, Ten Pin) are grinds, not moments, and are no longer
flagged that way.

Every guide is now numbered steps with the source named beside each step —
236 cited steps across the 55 trophies, with the audit strip in the header
("55/55 guides cited · 236 cited steps · 5 sources, checked 21 Nov 2026")
and a "Sources & audit" tab carrying the source matrix and the six places
where the sources disagree (the final mission's chapter, whether the Chapter 1
meditation is required, the WAiNK count, the method for "Bad Luck, I
Guess", the shooting-range locations, and the hours to platinum), each shown
both ways with the call this guide makes — two of them resolved in v3.

## Sources

- Exophase — Grand Theft Auto VI trophies (PS5):
  <https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/>
- PSNProfiles — Grand Theft Auto VI trophies:
  <https://psnprofiles.com/trophies/43531-grand-theft-auto-vi>
- PowerPyx — GTA 6 Trophy Guide & Roadmap:
  <https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/>
- KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap:
  <https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/>
- Push Square — GTA 6 Trophy Guide and Roadmap:
  <https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap>

Names, descriptions and grades are PlayStation's. Guide text is written for
this page in our own words and never copies another guide. This is an
unofficial fan guide, not affiliated with Rockstar Games, and it uses no
Rockstar logo or artwork.

## License

MIT — see `LICENSE`.
