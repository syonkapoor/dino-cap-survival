# Dino Cap — Classic & Sequel

A playable React + native HTML5 Canvas recreation of the Triniti Interactive side-scrolling dinosaur games, with selectable Classic and Sequel modes and original procedural cartoon art.

## Run

```sh
npm install
npm run dev -- --port 3000
```

```sh
npm test
npm run build
```

The production build is in `dist/` and can be served by any static web host.

## Play

- **Classic:** City Sweep (kill missions + Ammo Country) or Jungle Blitz (endless survival + random weapon drops).
- **Sequel:** kill, timed survival, distance, and egg missions; or endless Arena.
- Choose among six landscapes in Sequel. Unlock five heroes in the Armory; their health can be upgraded.
- Earn cash and EXP by defeating dinosaurs. Every level restores 25 HP. Health packs restore 25 HP, capped at max health. Ammo crates refill multiple weapon types.
- Spend cash on 25 standard weapons, four super weapons, ammo refills, +2 damage upgrades, and mercenaries. Soldier costs 15,000; Force Knight costs 25,000.

### Controls

| Input                     | Action                                         |
| ------------------------- | ---------------------------------------------- |
| A/D or left/right arrows  | Move                                           |
| Mouse + hold left-click   | Aim and fire                                   |
| Q/E                       | Cycle unlocked weapons                         |
| 1–4                       | Select initial weapons                         |
| J / blue action circle    | Melee                                          |
| K / Space / orange circle | Fire                                           |
| L / green circle          | Special attack (Sequel; 3 energy, 3s cooldown) |
| F near Ammo Country       | Enter shop (City Sweep)                        |
| Escape / pause icon       | Pause and resume                               |

The red arrows and circular actions support pointer capture and simultaneous touch input. Keyboard/mouse controls work alongside them. Pause to switch any unlocked weapon, visit the Armory, or return to the menu.

Cash, level, EXP, ammunition, unlocked weapons, weapon upgrades, heroes, hired allies, mission day, and best kills persist in localStorage. Saves from the first version migrate automatically. Health, elapsed time, waves and run kills reset each run. Random Jungle Blitz weapon unlocks last only for that run.

## Architecture

- `src/data.js`: weapon/hero/mode definitions, versioned profile schema and save migration
- `src/game.js`: frame-rate-independent simulation, combat, enemy/ally AI, objectives, sound and callbacks
- `src/render.js`: cached parallax environment layers, procedural hero/dinosaur/weapon rendering
- `src/main.jsx`: React application, screen transitions, input binding and persistent profile
- `src/Hud.jsx`: gameplay HUD and touch controls
- `src/Shop.jsx`: weapon, ammunition, hero and mercenary purchases
- `src/Art.jsx`: reusable Canvas portraits and weapon illustrations
- `src/style.css`: responsive arcade interface, landscape and portrait layouts
- `tests/game.test.js`: regression checks for combat, progression, objectives, saves and pause behavior

## Reference fidelity

See [docs/RESEARCH.md](docs/RESEARCH.md) for inspected sources, observed features, reconstructed details, and limitations. The visual layout and documented game formats have been recreated; hidden balance, original assets, full animation and unobserved menus are not claimed to be exact. Research screenshots are stored for reference and are not used as production artwork. No backend, paid purchases, or external sprite assets are required. Google Fonts are optional, with system fallbacks.
