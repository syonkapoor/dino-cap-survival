// Dino Cap (Triniti, 2010) data, reconstructed from gameplay footage.
// See docs/FIDELITY-PLAN.md. Prices on the Ammo-Country rack follow what the
// footage shows ($300 revolver, $350 lever-action, then $550 up to $2,500 and
// beyond); damage, fire rate and ammo pack sizes are remake balance values.

export const GROUND_Y = 440; // feet line on the street, in logical pixels
export const VIEW_H = 540;
export const SAVE_KEY = "dino-cap-1-save";
export const SAVE_VERSION = 1;

// family drives firing behaviour and the ammo icon in the HUD badge.
// unlock = the City Grind level from which the clerk hangs it on the rack.
export const WEAPONS = [
  // melee (blue button). The club is what the kid starts with.
  { id: "club", name: "Spiked Club", family: "melee", damage: 9, rate: 0.34, reach: 96, knock: 260, price: 0, unlock: 1 },
  { id: "crowbar", name: "Crowbar", family: "melee", damage: 15, rate: 0.32, reach: 104, knock: 300, price: 650, unlock: 2 },
  { id: "axe", name: "Fireman's Axe", family: "melee", damage: 28, rate: 0.4, reach: 112, knock: 340, price: 2000, unlock: 6 },
  { id: "chainsaw", name: "Chainsaw", family: "melee", damage: 9, rate: 0.07, reach: 108, knock: 120, price: 6000, unlock: 9 },
  // guns (orange button)
  { id: "usp", name: "USP .45", family: "pistol", damage: 10, rate: 0.3, range: 720, price: 0, unlock: 1, ammoPack: 60, ammoPrice: 40, startAmmo: 120 },
  { id: "magnum", name: ".44 Magnum", family: "pistol", damage: 26, rate: 0.5, range: 760, pierce: 1, price: 300, unlock: 1, ammoPack: 30, ammoPrice: 60, startAmmo: 36 },
  { id: "m1887", name: "Model 1887", family: "shotgun", damage: 9, pellets: 5, rate: 0.75, range: 380, price: 350, unlock: 1, ammoPack: 16, ammoPrice: 70, startAmmo: 22 },
  { id: "m9", name: "M9", family: "pistol", damage: 13, rate: 0.2, range: 720, price: 550, unlock: 2, ammoPack: 80, ammoPrice: 60, startAmmo: 120 },
  { id: "tec9", name: "TEC-DC9", family: "smg", damage: 7, rate: 0.085, range: 600, price: 600, unlock: 2, ammoPack: 150, ammoPrice: 80, startAmmo: 200 },
  { id: "mp5k", name: "MP5K", family: "smg", damage: 9, rate: 0.08, range: 650, price: 800, unlock: 3, ammoPack: 150, ammoPrice: 100, startAmmo: 200 },
  { id: "deagle", name: "Desert Eagle", family: "pistol", damage: 38, rate: 0.45, range: 800, pierce: 1, price: 900, unlock: 3, ammoPack: 30, ammoPrice: 110, startAmmo: 40 },
  { id: "spas12", name: "SPAS-12", family: "shotgun", damage: 12, pellets: 6, rate: 0.6, range: 400, price: 1000, unlock: 3, ammoPack: 20, ammoPrice: 120, startAmmo: 30 },
  { id: "ump45", name: "UMP45", family: "smg", damage: 12, rate: 0.09, range: 680, price: 1200, unlock: 4, ammoPack: 150, ammoPrice: 140, startAmmo: 200 },
  { id: "m1014", name: "M1014", family: "shotgun", damage: 13, pellets: 6, rate: 0.38, range: 400, price: 1500, unlock: 4, ammoPack: 24, ammoPrice: 160, startAmmo: 36 },
  { id: "ak47", name: "AK47", family: "rifle", damage: 16, rate: 0.11, range: 900, price: 1700, unlock: 4, ammoPack: 120, ammoPrice: 180, startAmmo: 180 },
  { id: "m16", name: "M16", family: "rifle", damage: 18, rate: 0.1, range: 900, price: 2200, unlock: 5, ammoPack: 120, ammoPrice: 200, startAmmo: 180 },
  { id: "grenade", name: "Grenade Launcher", family: "launcher", damage: 70, rate: 0.8, splash: 120, speed: 620, arc: true, price: 2500, unlock: 5, ammoPack: 10, ammoPrice: 260, startAmmo: 12 },
  { id: "kriss", name: "KRISS", family: "smg", damage: 13, rate: 0.055, range: 700, price: 2800, unlock: 6, ammoPack: 200, ammoPrice: 260, startAmmo: 240 },
  { id: "scarh", name: "SCAR-H", family: "rifle", damage: 30, rate: 0.13, range: 950, pierce: 1, price: 3200, unlock: 6, ammoPack: 100, ammoPrice: 300, startAmmo: 140 },
  { id: "aa12", name: "AA-12", family: "shotgun", damage: 14, pellets: 6, rate: 0.2, range: 420, price: 3800, unlock: 7, ammoPack: 40, ammoPrice: 340, startAmmo: 60 },
  { id: "saw", name: "Buzz-Saw Launcher", family: "saw", damage: 45, rate: 0.5, speed: 760, pierce: 99, price: 4500, unlock: 7, ammoPack: 20, ammoPrice: 380, startAmmo: 30 },
  { id: "flame", name: "Flamethrower", family: "flame", damage: 7, rate: 0.06, range: 230, price: 5000, unlock: 8, ammoPack: 200, ammoPrice: 420, startAmmo: 300 },
  { id: "rocket", name: "Rocket Launcher", family: "launcher", damage: 130, rate: 0.95, splash: 150, speed: 820, price: 5500, unlock: 8, ammoPack: 8, ammoPrice: 480, startAmmo: 10 },
  { id: "m61", name: "M61", family: "rifle", damage: 14, rate: 0.04, range: 900, price: 6500, unlock: 8, ammoPack: 300, ammoPrice: 520, startAmmo: 400 },
  { id: "laser", name: "Laser Gun", family: "laser", damage: 60, rate: 0.55, range: 1100, pierce: 99, price: 9000, unlock: 9, ammoPack: 30, ammoPrice: 700, startAmmo: 40 },
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
  raptor: { name: "Blue Raptor", hp: 20, speed: 118, lungeRange: 165, lungeSpeed: 430, lungeDist: 150, bite: 5, biteRate: 0.5, knockResist: 0, width: 96, reward: 8, blitzReward: 30, from: 1 },
  horned: { name: "Horned Raptor", hp: 46, speed: 96, lungeRange: 150, lungeSpeed: 380, lungeDist: 130, bite: 7, biteRate: 0.55, knockResist: 0.25, width: 104, reward: 15, blitzReward: 45, from: 3 },
  brute: { name: "Green Brute", hp: 150, speed: 62, lungeRange: 130, lungeSpeed: 300, lungeDist: 110, bite: 14, biteRate: 0.8, knockResist: 0.75, width: 150, reward: 40, blitzReward: 90, from: 8 },
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
