# Dino Cap: Survival

A complete React and native Canvas survival game with original procedural jungle art.

## Run

```sh
npm install
npm run dev -- --port 3000
```

`npm run build` produces a static production build in `dist/`.

## Controls

- A/D or left/right arrows: move
- Mouse: aim; hold left-click to attack
- Q/E or 1–4: switch weapons
- Escape: pause

Kill dinosaurs to progress through endless waves. Collect health packs (+25 HP) and ammunition crates (+8 shotgun shells, +40 SMG rounds). Each level requires level × 100 EXP; leveling restores 25 HP. Health starts at 100 every run.

The armory is accessible from the main menu and while paused. Spend earned cash on ammo, +2 damage upgrades, or persistent allies (Soldier: 15,000; Force Knight: 25,000). Cash, level, EXP, ammunition, upgrades, allies, and best kills persist in browser localStorage. Survival runs reset health, waves and kills.

## Structure

- `src/game.js`: frame-rate-independent gameplay, combat, enemy AI, parallax drawing, sound
- `src/main.jsx`: React menus, HUD, persistent profile, armory and input integration
- `src/style.css`: responsive expedition-themed interface

No external sprites or backend required. Google Fonts are optional; system font fallbacks are provided.
