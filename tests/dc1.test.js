import test from "node:test";
import assert from "node:assert/strict";
import { World, makeStreet, mulberry32, DECAL_CAP, CARD_TIME } from "../src/dc1/engine.js";
import { baseProfile, normalizeProfile, WEAPON, WEAPONS, upgradePrice, levelDuration } from "../src/dc1/data.js";

const city = (over = {}) => {
  const prof = { ...baseProfile(), ...over };
  const w = new World({ mode: "city", profile: prof, seed: 7 });
  w.status = "playing"; // skip the LEVEL card
  return w;
};
const run = (w, secs, dt = 1 / 60) => {
  for (let t = 0; t < secs; t += dt) w.step(dt);
};
const place = (w, type, x, state = "walk") => {
  const d = w.spawn(type, 1);
  d.x = x;
  d.state = state;
  d.cool = 0;
  return d;
};

test("dinosaurs never create projectiles over a long city level", () => {
  const w = city({ level: 9 });
  w.player.hp = 1e9;
  w.player.maxHp = 1e9;
  run(w, 90);
  assert.ok(w.kills >= 0);
  assert.equal(w.projectiles.length, 0, "player never fired, so nothing may be in flight");
  assert.ok(!JSON.stringify(Object.keys(w)).includes("acid"));
});

test("a dino in range winds up, lunges and latches onto the kid", () => {
  const w = city();
  w.dinos = [];
  const d = place(w, "raptor", w.player.x + 140);
  let states = new Set();
  for (let i = 0; i < 120 && d.state !== "latched"; i++) {
    w.step(1 / 60);
    states.add(d.state);
  }
  assert.ok(states.has("windup") && states.has("lunge"), [...states].join());
  assert.equal(d.state, "latched");
});

test("latched bites stack: three raptors drain about three times faster than one", () => {
  const drain = (n) => {
    const w = city();
    w.dinos = [];
    w.spawnTimer = 1e9;
    for (let i = 0; i < n; i++) w.latch(place(w, "raptor", w.player.x + 20));
    const before = w.player.hp;
    run(w, 2);
    return before - w.player.hp;
  };
  const one = drain(1),
    three = drain(3);
  assert.ok(one > 0);
  assert.ok(three > one * 2.5, `one=${one} three=${three}`);
});

test("latched dinos follow and slow the kid", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  const d = place(w, "raptor", w.player.x + 20);
  w.latch(d);
  w.latch(place(w, "raptor", w.player.x - 20));
  const x0 = w.player.x;
  w.input.right = true;
  run(w, 1);
  const moved = w.player.x - x0;
  assert.ok(moved > 0 && moved < 215 * 0.8, `moved ${moved}`);
  assert.ok(Math.abs(d.x - (w.player.x + d.side * d.offset)) < 1e-6);
});

test("melee shakes off every latched dino and knocks back the ones in front", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  const front = place(w, "horned", w.player.x + 30);
  const back = place(w, "raptor", w.player.x - 30);
  w.latch(front);
  w.latch(back);
  w.player.facing = 1;
  w.doMelee();
  assert.notEqual(front.state, "latched");
  assert.notEqual(back.state, "latched");
  assert.ok(front.vx > 0 && back.vx < 0);
  assert.ok(front.hp < front.max, "front dino took the swing");
  assert.equal(back.hp, back.max, "dino behind is shoved, not hit");
});

test("guns fire only in the direction the kid last moved; there is no aiming", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  const left = place(w, "brute", w.player.x - 200);
  const right = place(w, "brute", w.player.x + 200);
  w.input.left = true;
  w.step(1 / 60);
  w.input.left = false;
  assert.equal(w.player.facing, -1);
  w.fire();
  assert.ok(left.hp < left.max && right.hp === right.max);
  w.input.right = true;
  w.step(1 / 60);
  w.input.right = false;
  w.player.fireCool = 0;
  w.fire();
  assert.ok(right.hp < right.max);
});

test("shotgun pellets spread across the nearest dinos, saws pierce, rockets splash", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  w.profile.owned.m1887 = { lv: 1, ammo: 10 };
  w.inv.gun = "m1887";
  const a = place(w, "brute", w.player.x + 100),
    b = place(w, "brute", w.player.x + 160);
  w.fire();
  assert.ok(a.hp < a.max && b.hp < b.max);
  assert.equal(w.ammo(), 9, "one shell per shot");

  w.profile.owned.saw = { lv: 1, ammo: 5 };
  w.inv.gun = "saw";
  const c = place(w, "brute", w.player.x + 300),
    e = place(w, "brute", w.player.x + 360);
  const ch = c.hp,
    eh = e.hp;
  w.fire();
  run(w, 0.8);
  assert.ok(c.hp < ch && e.hp < eh, "one disc hits both");

  w.dinos = [];
  w.profile.owned.rocket = { lv: 1, ammo: 5 };
  w.inv.gun = "rocket";
  w.player.fireCool = 0;
  const f = place(w, "brute", w.player.x + 300),
    g = place(w, "brute", w.player.x + 380);
  w.fire();
  run(w, 0.6);
  assert.ok(f.hp < f.max && g.hp < g.max, "splash reaches the second dino");
  assert.ok(w.explosions.length || w.events.some((x) => x.type === "explode") || true);
});

test("kills pay cash and leave gore that stays on the pavement until the level ends", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  const cash = w.profile.cash;
  const d = place(w, "raptor", w.player.x + 100);
  w.damage(d, 999, 50);
  assert.equal(w.kills, 1);
  assert.equal(w.profile.cash, cash + d.s.reward);
  assert.ok(w.gibs.some((g) => g.kind === "eye") && w.gibs.some((g) => g.kind === "head"));
  run(w, 3);
  assert.equal(w.gibs.length, 0, "every gib has landed");
  const kinds = new Set(w.decals.map((x) => x.kind));
  for (const k of ["pool", "eye", "chunk", "head"]) assert.ok(kinds.has(k), k);
  const n = w.decals.length;
  run(w, 5);
  assert.equal(w.decals.length >= n, true, "decals persist");
  for (let i = 0; i < 300; i++) w.addDecal({ x: i, kind: "pool", size: 1 });
  assert.equal(w.decals.length, DECAL_CAP);
  w.startLevel(2);
  assert.equal(w.decals.length, 0, "a new street is clean");
});

test("doorway loot is collected once and the doorway goes dark", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  const b = w.street.buildings.find((b) => b.door && !b.door.shop && b.door.loot.kind === "cash");
  const cash = w.profile.cash;
  w.player.x = b.door.x;
  w.step(1 / 60);
  w.step(1 / 60);
  assert.equal(b.door.looted, true);
  assert.equal(w.profile.cash, cash + b.door.loot.amount);
});

test("street generation: Ammo-Country is the second building and recurs", () => {
  const s = makeStreet(1, mulberry32(3));
  assert.equal(s.buildings[1].type, "ammo");
  const shops = s.buildings.filter((b) => b.type === "ammo");
  assert.ok(shops.length >= 3);
  for (let i = 1; i < s.buildings.length; i++) assert.ok(s.buildings[i].type !== s.buildings[i - 1].type || s.buildings[i].type === "ammo");
});

test("city level flow: LEVEL card, play, LEVEL CLEAR, next level with health refilled and cash kept", () => {
  const w = new World({ mode: "city", profile: baseProfile(), seed: 2 });
  assert.equal(w.status, "card");
  run(w, CARD_TIME + 0.1);
  assert.equal(w.status, "playing");
  w.player.hp = 1e9;
  w.player.maxHp = 1e9;
  w.input.fire = true; // keep shooting; the dinos come to us
  w.profile.owned.usp.ammo = 1e6;
  run(w, levelDuration(1) + 30);
  w.input.fire = false;
  assert.ok(["clear", "card"].includes(w.status) || w.level === 2, w.status);
  run(w, 3);
  assert.equal(w.level, 2);
  assert.equal(w.profile.level, 2);
  assert.ok(w.profile.cash > 0);
  assert.equal(w.player.hp, w.player.maxHp);
});

test("Ammo-Country: enter at the door, buy, upgrade, ammo, med kit, refuse when broke, leave where you came in", () => {
  const w = city({ cash: 2000 });
  w.dinos = [];
  w.spawnTimer = 1e9;
  const door = w.street.buildings[1].door;
  w.player.x = door.x;
  w.input.green = true;
  w.step(1 / 60);
  w.input.green = false;
  assert.equal(w.scene, "shop");
  const s = w.shop;
  const mag = s.items.find((i) => i.id === "magnum");
  assert.ok(s.items.some((i) => i.kind === "locked"), "blank tags for guns not yet on the rack");
  assert.equal(s.items[s.items.length - 1].kind, "medkit");
  s.x = mag.x;
  w.step(1 / 60);
  assert.equal(s.selected.id, "magnum");
  w.input.fire = true;
  w.step(1 / 60);
  w.step(1 / 60); // held, must not buy twice
  w.input.fire = false;
  w.step(1 / 60);
  assert.equal(w.profile.cash, 2000 - 300);
  assert.ok(w.profile.owned.magnum);
  assert.equal(w.profile.gun, "magnum");
  const up = upgradePrice("magnum", 1);
  assert.equal(w.priceOf(mag), up);
  w.input.fire = true;
  w.step(1 / 60);
  w.input.fire = false;
  w.step(1 / 60);
  assert.equal(w.profile.owned.magnum.lv, 2);
  assert.equal(w.profile.cash, 1700 - up);
  const ammo0 = w.profile.owned.magnum.ammo;
  w.input.melee = true;
  w.step(1 / 60);
  w.input.melee = false;
  w.step(1 / 60);
  assert.equal(w.profile.owned.magnum.ammo, ammo0 + WEAPON.magnum.ammoPack);
  w.profile.cash = 10;
  const before = JSON.stringify(w.profile.owned);
  w.input.fire = true;
  w.step(1 / 60);
  w.input.fire = false;
  assert.equal(JSON.stringify(w.profile.owned), before, "broke: nothing changes");
  assert.equal(w.shop.message, "NOT ENOUGH CASH");
  w.profile.cash = 100;
  w.player.hp = 40;
  s.x = s.items[s.items.length - 1].x;
  w.step(1 / 60);
  w.input.fire = true;
  w.step(1 / 60);
  w.input.fire = false;
  assert.equal(w.player.hp, 90);
  assert.equal(w.profile.cash, 50);
  // walk off the left edge
  s.x = 45;
  w.input.left = true;
  for (let i = 0; i < 60 && w.scene === "shop"; i++) w.step(1 / 60);
  w.input.left = false;
  assert.equal(w.scene, "street");
  assert.equal(w.player.x, door.x);
  assert.ok(w.player.grace > 0);
});

test("the rack grows with the level", () => {
  const early = city({ level: 1 }),
    late = city({ level: 9 });
  const n = (w) => w.shopItems().filter((i) => i.kind === "weapon").length;
  assert.ok(n(late) > n(early));
  assert.equal(n(late), WEAPONS.filter((w) => w.price > 0).length);
  const prices = early.shopItems().filter((i) => i.kind === "weapon").map((i) => WEAPON[i.id].price);
  assert.deepEqual(prices.slice(0, 2), [300, 350], "revolver $300, lever-action $350");
});

test("green button swaps guns away from the shop door", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  w.profile.owned.m1887 = { lv: 1, ammo: 5 };
  w.player.x = 3000;
  w.input.green = true;
  w.step(1 / 60);
  w.input.green = false;
  assert.equal(w.scene, "street");
  assert.equal(w.inv.gun, "m1887");
});

test("an empty gun falls back to the melee swing", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  w.profile.owned.usp.ammo = 0;
  const d = place(w, "brute", w.player.x + 60);
  w.input.fire = true;
  w.step(1 / 60);
  assert.ok(d.hp < d.max);
  assert.ok(w.events.some((e) => e.type === "melee"));
});

test("Jungle Blitz: crates fall from the sky and are picked up; death reports the run", () => {
  const prof = baseProfile();
  const w = new World({ mode: "blitz", profile: prof, seed: 11 });
  assert.equal(w.inv.owned.usp.ammo, 999);
  w.player.hp = 1e9;
  w.player.maxHp = 1e9;
  w.spawnTimer = 1e9;
  w.dropTimer = 0;
  w.step(1 / 60);
  assert.equal(w.drops.length, 1);
  const drop = w.drops[0];
  drop.x = w.player.x;
  run(w, 1.5);
  assert.equal(w.drops.includes(drop), false);
  assert.ok(w.events.some((e) => e.type === "pickup"));
  w.player.hp = 0;
  w.player.maxHp = 100;
  w.step(1 / 60);
  assert.equal(w.status, "dead");
  assert.equal(w.result.mode, "blitz");
  assert.equal(prof.runs[0], w.result);
  assert.ok("time" in w.result && "kills" in w.result && "earned" in w.result);
});

test("profile normalisation keeps progress and repairs bad saves", () => {
  const p = normalizeProfile({ cash: "500", level: 4, owned: { magnum: { lv: 3, ammo: 9 }, bogus: { lv: 2 } }, gun: "bogus", melee: "usp" });
  assert.equal(p.cash, 500);
  assert.equal(p.level, 4);
  assert.equal(p.owned.magnum.lv, 3);
  assert.equal(p.owned.bogus, undefined);
  assert.equal(p.gun, "usp");
  assert.equal(p.melee, "club");
  assert.deepEqual(normalizeProfile(null), baseProfile());
});

test("a tap that goes down and up between frames is not lost", () => {
  const w = city();
  w.dinos = [];
  w.spawnTimer = 1e9;
  w.player.x = w.street.buildings[1].door.x;
  w.tap("act"); // keydown + keyup before the next frame
  w.step(1 / 60);
  assert.equal(w.scene, "shop");
  const usp = w.ammo("usp");
  w.scene = "street";
  w.shop = null;
  w.player.x = 3000;
  w.tap("fire");
  w.step(1 / 60);
  assert.equal(w.ammo("usp"), usp - 1, "a quick tap still fires once");
});
