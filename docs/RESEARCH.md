# Dino Cap 1 & 2: reference research and remake fidelity

Research conducted October 2, 2026. Developer: **Triniti Interactive Limited**.

## Sources inspected

1. [Pocket Gamer, November 24, 2010](https://www.pocketgamer.com/dino-cap/free-iphone-game-dino-cap/): contemporaneous reproduction of the original App Store description, weapon names, City Sweep, and Jungle Blitz.
2. [Dino Cap archived listing](https://dino-cap-ios.soft112.com/): publisher description, version history, and four gameplay screenshots. The historical version entries are useful; the aggregator's current release-date/file-size fields are inconsistent and were not used.
3. [Dino Cap 2 HD archived listing](https://dino-cap-2-hd-ios.soft112.com/): publisher description and five landscape gameplay screenshots. Documents five character classes, 25 classic weapons, four super weapons, Arena, egg stealing, and six landscapes.
4. [Level Up review, March 9, 2013](https://levelupreviews.blogspot.com/2013/03/level-up-chop-chop-caveman-dino-cap-2.html): mission objectives include distance, time survival, and dinosaur kills; cash buys ammunition and weapon upgrades; cyborg dinosaurs appear later.
5. [Exophase achievements](https://www.exophase.com/game/dino-cap-2-hd-apple/achievements/): searchable achievement descriptions identify Super Kid, Soldier, Ninja, Warrior Girl, and Jedi/Force Knight, plus character levels and weapon upgrades. These descriptions were visible in search results; the page itself was not used as a source of numerical balance.
6. [Modojo review, July 26, 2011](https://modojo.com/article/3452/dino_cap_2_hd): search excerpt identifies Force Knight, a light sword, character selection, currency, and EXP. Direct page access was unavailable.
7. [Dino Cap gameplay, iPadgameplays](https://www.youtube.com/watch?v=KUCOiETc8tI) and [Dino Cap 2 HD gameplay, TouchGameplay](https://www.youtube.com/watch?v=T64hTe93o6A): titles and metadata located in search, matching the user's visual references. Full video playback was unavailable in this environment. They were not treated as watched footage.
8. The user's two supplied screenshot collages: additional primary visual references for the jungle and on-screen controls.

Brave search provided discovery when other search providers or older review pages were unavailable. Raw readable page captures and downloaded reference screenshots are in `docs/research/`; those research images are **not** shipped as game art.

## Observed differences

| Feature           | Dino Cap (2010)                                | Dino Cap 2 HD (2011)                                                       |
| ----------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| Main play formats | City Sweep, Jungle Blitz                       | Missions, Arena                                                            |
| City Sweep        | Level progression; cash; Ammo Country shop     | Not the central documented format                                          |
| Jungle Blitz      | Time survival; random weapon/ammo pickups      | Jungle also appears as a mission/arena environment                         |
| Characters        | Original dark-skinned chibi survivor           | Super Kid, Soldier, Ninja, Force Knight, Warrior Girl                      |
| Progression       | Earn cash and purchase guns                    | Character EXP/levels and weapon upgrades                                   |
| Objectives        | Clear dinosaurs or survive                     | Kill, survive, travel, steal eggs                                          |
| Visual controls   | Two red arrows, blue and orange action circles | Two red arrows, blue, orange and green action circles                      |
| Environments      | Apocalyptic city, jungle                       | Six landscapes; screenshots show jungle, cherry village, wasteland, cavern |
| Later enemies     | Large/blue variants                            | Armored/cyborg variants visible in screenshots                             |

## Visual reconstruction

The remake removes the earlier web-dashboard presentation. The landscape game is the main interface. It uses a thick-outlined red health bar at top left, a narrow EXP strip, a white skewed ammo counter, yellow cash values, a skull/mission counter or timer, an outlined pause icon, red movement triangles, and colored circular action controls. Heroes have oversized heads and expressive eyes; dinosaurs have hunched bodies, angular heads, teeth, tails, claws, and optional armor. Backgrounds have cached parallax layers, vines, flowers, foreground foliage, city structures, blossom trees, caves, and weather.

Menus and armory boards are reconstructed from the documented game's visual language. Archived sources available during this pass do not show every original menu, so these layouts should not be represented as pixel-exact copies of unobserved screens.

## Mechanics implemented

- Selectable Classic and Sequel editions.
- Classic: City Sweep kill missions and Jungle Blitz endless survival, including random temporary weapon pickups. Ammo Country can be entered with F near its world marker or from pause.
- Sequel: selectable kill, survival, distance, and egg missions, persistent day progression, endless Arena, six selectable landscapes, character selection and health upgrades, and armored dinosaurs in later waves.
- Persistent cash, level, EXP, ammo, unlocked weapons, upgrades, heroes, mercenary allies, day and best kills. Earlier save formats are migrated.
- 25 standard weapon entries and four super entries. The first four retain the user's requested base damage values: club 5, handgun 10, shotgun 25 total across three pellets, TEC-DC9 6.
- Weapon family behaviors: melee, handgun, shotgun spread, automatic SMG/rifle, explosive launcher, penetrating saw/laser, short-range flame, and force projectiles.
- Red damage flash, cartoon hit particles, floating damage/rewards, health/ammo drops, knockback resistance, acid spit, and automatic allies.
- Original-style on-screen controls plus the requested desktop aiming and Q/E switching. Blue performs melee, orange fires, green performs a special attack. This assignment is a functional reconstruction; screenshots alone do not prove the original buttons' complete behavior.

## Fidelity limits

The original executable, sprite sheets, animation timelines, full menu footage, exact weapon costs/stats, enemy tables, and original audio were not available. Therefore this is a playable reconstruction, **not an exact emulation**.

The initial four weapon stats and mercenary costs follow the user's specification. Extended weapon damage, fire rates, ammo packs, upgrade prices, hero prices/health upgrades, mission targets/rewards, and special attacks are explicitly remake balance values. The publisher's classic weapon list contains naming/count inconsistencies; the browser catalog has 25 standard slots. The club stands in for the initial melee weapon. "M16A4" normalizes the listing's "m164". Light Sword, Force Throw, and Ninja Stars are documented; the fourth super slot, Warrior Crate, is reconstructed from the visible Warrior Girl crate attack, not a verified original inventory name. Frozen Frontier fills the sixth landscape slot; its original name was not verified. No purchases use real money and no Game Center integration is claimed.
