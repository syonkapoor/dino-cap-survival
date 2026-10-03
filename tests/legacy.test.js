import test from "node:test";
import assert from "node:assert/strict";
import { Game, missionForDay } from "../src/legacy/game.js";
import { WEAPONS, normalizeProfile } from "../src/legacy/data.js";
const drawing = new Proxy(
  {},
  {
    get: (target, key) => (key in target ? target[key] : () => {}),
    set: (target, key, value) => ((target[key] = value), true),
  },
);
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => drawing }),
};
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
function game() {
  const g = new Game(
    { getContext: () => drawing },
    normalizeProfile(),
    () => {},
    () => {},
  );
  g.muted = true;
  g.status = "playing";
  g.spawn = 100;
  g.pickupTimer = 100;
  g.events = [];
  return g;
}
function enemy(x, type = 0, hp = [20, 150, 50][type]) {
  return {
    x,
    type,
    hp,
    max: hp,
    vx: 0,
    flash: 0,
    cool: 100,
    attack: 0,
    dead: false,
  };
}
test("old saves migrate without losing ammo, cash, level, upgrades or allies", () => {
  const p = normalizeProfile({
    cash: 450,
    level: 3,
    shells: 16,
    smg: 97,
    upgrades: [1, 2, 3, 4],
    allies: ["Soldier", "Force Knight"],
  });
  assert.equal(p.cash, 450);
  assert.equal(p.level, 3);
  assert.equal(p.ammo.shells, 16);
  assert.equal(p.ammo.smg, 97);
  assert.equal(p.upgrades[3], 4);
  assert.equal(p.upgrades.length, WEAPONS.length);
  assert.deepEqual(p.allies, ["soldier", "knight"]);
});
test("shotgun spends exactly one shell and spreads 25 damage across three pellets", () => {
  const g = game();
  g.weapon = 2;
  g.attackPlayer();
  assert.equal(g.bullets.length, 3);
  assert.equal(g.profile.ammo.shells, 29);
  assert.equal(
    g.bullets.reduce((n, b) => n + b.damage, 0),
    25,
  );
  assert.notEqual(g.bullets[0].vy, g.bullets[2].vy);
  g.cool = 0;
  g.profile.ammo.shells = 0;
  g.attackPlayer();
  assert.equal(g.bullets.length, 3);
});
test("melee applies 5 damage only within reach and in front, handgun uses no ammo", () => {
  const g = game();
  g.facing = 1;
  g.weapon = 0;
  const near = enemy(g.x + 55),
    far = enemy(g.x + 160),
    behind = enemy(g.x - 60);
  g.enemies = [near, far, behind];
  g.attackPlayer();
  assert.equal(near.hp, 15);
  assert.equal(far.hp, 20);
  assert.equal(behind.hp, 20);
  g.cool = 0;
  g.weapon = 1;
  const ammo = structuredClone(g.profile.ammo);
  g.attackPlayer();
  assert.deepEqual(g.profile.ammo, ammo);
});
test("kills award cash and EXP once; five raptors level up and restore health", () => {
  const g = game();
  g.hp = 40;
  const e = enemy(g.x + 50);
  g.hit(e, 20);
  g.hit(e, 20);
  assert.equal(g.kills, 1);
  assert.equal(g.profile.cash, 60);
  for (let i = 0; i < 4; i++) g.hit(enemy(g.x + 50), 20);
  assert.equal(g.profile.level, 2);
  assert.equal(g.profile.exp, 0);
  assert.equal(g.hp, 65);
});
test("brute knockback resistance and bite damage; invulnerability prevents repeated damage", () => {
  const g = game();
  const r = enemy(g.x + 70),
    b = enemy(g.x + 70, 1);
  g.hit(r, 1, 100);
  g.hit(b, 1, 100);
  assert.ok(b.vx < r.vx);
  b.cool = 0;
  g.enemies = [b];
  g.update(0.016);
  assert.equal(g.hp, 65);
  g.hurt(35, b.x);
  assert.equal(g.hp, 65);
});
test("blue mutant spits acid and raptor lunges toward player", () => {
  const g = game();
  const blue = enemy(g.x + 350, 2);
  blue.cool = 0;
  const r = enemy(g.x - 100);
  g.enemies = [blue, r];
  const before = r.x;
  g.update(0.016);
  assert.ok(g.bullets.some((b) => b.acid && b.vx < 0));
  assert.ok(r.x - before > 107 * 0.016);
});
test("swept collision prevents a fast bullet passing through a dinosaur", () => {
  const g = game();
  g.enemies = [enemy(g.x + 70)];
  g.bullets = [
    {
      x: g.x + 45,
      y: 382,
      vx: 900,
      vy: 0,
      damage: 10,
      life: 1,
      family: "pistol",
      acid: false,
    },
  ];
  g.update(0.04);
  assert.equal(g.enemies[0].hp, 10);
});
test("pickups restore +25 HP capped at max, refill ammunition, and expire", () => {
  const g = game();
  g.hp = 90;
  g.drops = [
    { x: g.x, type: "health", life: 5 },
    { x: g.x, type: "ammo", life: 5 },
    { x: g.x + 200, type: "ammo", life: 0 },
  ];
  g.update(0.016);
  assert.equal(g.hp, 100);
  assert.equal(g.profile.ammo.shells, 38);
  assert.equal(g.profile.ammo.smg, 220);
  assert.equal(g.drops.length, 0);
});
test("wave completion increments wave and restores 15 health", () => {
  const g = game();
  g.hp = 50;
  g.waveKills = 11;
  g.hit(enemy(g.x + 50), 20);
  assert.equal(g.wave, 2);
  assert.equal(g.waveKills, 0);
  assert.equal(g.hp, 65);
});
test("random Jungle Blitz weapon pickup adds a temporary run weapon", () => {
  const g = game();
  g.collect({ x: g.x, type: "weapon", weapon: 12, life: 5 });
  assert.ok(g.inventory.includes(12));
  assert.ok(!g.profile.unlocked.includes(12));
  assert.equal(g.weapon, 12);
  assert.equal(g.profile.ammo.rifle, 145);
});
test("kill, survival, travel, and egg missions each complete and reward cash", () => {
  for (const objective of ["kills", "survive", "distance", "eggs"]) {
    const g = game();
    g.objective = objective;
    g.target = 1;
    if (objective === "kills") g.kills = 1;
    if (objective === "survive") g.time = 1;
    if (objective === "distance") g.keys.d = true;
    if (objective === "eggs") g.eggs = [{ x: g.x, collected: false }];
    let result;
    g.onFinish = (r) => (result = r);
    g.update(0.02);
    assert.equal(g.status, "complete", objective);
    assert.equal(result.success, true);
    assert.equal(g.profile.day, 2);
    assert.equal(result.bonus, 400);
  }
});
test("death records results, stops attacks, and preserves currency", () => {
  const g = game();
  g.kills = 9;
  g.profile.cash = 700;
  g.hp = 0;
  g.mouse.down = true;
  let result;
  g.onFinish = (r) => (result = r);
  g.update(0.016);
  assert.equal(g.status, "dead");
  assert.equal(g.profile.best, 9);
  assert.equal(result.success, false);
  assert.equal(result.profile.cash, 700);
  assert.equal(g.mouse.down, false);
});
test("special consumes energy, obeys cooldown, and affects nearby enemies", () => {
  const g = game();
  g.enemies = [enemy(g.x + 100, 1), enemy(g.x + 500, 1)];
  g.special();
  assert.equal(g.profile.ammo.energy, 77);
  assert.equal(g.enemies[0].hp, 105);
  assert.equal(g.enemies[1].hp, 150);
  g.special();
  assert.equal(g.profile.ammo.energy, 77);
});
test("pause releases held inputs; resume syncs armory upgrades and new allies", () => {
  const g = game();
  g.keys.d = true;
  g.mouse.down = true;
  g.pause();
  assert.equal(g.status, "paused");
  assert.equal(g.mouse.down, false);
  assert.deepEqual(g.keys, {});
  const p = structuredClone(g.profile);
  p.unlocked.push(12);
  p.allies = ["soldier"];
  g.resume(p);
  assert.equal(g.status, "playing");
  assert.ok(g.inventory.includes(12));
  assert.equal(g.allyUnits[0].id, "soldier");
});
test("mission rotation and horizontal movement bounds stay deterministic", () => {
  assert.equal(missionForDay(1).objective, "kills");
  assert.equal(missionForDay(4).objective, "eggs");
  assert.equal(missionForDay(5).target, 35);
  const g = game();
  g.x = 45;
  g.keys.a = true;
  g.update(0.04);
  assert.equal(g.x, 45);
  g.keys = { d: true };
  g.x = 4155;
  g.update(0.04);
  assert.equal(g.x, 4155);
});

test("hired allies follow, face their target, and fire or strike automatically", () => {
  const g = game();
  g.allyUnits = [
    { id: "soldier", x: g.x - 65, cool: 0 },
    { id: "knight", x: g.x - 90, cool: 0 },
  ];
  const brute = enemy(g.x + 10, 1);
  g.enemies = [brute];
  g.update(0.02);
  assert.equal(brute.hp, 132);
  assert.ok(g.bullets.some((b) => b.owner === "ally" && b.damage === 12));
  assert.equal(g.allyUnits[0].facing, 1);
  assert.equal(g.allyUnits[1].facing, 1);
  g.allyUnits[0].x = g.x - 200;
  const before = g.allyUnits[0].x;
  g.update(0.02);
  assert.ok(g.allyUnits[0].x > before);
});
