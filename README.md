# The Kencana Job

A midnight museum heist game — a complete, original entry for make.fun's
["Make the best heist game"](https://make.fun/bounty/best-heist-game-20261122-0559) bounty ($50 in USDC).

One thief. One museum. Three relics before dawn. Slip past the guards' vision
cones and the sweeping security cameras, time the laser gate, lift the Ruby of
Kencana, and vanish out the green door.

## Play it

Serve `game/` over HTTP (ES modules need it — opening the file directly will not work):

```sh
cd game && python3 -m http.server 8000
```

Then open http://localhost:8000 — WASD / arrows to move, Shift to sneak, M to mute, R to restart.

## The game

- One museum room, readable in a single frame: thief, guards, cameras, loot, lasers and alarm meter
- 3 guards (Bram, Sari, Dedi) with raycast vision cones — patrol, suspicious, chase
- 2 wall cameras sweeping the gallery
- 3 relics to lift: the Golden Kris, the Jade Mask, the Ruby of Kencana (behind the laser gate)
- Alarm meter 0–100: seen in a cone it climbs, hidden it falls, at 100% you are caught
- Sneak mode (slower, harder to spot), shadow patches that hide you, blinking lasers to time
- WebAudio-synthesized sounds — no audio files, no network requests
- 4 screenshots in `screenshots/` (cover, alert, vault, title)

Built with vanilla JavaScript and canvas. `main.ts` is the make.fun hand-in program
that copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
