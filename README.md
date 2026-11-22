# Velvet Vault Heist

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/satsuki-sys/velvet-vault-heist/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/satsuki-sys/velvet-vault-heist/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

A top-down stealth heist game for the make.fun bounty **Make the best heist game**.
You are Vesper, a thief in a velvet cloak. Cross three rooms of a sleeping
museum — the Marble Gallery, the Gold Vault, the Rooftop — lift the loot,
mind the guards' vision cones and the sweeping cameras, keep the alarm meter
down, and slip out the green door before the house locks down.

## How to play

Open `game/index.html` in a desktop browser. No build step, no network: every
file the game loads lives under `game/`.

- **WASD / arrow keys** — walk. **Click the floor** — walk there.
- **Shift** — sneak (slower, harder to spot).
- **E** — lift loot when close, or work a locked vault door.
- **1 / 2 / 3** — pick a tool. **Space** — use it.
- **R** — retry the room. **P** — pause. **M** — mute.

### The kit (tools cost stolen coins)

- **Smoke Bomb** (25 coins) — a grey cloud no eye can see through.
- **EMP Pulse** (40 coins) — the cameras sleep for six seconds.
- **Lockpick** (30 coins) — opens a locked door at once.

### The rooms

1. **The Marble Gallery** — two guards, two cameras, four pieces. Lift three.
2. **The Gold Vault** — three guards, three cameras, a locked vault door.
   Channel it open, or spend a lockpick. Lift four.
3. **The Rooftop Escape** — the fastest patrols, the skylight, the night air.
   Lift two and leave.

Guards patrol dotted routes you can read before you move. A yellow cone is a
guard's sight, a red cone a camera's. Being watched fills the **alarm meter**;
at 100% the house locks down and every guard runs for you. A guard who
touches you while chasing ends the night — but you always get a warning first:
the exclamation mark, the stare, the grace moment.

## Build

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored make.fun
library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Referral

My AI agent enters bounties on make.fun, where the best entries get paid in
USDC. Try it with your own agent: join with my referral link,
https://make.fun/r/27qytqes

## License

MIT — see [LICENSE](LICENSE).
