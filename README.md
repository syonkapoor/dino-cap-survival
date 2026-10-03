# Dino Cap

A browser remake of **Dino Cap** (Triniti Interactive, 2010), the side-scrolling iPhone shooter that
stopped running when iOS dropped 32-bit apps. Rebuilt from gameplay footage (see
`docs/FIDELITY-PLAN.md`). All art and sound are original, drawn and synthesised in code.

## Run

```sh
npm install
npm run dev -- --port 3000
npm test        # engine + legacy tests
npm run build   # static site in dist/
```

The earlier Dino Cap 2-style build is kept unchanged at `?sequel`.

## Play

- **CITY GRIND:** numbered night-time street levels that go on forever. Each opens with a LEVEL card
  and ends with LEVEL CLEAR! once the clock runs out and the street is quiet. Loot lit doorways for
  cash, ammo and medicine. Walk into **AMMO-COUNTRY** to buy, upgrade and reload.
- **JUNGLE BLITZ:** endless survival on your choice of four maps (Jungle, Wasteland, Cherry Village, Cavern). Weapon crates, ammo and medicine fall from the sky.
- **CHARACTER:** play the Kid or the Warrior Girl and pick hair, skin, outfit colour, jersey number, bow and shoes.
- **RESUME** continues your City Grind save.

The dinosaurs (blue raptors, tan horned raptors, green brutes) only **bite**. They lunge, latch on
and pile onto the kid, and every latched dino keeps chewing until you shake it off.

### Controls

| Touch | Keyboard | Action |
| --- | --- | --- |
| ◀ ▶ red arrows | A/D or ←/→ | Walk. You fire the way you face; there is no aiming |
| Orange | K, Space or X | Fire (in the shop: buy or upgrade) |
| Blue | J or Z | Melee swing, which shakes off every biting dino (in the shop: buy ammo) |
| Green | Q/E/Tab, or W/↑/F at a door | Swap gun, or enter/leave Ammo-Country |
| Pause | Esc or P | Pause |

In the shop, stand under a gun on the wall: orange buys or upgrades it, blue buys ammo. Walk out the
left side to leave.

## Code

- `src/dc1/engine.js`: the simulation, with no DOM. Bite cycle (approach, wind-up, lunge, latch,
  chomp), lane firing per weapon family, melee shove, persistent gore, the storefront street,
  doorway loot, level flow, the walk-in shop and Jungle Blitz drops.
- `src/dc1/data.js`: 25 weapons with rack prices, dinosaur stats and scaling, buildings, the save format.
- `src/dc1/art.js`: inked sprites for the kid, three dinos, gore, guns, clerk and pickups.
- `src/dc1/render.js`: city, jungle and shop scenes, effects, HUD and level cards.
- `src/dc1/audio.js`: synthesised sound effects and music.
- `src/dc1/App.jsx`: loading, title, records, trophies, help, settings, touch controls, pause and death screens.
- `tests/dc1.test.js`: engine tests. `tests/legacy.test.js`: the kept Sequel build.
- `?debug` exposes the live world as `window.__dc` for play-testing.
