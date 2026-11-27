# Gobble Run — The Great Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/encoderrrr/turkey-run-27nov/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/encoderrrr/turkey-run-27nov/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A turkey escape game built for the [make.fun turkey-run-game-01 bounty](https://make.fun/bounty/turkey-run-game-01).

Farmer Barlow wants you for Thanksgiving dinner. Run 1,200 metres through the
farmyard, the pumpkin patch, the kitchen yard and the forest edge — jump the
fences, hay bales and the glowing HOT oven, duck under the flying carving
knives, grab corn for points, and don't let the farmer catch you. Three
stumbles and it's over; reach the forest and Thanksgiving is cancelled.

## Play

Open `game/index.html` in a desktop browser (served by any static server, or
just open the file — it needs no network and no build step).

- **Space / ↑ / W** — jump (press again mid-air for a double flap)
- **↓ / S** — duck under the carving knives
- **Click** — start, restart, and jump while running
- **P** — pause, **M** — mute, **R** — restart after being caught or escaping

## The game

- 2D side-view runner on a single canvas; every sprite is drawn in code and
  every sound is synthesised with WebAudio — no image or audio files, no
  network requests.
- Four stages that grow harder: the farmyard, the pumpkin patch, the kitchen
  yard (ovens everywhere) and the forest edge. Speed rises with distance.
- HUD: score, distance left to the forest, three lives, speed, and a farmer
  meter showing how close Barlow is behind you.
- A title screen, a run in play, and two end screens — ESCAPED! and CAUGHT!
  — each with a restart.
- Original art, music, sounds and names, made for this bounty.

## Layout

- `main.ts` — the hand-in program (Node 22, stdlib only): copies `game/` and
  `screenshots/` to the output directory and writes `dossier.json`.
- `game/index.html` — the page; `game/src/` holds one module per job:
  `config` (tuning and palette), `random` (seeded RNG), `audio` (synth
  sounds and music), `input` (keyboard and mouse), `turkey` and `farmer`
  (the characters), `world` (scenery, obstacles, pickups), `render` (HUD
  and screens), `main` (loop, physics, collisions, states).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — four real renders of the game in a desktop browser:
  title, a run in play, dodging the oven and a knife, and the escape.

## Run it

```sh
# Serve the game locally and play it at http://localhost:8080
node serve.ts

# Build the hand-in output (deterministic: two runs are byte-identical)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
