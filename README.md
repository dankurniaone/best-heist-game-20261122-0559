# The Marlowe Job — a museum heist game

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/dankurniaone/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/dankurniaone/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

An entry for the [make.fun bounty "Make the best heist game"](https://make.fun/bounty/best-heist-game-20261122-0559): a complete, original stealth-heist game that runs offline in a desktop browser from static files.

## The job

You are Rook, a thief with one night to hit the Marlowe Museum. Three rooms, one take:

1. **The Marlowe Gallery** — steal the Star of Marlowe diamond from its case, then slip out the service door.
2. **The Vault Hall** — crack the vault (hold E), take the gold, cross the laser grid.
3. **Rooftop Getaway** — the alarm is already hot. Reach the skylight with the loot.

## How it plays

- **WASD / arrows** — move. **Shift** — sneak (slow, hard to spot). **E** — grab loot, crack the vault, crawl the vents. **Q or click** — throw a smoke bomb (3 per room). **R** — EMP burst, blinds every camera for 8 seconds. **P** — pause.
- **Guards** patrol waypoint loops with vision cones. Being seen fills suspicion; a full bar gives you a fair warning — a red "!" and a grace second — before the guard gives chase. Break line of sight and the guard searches your last seen spot, then walks back.
- **Cameras** sweep red cones across the room. **Lasers** (Vault Hall) slide a gap along each beam — time your crossing.
- **The alarm** (0–100%) rises while anyone sees you and bleeds off in the dark. At 100% the museum locks down and you are caught. Three lives per run.
- **Routes:** every room has more than one way through — the open floor, a side corridor, and an old air vent (hold E at a grate to crawl through). Loot is a choice, not a chore: paintings and gold bars pay, but every second in the open is risk.
- **Scoring:** loot value + time bonus under par + a $5,000 Ghost bonus when the alarm never passes 25%. Ratings: Ghost, Professional, Smash-and-Grab.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no libraries. `main.ts` (Node 22) hands the entry in: it copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

## Structure

| File | Job |
| --- | --- |
| `game/src/main.js` | Boot + fixed-step loop |
| `game/src/game.js` | Screens, rules, scoring |
| `game/src/levels.js` | The three hand-drawn rooms |
| `game/src/player.js` | The thief: movement + stance |
| `game/src/guard.js` | Patrol AI, cones, suspicion, chase |
| `game/src/security.js` | Cameras, lasers, the alarm meter |
| `game/src/render.js` | Every pixel: floor plan, HUD, screens |
| `game/src/geom.js` | Collision + line of sight |
| `game/src/input.js` | Keyboard + mouse |
| `game/src/audio.js` | Synthesized sound effects |
| `game/src/shots.js` | Staged screenshot scenes |
| `game/src/config.js` | Constants + palette + tuning |
| `main.ts` | Entry point: builds `/output` + dossier |
| `serve.ts` | Local static server |
