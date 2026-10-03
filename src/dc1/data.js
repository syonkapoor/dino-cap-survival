// Dino Cap (Triniti, 2010) data, reconstructed from gameplay footage.
// See docs/FIDELITY-PLAN.md. Rack prices are a ladder: every weapon costs at
// least $100 more than the one before it, and the steps widen toward the top
// ($100, $150, $200, $300, $400). Damage, fire rate and ammo pack sizes are
// remake balance values.

export const GROUND_Y = 440; // feet line on the street, in logical pixels
export const VIEW_H = 540;
export const SAVE_KEY = "dino-cap-1-save";
export const SAVE_VERSION = 1;

// family drives firing behaviour and the ammo icon in the HUD badge.
// unlock = the City Grind level from which the clerk hangs it on the rack.
export const WEAPONS = [
  // melee (blue button). The club is what the kid starts with.
  { id: "club", name: "Spiked Club", family: "melee", damage: 9, rate: 0.34, reach: 185, knock: 300, price: 0, unlock: 1 },
  { id: "crowbar", name: "Crowbar", family: "melee", damage: 15, rate: 0.32, reach: 192, knock: 340, price: 600, unlock: 2 },
  { id: "axe", name: "Fireman's Axe", family: "melee", damage: 28, rate: 0.4, reach: 200, knock: 380, price: 1500, unlock: 6 },
  { id: "chainsaw", name: "Chainsaw", family: "melee", damage: 9, rate: 0.07, reach: 195, knock: 140, price: 4200, unlock: 9 },
  // guns (orange button)
  { id: "usp", name: "USP .45", family: "pistol", damage: 10, rate: 0.3, range: 720, price: 0, unlock: 1, ammoPack: 60, ammoPrice: 40, startAmmo: 120 },
  { id: "magnum", name: ".44 Magnum", family: "pistol", damage: 26, rate: 0.5, range: 760, pierce: 1, price: 200, unlock: 1, ammoPack: 30, ammoPrice: 60, startAmmo: 36 },
  { id: "m1887", name: "Model 1887", family: "shotgun", damage: 9, pellets: 5, rate: 0.75, range: 380, price: 300, unlock: 1, ammoPack: 16, ammoPrice: 70, startAmmo: 22 },
  { id: "m9", name: "M9", family: "pistol", damage: 13, rate: 0.2, range: 720, price: 400, unlock: 2, ammoPack: 80, ammoPrice: 60, startAmmo: 120 },
  { id: "tec9", name: "TEC-DC9", family: "smg", damage: 7, rate: 0.085, range: 600, price: 500, unlock: 2, ammoPack: 150, ammoPrice: 80, startAmmo: 200 },
  { id: "mp5k", name: "MP5K", family: "smg", damage: 9, rate: 0.08, range: 650, price: 700, unlock: 3, ammoPack: 150, ammoPrice: 100, startAmmo: 200 },
  { id: "deagle", name: "Desert Eagle", family: "pistol", damage: 38, rate: 0.45, range: 800, pierce: 1, price: 800, unlock: 3, ammoPack: 30, ammoPrice: 110, startAmmo: 40 },
  { id: "spas12", name: "SPAS-12", family: "shotgun", damage: 12, pellets: 6, rate: 0.6, range: 400, price: 900, unlock: 3, ammoPack: 20, ammoPrice: 120, startAmmo: 30 },
  { id: "ump45", name: "UMP45", family: "smg", damage: 12, rate: 0.09, range: 680, price: 1050, unlock: 4, ammoPack: 150, ammoPrice: 140, startAmmo: 200 },
  { id: "m1014", name: "M1014", family: "shotgun", damage: 13, pellets: 6, rate: 0.38, range: 400, price: 1200, unlock: 4, ammoPack: 24, ammoPrice: 160, startAmmo: 36 },
  { id: "ak47", name: "AK47", family: "rifle", damage: 16, rate: 0.11, range: 900, price: 1350, unlock: 4, ammoPack: 120, ammoPrice: 180, startAmmo: 180 },
  { id: "m16", name: "M16", family: "rifle", damage: 18, rate: 0.1, range: 900, price: 1700, unlock: 5, ammoPack: 120, ammoPrice: 200, startAmmo: 180 },
  { id: "grenade", name: "Grenade Launcher", family: "launcher", damage: 70, rate: 0.8, splash: 120, speed: 620, arc: true, price: 1900, unlock: 5, ammoPack: 10, ammoPrice: 260, startAmmo: 12 },
  { id: "kriss", name: "KRISS", family: "smg", damage: 13, rate: 0.055, range: 700, price: 2100, unlock: 6, ammoPack: 200, ammoPrice: 260, startAmmo: 240 },
  { id: "scarh", name: "SCAR-H", family: "rifle", damage: 30, rate: 0.13, range: 950, pierce: 1, price: 2400, unlock: 6, ammoPack: 100, ammoPrice: 300, startAmmo: 140 },
  { id: "aa12", name: "AA-12", family: "shotgun", damage: 14, pellets: 6, rate: 0.2, range: 420, price: 2700, unlock: 7, ammoPack: 40, ammoPrice: 340, startAmmo: 60 },
  { id: "saw", name: "Buzz-Saw Launcher", family: "saw", damage: 45, rate: 0.5, speed: 760, pierce: 99, price: 3000, unlock: 7, ammoPack: 20, ammoPrice: 380, startAmmo: 30 },
  { id: "flame", name: "Flamethrower", family: "flame", damage: 7, rate: 0.06, range: 230, price: 3400, unlock: 8, ammoPack: 200, ammoPrice: 420, startAmmo: 300 },
  { id: "rocket", name: "Rocket Launcher", family: "launcher", damage: 130, rate: 0.95, splash: 150, speed: 820, price: 3800, unlock: 8, ammoPack: 8, ammoPrice: 480, startAmmo: 10 },
  { id: "m61", name: "M61", family: "rifle", damage: 14, rate: 0.04, range: 900, price: 4600, unlock: 8, ammoPack: 300, ammoPrice: 520, startAmmo: 400 },
  { id: "laser", name: "Laser Gun", family: "laser", damage: 60, rate: 0.55, range: 1100, pierce: 99, price: 5400, unlock: 9, ammoPack: 30, ammoPrice: 700, startAmmo: 40 },
];
export const WEAPON = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));
export const isMelee = (id) => WEAPON[id]?.family === "melee";
export const GUNS = WEAPONS.filter((w) => w.family !== "melee");
export const MELEES = WEAPONS.filter((w) => w.family === "melee");

// Upgrades: each LV adds 25% damage. Price grows with LV.
export const MAX_LV = 10;
export const upgradePrice = (id, lv) =>
  Math.round((Math.max(WEAPON[id].price, 250) * 0.55 * lv) / 10) * 10;
export const damageFor = (id, lv = 1) => WEAPON[id].damage * (1 + 0.25 * (lv - 1));
export const MEDKIT = { id: "medkit", name: "Med Kit", price: 50, heal: 50 };

// "some fast, some big, some tough, some blue." Every dinosaur bites; none shoot.
export const DINOS = {
  raptor: { name: "Blue Raptor", hp: 20, speed: 130, lungeRange: 300, lungeSpeed: 560, lungeDist: 210, bite: 5, biteRate: 0.5, knockResist: 0, width: 145, reward: 8, blitzReward: 30, from: 1 },
  horned: { name: "Horned Raptor", hp: 46, speed: 108, lungeRange: 290, lungeSpeed: 500, lungeDist: 190, bite: 7, biteRate: 0.55, knockResist: 0.25, width: 155, reward: 15, blitzReward: 45, from: 3 },
  brute: { name: "Green Brute", hp: 150, speed: 70, lungeRange: 300, lungeSpeed: 400, lungeDist: 160, bite: 14, biteRate: 0.8, knockResist: 0.75, width: 215, reward: 40, blitzReward: 90, from: 8 },
};
export const dinoStats = (type, level = 1) => {
  const d = DINOS[type],
    l = Math.max(0, level - 1);
  return {
    ...d,
    hp: Math.round(d.hp * (1 + 0.12 * l)),
    speed: d.speed * Math.min(1.35, 1 + 0.02 * l),
    bite: d.bite * (1 + 0.06 * l),
    reward: Math.round(d.reward * (1 + 0.1 * l)),
  };
};

// Storefronts seen along the City Grind street.
export const BUILDINGS = {
  deli: { sign: "DELI", w: 420, loot: true },
  checks: { sign: "CHECKS CASHED", w: 520, loot: true },
  ammo: { sign: "AMMO-COUNTRY", w: 520, shop: true },
  laundro: { sign: "LAUNDR-O-MAT", w: 500, loot: true },
  jumbo: { sign: "JUMBO-MART", w: 500, loot: true },
  motel: { sign: "MOTEL", w: 360, loot: true },
  house: { sign: null, w: 420, loot: true },
  lot: { sign: null, w: 300, loot: false },
};

export const levelDuration = (level) => Math.min(120, 55 + level * 5);

// Battlegrounds. City Grind is always the city street; Jungle Blitz can be
// fought on any of the outdoor maps.
export const MAPS = {
  jungle: { name: "JUNGLE", blurb: "Twisted vines, night bugs, nowhere to hide." },
  wasteland: { name: "WASTELAND", blurb: "A dead desert town under a burning sky." },
  cherry: { name: "CHERRY VILLAGE", blurb: "Blossoms falling on a quiet mountain village." },
  cavern: { name: "CAVERN", blurb: "Glowing crystals deep under the city." },
};
export const BLITZ_MAPS = Object.keys(MAPS);

// The character creator.
export const CHARACTERS = {
  kid: { name: "KID", hairs: ["FLAT TOP", "AFRO", "BUZZ", "MOHAWK"] },
  girl: { name: "WARRIOR GIRL", hairs: ["LONG", "BOB", "PONYTAIL"] },
};
export const SKINS = ["#4f2f1d", "#6e4429", "#a8724b", "#e2b690"];
export const OUTFITS = [
  { name: "HOME", main: "#f4f1ea", trim: "#cf2c27", num: "#d8352f" },
  { name: "AWAY", main: "#c8302b", trim: "#f4f1ea", num: "#f4f1ea" },
  { name: "MIDNIGHT", main: "#27324a", trim: "#f2c84b", num: "#f2c84b" },
  { name: "JUNGLE", main: "#2f7a46", trim: "#f4f1ea", num: "#f4f1ea" },
  { name: "GOLD", main: "#f2c84b", trim: "#1d1b22", num: "#1d1b22" },
];
export const SHOES = ["#cf2c27", "#f4f1ea", "#1d1b22", "#3c78d8", "#f2c84b"];
export const BOWS = ["#ffffff", "#e0322b", "#f28ab8", "#3c78d8"];
export const baseLook = () => ({ char: "kid", skin: 0, hair: 0, outfit: 0, number: 8, shoes: 0, bow: 0 });
export function normalizeLook(raw) {
  const l = { ...baseLook(), ...(raw && typeof raw === "object" ? raw : {}) };
  if (!CHARACTERS[l.char]) l.char = "kid";
  const idx = (v, n) => (Number.isInteger(v) && v >= 0 && v < n ? v : 0);
  l.skin = idx(l.skin, SKINS.length);
  l.hair = idx(l.hair, CHARACTERS[l.char].hairs.length);
  l.outfit = idx(l.outfit, OUTFITS.length);
  l.shoes = idx(l.shoes, SHOES.length);
  l.bow = idx(l.bow, BOWS.length);
  l.number = Number.isInteger(l.number) && l.number >= 0 && l.number <= 99 ? l.number : 8;
  return l;
}

export function baseProfile() {
  return {
    version: SAVE_VERSION,
    cash: 0,
    level: 1,
    owned: { club: { lv: 1, ammo: 0 }, usp: { lv: 1, ammo: 120 } },
    gun: "usp",
    melee: "club",
    best: { cityLevel: 1, blitzKills: 0, blitzTime: 0, totalKills: 0 },
    runs: [],
    fx: true,
    music: true,
    look: baseLook(),
    map: "jungle",
  };
}

export function normalizeProfile(raw) {
  const base = baseProfile();
  if (!raw || typeof raw !== "object") return base;
  const p = { ...base, ...raw, best: { ...base.best, ...(raw.best || {}) } };
  p.owned = { ...base.owned };
  for (const [id, v] of Object.entries(raw.owned || {}))
    if (WEAPON[id])
      p.owned[id] = {
        lv: Math.min(MAX_LV, Math.max(1, v?.lv | 0 || 1)),
        ammo: Math.max(0, Number(v?.ammo) || 0),
      };
  if (!p.owned[p.gun] || isMelee(p.gun)) p.gun = "usp";
  if (!p.owned[p.melee] || !isMelee(p.melee)) p.melee = "club";
  p.cash = Math.max(0, Math.floor(Number(p.cash) || 0));
  p.level = Math.max(1, Math.floor(Number(p.level) || 1));
  p.runs = Array.isArray(p.runs) ? p.runs.slice(0, 10) : [];
  p.look = normalizeLook(raw.look);
  if (!MAPS[p.map]) p.map = "jungle";
  return p;
}

export function loadProfile() {
  try {
    return normalizeProfile(JSON.parse(localStorage.getItem(SAVE_KEY)));
  } catch {
    return baseProfile();
  }
}
export function saveProfile(p) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: play continues, nothing persists */
  }
}
