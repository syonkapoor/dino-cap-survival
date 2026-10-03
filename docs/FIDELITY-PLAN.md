# Dino Cap: plan to match the real game

> **Status (2026-10-02): all six phases are implemented** on branch `feat/dino-cap-1-fidelity`.
> The art is original, code-drawn and inked (no Triniti assets); real hand-drawn sprite sheets would
> be the next step up in fidelity. Still open: the unconfirmed items at the end of this file.

Written 2026-10-02 from actual footage of Dino Cap 1 (Triniti Interactive, 2010; last version 1.9.8,
App Store id 371264271). The first build was made from text and Dino Cap 2 screenshots only.
`docs/RESEARCH.md` says playback was unavailable, which is why the remake drifted toward Dino Cap 2.

## What the footage shows (and the remake gets wrong)

Sources watched frame by frame:
- `0Lrzj_mxY2Q`: official trailer, May 2010
- `_4w82l4SiQo`: iPod launch-era gameplay
- `KUCOiETc8tI`: iPad HD Jungle Blitz, 2010
- `c8J3mJP3zgg`: v1.9.8, level 999999
- `I_u-hd4LCzw`: v1.9.8, levels 1 to 10
- `LN18xqBvyFw`: narrated review

| Topic | Real Dino Cap 1 | Current remake |
|---|---|---|
| Modes | **CITY GRIND** (numbered levels, unlimited, randomly generated) and **JUNGLE BLITZ** (endless survival). Menu: JUNGLE BLITZ / CITY GRIND / RESUME, plus leaderboard, trophy, help and settings icons | City Sweep / Jungle Blitz plus a whole Dino Cap 2 "Sequel" edition |
| Aiming | None. The kid fires straight along the street in the direction he faces | Mouse aim at any angle |
| Buttons | Red ◀ ▶. **Orange = fire. Blue = melee** (bat, crowbar or club that knocks dinos back). A green round button sits on the right edge in both modes; probably weapon swap (unconfirmed) | Orange/blue plus a green Sequel "special" |
| Dino attacks | **They only bite.** They lunge with open jaws, pile onto the kid as an overlapping pack and chew him | Blue "mutant" spits acid projectiles |
| Dino types | Blue spiky raptor (common, fast). Tan horned raptor (tougher). Big green brute with a skull-like head (appears around level 8+). Store copy: "some fast, some big, some tough, some blue." | Raptor, brute, blue acid mutant |
| Gore | Heads pop. Eyeballs and meat chunks fly. Blood pools and chunks stay on the pavement for the whole level | Particles that disappear |
| City level | One night street that scrolls right: DELI, CHECKS CASHED, AMMO-COUNTRY, LAUNDR-O-MAT, JUMBO-MART, MOTEL, green houses with red doors, streetlights, hydrants, storm drains, newspapers, a crane skyline | Generic city backdrop, shop at a fixed x |
| Looting | Open doorways show a floating loot icon ("$20", "×25" ammo). Walk through to grab it; the doorway then goes dark | Ammo crates on a timer |
| Level flow | "LEVEL 9" card, then about 60 to 90 s of street, then **"LEVEL CLEAR!"**. Cash carries over between levels, and difficulty keeps scaling | Kill-count missions |
| Shop | **AMMO-COUNTRY is a storefront in the level.** You walk in mid-level and the interior is the same side-view room with the same HUD. Striped wallpaper, an orange slatted wall with guns hung on it, a **pinned price tag under each gun ($300 revolver, $350 lever-action, then $550 to $2,500)**, a second **"LV" upgrade tag**, a med kit for $50, and a fat clerk (cap, goatee, tattoos) leaning on the counter at left, pointing. Blue checkered floor. Prices rise as the LV goes up | React menu overlay |
| HUD | Top left: blue weapon tile in a black badge, orange health bar, white skewed "×22" ammo box. Top centre: big yellow outlined **$830**. Top right: pause. Jungle Blitz swaps the cash for a crossed-out-dino kill count and a 00:00 timer | Similar, but in the Sequel style with a level/EXP strip |
| Jungle Blitz | Night jungle. **Weapon crates and ammo fall from the sky** (crates have a glow ring). Pickups pop up as "×8" or "×10". Med bottles give "HP+25" | Mostly matches |
| Death | Black screen with dripping red **YOU DIED**, then SURVIVAL TIME / DINOS KILLED / MONEY EARNED / DONE. One run: 2:21, 81 kills, $2,970 (about $36 per kill) | Results panel |
| Art | Hand-inked comic style: thick black outlines, flat colours, slightly wobbly lines. A chibi kid with a white #8 jersey, red trim and red shoes | Procedural vector art, cleaner and Sequel-flavoured |

Weapons (from the App Store copy):
- Pistols: USP .45, .44 Magnum, M9, Desert Eagle
- Shotguns: SPAS-12, AA-12, M1014, Model 1887
- Rifles and MGs: SCAR-H, M16, AK-47, M61
- SMGs: TEC-DC9, MP5K, UMP45, KRISS
- Launchers: grenade, rocket, buzz-saw
- Melee: spiked club, crowbar, fireman's axe, chainsaw
- Other: flamethrower, laser gun

## The plan

### Phase 0: pick the target (½ day)
- Make **Dino Cap 1 the game.** Hide the Sequel edition behind a dev flag; the code stays, the menu stops offering it.
- Remove the hero select, EXP and level-up heal, allies/mercenaries, specials and the green special button from the default path.
- Rename City Sweep to **City Grind**.
- New title screen: loading silhouette (crane skyline, crooked streetlights), then the logo with JUNGLE BLITZ / CITY GRIND / RESUME and four round icon buttons.
- **During play the canvas is full-screen landscape with no site header or footer.** This also fixes the cramped phone layout.

### Phase 1: dinos bite back (1 to 2 days). Your top ask
- **Delete the acid projectile path** (`acid: true` in `game.js`). No enemy ever spawns a bullet; enemy damage happens only on contact.
- **Bite cycle per dino:**
  1. **Approach:** walk speed by type.
  2. **Lunge:** when within about 160 px, crouch for 0.15 s, then leap about 90 px with the jaw open.
  3. **Clamp:** on contact, set a `latched` state. The sprite overlaps the kid and plays a chomp loop. It deals damage every bite tick (raptor 6 per 0.55 s) and the kid's sprite flashes red.
  4. **Release:** a hit, knockback or melee swing breaks the latch.
- **Packs pile up.** Several dinos can be latched at once, drawn overlapping, slightly offset and z-sorted. That gives the "swarm eating the kid" image from your first screenshot. Damage stacks, so getting surrounded is how you die.
- **Melee (blue)** knocks back every dino within reach in front and breaks latches. It's the escape button, as in the trailer.
- **Roster:**
  - Blue raptor: 20 HP, fast, from level 1.
  - Tan horned raptor: 45 HP, medium, from about level 3.
  - Green brute: 150 HP, slow, big bite, resists knockback, from about level 8.
  - Every type's HP and spawn rate scale with the level number, without limit.
- **Gore that persists:**
  - On death: head pop, 2 eyeballs and 3 to 6 meat chunks thrown on arcs, then a blood pool decal.
  - Chunks and pools stay on the pavement layer until the level ends, capped at about 150 decals and baked into an offscreen canvas for speed.
  - The corpse slumps and fades after about 2 s.
- Tests: no enemy projectiles ever exist; latch damage stacks; melee breaks the latch; corpses leave persistent decals.

### Phase 2: real controls and firing (1 day)
- Remove mouse aim. **Facing = last direction moved.** Fire along that lane at chest height, with a little random vertical jitter for bullets.
- Buttons:
  - Orange: hold to fire.
  - Blue: melee.
  - Green circular button on the right edge: swap weapon. Same layout and positions as the screenshots.
- Keyboard: A/D or arrows, K/Space = fire, J = melee, Q/E or the green key = swap.
- Weapon behaviour along the lane:
  - Shotgun: short spread and big knockback.
  - Flamethrower: a short cone that stays on screen.
  - Buzz-saw: piercing discs that fly the full screen.
  - Rocket and grenade: smoke-cloud explosions.
  - Laser: a full-screen beam.
  - Melee weapons: one-button combos.

### Phase 3: the City Grind street (2 to 3 days)
- **Procedural street from building chunks:** DELI, CHECKS CASHED, AMMO-COUNTRY, LAUNDR-O-MAT, JUMBO-MART, MOTEL, green house with a red door, empty lot.
  - Every level has at least one AMMO-COUNTRY.
  - Signs use their own lettering colours: blue/orange, yellow, green, purple.
- **Lootable doorways:**
  - Each door rolls cash ($20 to $50, scaling), ammo (×8 to ×25 for the current gun) or a med kit.
  - The loot icon floats in the lit doorway. Walking through collects it with a popup, and the doorway switches to its dark, broken state.
- **Level flow:**
  - "LEVEL N" card, then the street (60 to 90 s, or reach the end), then "LEVEL CLEAR!", then the next level.
  - Cash, guns and ammo persist. Health refills between levels.
  - Spawns come from both screen edges.
- Night palette:
  - Slate-blue sky, darker skyline silhouette with cranes and billboards.
  - Streetlights with glow, a kerb with storm drains, a grey road with dashes and blowing newspapers.

### Phase 4: the Ammo-Country shop (2 days). Your other top ask
- **Entering:** stand at the AMMO-COUNTRY door and the green button (or W/F) pulses. Press it, fade to black, then the interior. Walk off the left edge, or press the green button at the exit, to fade back to the street at the same spot.
- **The interior is a playable side-view room, not a menu.** It keeps the same HUD, ◀ ▶ moves the kid along the counter, and no dinos spawn.
  - **Back:** white and light-blue striped wallpaper.
  - **Wall:** a long orange slatted rack with guns hung at angles.
  - **Tags under each gun:** a price tag (`$ 300`), a **"LV n" upgrade tag** and an ammo-refill price.
  - **Counter:** a wooden counter with vertical planks, over a blue checkered floor.
  - **Clerk** at the far left: a big fat guy in a cap with a goatee and a tattooed arm, leaning on the counter and pointing at the guns. Idle animation plus a short line when you buy.
- **Buying:** the item above the kid highlights. Orange buys or upgrades the gun; blue buys ammo for it.
  - Prices follow the observed scale: revolver 300, lever-action 350, then 550, 600, 650, 800, 900, 1000, 1700, 2500, with upgrade prices rising per LV.
  - Med kit 50.
  - The rack scrolls as you walk, and more of the 25 guns are hung as levels unlock them.
- Leave out the MINI PACK / MEGA PACK real-money buttons, or draw them greyed out.
- Tests: buy deducts cash once and adds the gun; can't buy without cash; upgrade raises LV and price; leaving restores the street position.

### Phase 5: HUD, Jungle Blitz, pause, death (1 to 2 days)
- **City HUD, rebuilt to match:**
  - Top left: blue weapon tile in a black badge, orange bar, white skewed ammo box.
  - Top centre: yellow outlined `$` cash.
  - Top right: a hand-drawn pause icon.
- **Blitz HUD:** a crossed-out-dino icon plus kill count, and an italic yellow 00:00 timer.
- **Jungle Blitz:** crates fall from the sky with a glow ring. Ammo pickups pop "×N" with the ammo icon, and med bottles give HP+25.
- **Pause:** PAUSED with FX ON/OFF, MUSIC ON/OFF, BACK, MENU.
- **Death:** dripping-blood YOU DIED with SURVIVAL TIME, DINOS KILLED, MONEY EARNED and DONE.
- **Leaderboard:** a local best-runs list instead of Game Center.

### Phase 6: the hand-drawn look (largest, 4 to 7 days; can run in parallel)
- Procedural canvas shapes will not reach the inked comic look. **Switch to sprite art:**
  - Draw (or AI-assist, then hand-clean) **original** layered PNG or SVG sprites in that style.
  - Kid (idle, walk, 4 gun holds, melee swing, hit, death).
  - Each dino (walk, lunge, latched-chomp, hit, death or head pop).
  - Gore pieces, the storefront chunks, and the shop room plus clerk.
- Render with `drawImage` from an atlas, adding thick-outline consistency and a slight squash on hits.
- Comic display font for numbers and cards.
- **Do not lift Triniti's sprites, logo or audio**, even though the footage would make that easy. Recreate the style; don't copy the assets. Fine for a private remake, but if you publish it, change the name ("Dino Cap" is Triniti's title).

### Suggested order
Phase 0 → **1 (bites)** → 2 (controls) → **4 (shop)** → 3 (street) → 5 (HUD and screens), with 6 (art) alongside.
Phases 1 and 4 are the two you asked for and change the feel the most. Roughly 2 to 3 weeks of focused work in total.

## Still unconfirmed
- The green button's exact function (weapon swap is the best guess; it also shows in the shop).
- "Hide in houses" from the App Store copy: possibly a doorway that blocks dinos briefly. Not seen in footage.
- Exact weapon damage, fire rate and ammo-pack sizes. Use the observed prices and tune the rest by feel.
- Whether a level ends on a timer or at a street length. The footage suggests about 60 to 90 s each.
