// Raptor Street simulation. Pure: no DOM, no canvas, no audio. The app feeds
// it input, calls step(dt), drains events for sound/UI and hands it to the
// renderer. Everything gameplay-relevant is unit-tested in tests/dc1.test.js.
import {
  WEAPON,
  WEAPONS,
  GUNS,
  MEDKIT,
  BUILDINGS,
  MAX_LV,
  isMelee,
  dinoStats,
  damageFor,
  upgradePrice,
  levelDuration,
  MAPS,
} from "./data.js";

export const PLAYER_SPEED = 215;
export const CARD_TIME = 1.7;
export const CLEAR_TIME = 2.4;
export const DECAL_CAP = 260;
export const SHOP_SLOT = 150;
export const SHOP_RACK_X = 340;
export const SHOP_EXIT_X = 70;
const CHEST = 52; // height above the feet line where shots travel
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A Street Sweep street: storefront chunks left to right. GUN BARN is always
// the second building (the footage reaches it within the first minute) and
// recurs every five to seven buildings.
export function makeStreet(level, rand, length = 14000) {
  const pool = ["deli", "checks", "laundro", "jumbo", "motel", "house", "house", "lot"];
  const buildings = [];
  let x = 0,
    sinceShop = 0,
    i = 0;
  while (x < length) {
    let type;
    if (i === 1 || sinceShop >= 5 + Math.floor(rand() * 3)) type = "ammo";
    else {
      do type = pool[Math.floor(rand() * pool.length)];
      while (buildings.length && buildings[buildings.length - 1].type === type);
    }
    sinceShop = type === "ammo" ? 0 : sinceShop + 1;
    const spec = BUILDINGS[type];
    const b = { type, x, w: spec.w, sign: spec.sign, door: null, variant: Math.floor(rand() * 4) };
    if (spec.shop) b.door = { x: x + spec.w / 2, shop: true };
    else if (spec.loot) {
      const r = rand();
      const loot =
        r < 0.55
          ? { kind: "cash", amount: Math.round(15 + rand() * 25 + level * 3) }
          : r < 0.9
            ? { kind: "ammo" }
            : { kind: "med", amount: 25 };
      b.door = { x: x + spec.w * (type === "house" ? 0.62 : 0.5), loot, looted: false };
    }
    buildings.push(b);
    x += spec.w;
    i++;
  }
  return { length: x, buildings };
}

export class World {
  constructor({ mode = "city", profile, seed = 1, viewW = 960, map } = {}) {
    this.mode = mode;
    // Street Sweep is always the city; Survival is fought on the chosen map
    this.map = mode === "city" ? "city" : MAPS[map] ? map : "jungle";
    this.profile = profile;
    this.rand = mulberry32(seed);
    this.viewW = viewW;
    this.events = [];
    this.input = { left: false, right: false, fire: false, melee: false, swap: false, act: false, green: false };
    this.prevInput = { ...this.input };
    this.taps = new Set();
    this.kills = 0;
    this.earned = 0;
    this.runTime = 0;
    this.decals = [];
    this.gibs = [];
    this.corpses = [];
    this.tracers = [];
    this.sprays = [];
    this.geysers = [];
    this.flames = [];
    this.explosions = [];
    this.popups = [];
    this.projectiles = [];
    this.drops = [];
    this.dinos = [];
    this.nextId = 1;
    this.scene = "street";
    this.shop = null;
    this.player = {
      x: 200,
      facing: 1,
      hp: 100,
      maxHp: 100,
      walk: 0,
      moving: false,
      fireCool: 0,
      meleeCool: 0,
      swing: 0,
      muzzle: 0,
      hurt: 0,
      grace: 0,
      leaveTimer: 0,
      blood: 0,
      recoil: 0,
      aim: 0,
    };
    if (mode === "blitz") {
      // Survival: its own loadout, weapons and ammo fall from the sky.
      this.inv = {
        owned: { club: { lv: profile.owned.club?.lv || 1, ammo: 0 }, usp: { lv: profile.owned.usp?.lv || 1, ammo: 999 } },
        gun: "usp",
        melee: "club",
      };
      this.street = { length: 6000, buildings: [] };
      this.player.x = 3000;
      this.status = "playing";
      this.level = 1;
      this.t = 0;
      this.spawnTimer = 1.2;
      this.dropTimer = 4;
    } else {
      this.inv = profile;
      this.startLevel(profile.level);
    }
  }

  // ---------- helpers ----------
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  drainEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }
  popup(x, text, color = "#ffe23a", y = 0) {
    this.popups.push({ x, y, text, color, life: 1.1 });
  }
  get gun() {
    return WEAPON[this.inv.gun];
  }
  get melee() {
    return WEAPON[this.inv.melee];
  }
  ammo(id = this.inv.gun) {
    return this.inv.owned[id]?.ammo ?? 0;
  }
  lv(id) {
    return this.inv.owned[id]?.lv ?? 1;
  }
  latched() {
    return this.dinos.filter((d) => d.state === "latched");
  }
  get nearShopDoor() {
    if (this.mode !== "city" || this.scene !== "street" || this.status !== "playing") return null;
    return this.street.buildings.find((b) => b.door?.shop && Math.abs(b.door.x - this.player.x) < 60) || null;
  }
  get atShopExit() {
    return this.scene === "shop" && this.shop.x < SHOP_EXIT_X + 40;
  }

  // ---------- level flow ----------
  startLevel(level) {
    this.level = level;
    this.profile.level = level;
    this.street = makeStreet(level, this.rand);
    this.dinos = [];
    this.projectiles = [];
    this.decals = [];
    this.gibs = [];
    this.corpses = [];
    this.tracers = [];
    this.sprays = [];
    this.geysers = [];
    this.flames = [];
    this.explosions = [];
    this.popups = [];
    this.scene = "street";
    this.shop = null;
    Object.assign(this.player, { x: 200, facing: 1, hp: this.player.maxHp, grace: 0, hurt: 0, blood: 0 });
    this.t = 0;
    this.levelKills = 0;
    this.levelEarned = 0;
    this.doubled = false;
    this.duration = levelDuration(level);
    this.spawnTimer = 1.5;
    this.status = "card";
    this.cardTimer = CARD_TIME;
    this.emit("levelCard", { level });
  }

  // ---------- after LEVEL CLEAR: the app may hold here to offer 2x cash ----------
  nextLevel() {
    if (this.status !== "clear") return false;
    this.profile.level = this.level + 1;
    this.profile.best.cityLevel = Math.max(this.profile.best.cityLevel, this.level + 1);
    this.emit("save");
    this.startLevel(this.level + 1);
    return true;
  }
  // double what this level paid, once (the rewarded-ad offer)
  doubleLevelCash() {
    if (this.status !== "clear" || this.doubled) return 0;
    this.doubled = true;
    const bonus = this.levelEarned;
    this.addCash(bonus);
    this.emit("cash");
    this.emit("save");
    return bonus;
  }
  // one second chance per run (the rewarded-ad offer)
  revive() {
    if (this.status !== "dead" || this.revived || this.ended) return false;
    const p = this.player;
    this.revived = true;
    this.status = "playing";
    p.hp = p.maxHp;
    p.grace = 2.5;
    p.hurt = 0;
    for (const d of this.dinos) {
      d.state = "stagger";
      d.timer = 0.6;
      d.x = p.x + (Math.sign(d.x - p.x) || 1) * (380 + Math.abs(d.x - p.x) * 0.2);
    }
    this.emit("revive");
    return true;
  }
  // record the run; die() calls it unless the app defers it to offer a revive
  endRun() {
    if (this.ended || !this.result) return;
    this.ended = true;
    const b = this.profile.best;
    if (this.mode === "blitz") {
      b.blitzKills = Math.max(b.blitzKills, this.kills);
      b.blitzTime = Math.max(b.blitzTime, Math.floor(this.t));
    }
    this.profile.runs = [this.result, ...(this.profile.runs || [])].slice(0, 10);
    this.emit("save");
  }

  // ---------- main step ----------
  step(dt) {
    dt = Math.min(dt, 0.05);
    const inp = this.input,
      prev = this.prevInput;
    // a tap that went down and up between two frames still counts once
    const taps = this.taps;
    const pressed = (k) => taps.has(k) || (inp[k] && !prev[k]);
    this.fadeEffects(dt);
    if (this.status === "card") {
      this.cardTimer -= dt;
      if (this.cardTimer <= 0) this.status = "playing";
    } else if (this.status === "clear") {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0 && !this.holdOnClear) this.nextLevel();
    } else if (this.status === "playing") {

      if (this.scene === "shop") this.stepShop(dt, pressed);
      else this.stepStreet(dt, pressed);
    }
    this.prevInput = { ...inp };
    taps.clear();
  }

  // the app calls this on every key-down / pointer-down
  tap(k) {
    this.taps.add(k);
  }

  fadeEffects(dt) {
    for (const list of [this.tracers, this.flames, this.explosions, this.popups, this.sprays]) {
      for (const e of list) e.life -= dt;
    }
    this.tracers = this.tracers.filter((e) => e.life > 0);
    this.sprays = this.sprays.filter((e) => e.life > 0);
    // a popped neck keeps pumping for a moment
    for (const g of this.geysers) {
      g.life -= dt;
      g.acc += dt;
      while (g.acc > 0.035) {
        g.acc -= 0.035;
        this.gibs.push({ x: g.x, y: -g.h, vx: g.dir * (20 + this.rand() * 90) + (this.rand() - 0.5) * 60, vy: -420 - this.rand() * 260, rot: 0, vr: 0, kind: "drop", size: 0.6 + this.rand() * 0.8 });
      }
    }
    this.geysers = this.geysers.filter((g) => g.life > 0);
    this.flames = this.flames.filter((e) => e.life > 0);
    this.explosions = this.explosions.filter((e) => e.life > 0);
    this.popups = this.popups.filter((e) => e.life > 0);
    for (const c of this.corpses) c.life -= dt;
    this.corpses = this.corpses.filter((c) => c.life > 0);
    for (const g of this.gibs) {
      g.vy += 900 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.rot += g.vr * dt;
      if (g.y >= 0) {
        g.y = 0;
        if (g.kind === "drop") this.addDecal({ x: g.x, kind: "splat", size: g.size, rot: 0 });
        else this.addDecal({ x: g.x, kind: g.kind, type: g.type, size: g.size, rot: g.rot });
        g.dead = true;
      }
    }
    this.gibs = this.gibs.filter((g) => !g.dead);
  }

  // a burst of blood: a spray fan drawn for a moment plus droplets that land as splats
  bleed(x, h, dir, amount = 1) {
    this.sprays.push({ x, h, dir, life: 0.22, max: 0.22, n: Math.round(5 + amount * 6), seed: this.rand() * 1000, big: amount });
    const drops = Math.round(3 + amount * 5);
    for (let i = 0; i < drops; i++)
      this.gibs.push({ x, y: -h, vx: dir * (60 + this.rand() * 260 * amount) + (this.rand() - 0.5) * 80, vy: -120 - this.rand() * 320, rot: 0, vr: 0, kind: "drop", size: 0.5 + this.rand() * 0.9 });
  }

  addDecal(d) {
    this.decals.push({ seed: Math.floor(this.rand() * 1e6), ...d });
    if (this.decals.length > DECAL_CAP) this.decals.splice(0, this.decals.length - DECAL_CAP);
  }

  stepStreet(dt, pressed) {
    const p = this.player,
      inp = this.input;
    this.t += dt;
    this.runTime += dt;
    p.fireCool -= dt;
    p.meleeCool -= dt;
    p.swing = Math.max(0, p.swing - dt);
    p.muzzle = Math.max(0, p.muzzle - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    p.grace = Math.max(0, p.grace - dt);

    // movement: facing is the last direction moved, there is no aiming.
    const move = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const held = this.latched().length;
    const slow = Math.max(0.4, 1 - 0.15 * held);
    p.moving = !!move;
    if (move) {
      p.facing = move;
      p.x = clamp(p.x + move * PLAYER_SPEED * slow * dt, 40, this.street.length - 40);
      const before = Math.floor(p.walk / Math.PI);
      p.walk += dt * 10 * slow;
      if (Math.floor(p.walk / Math.PI) !== before) this.emit("step");
    }
    p.recoil = Math.max(0, p.recoil - dt * 6);
    p.aim = Math.max(0, p.aim - dt);

    // the green button enters Gun Barn at its door, otherwise swaps guns
    const door = this.nearShopDoor;
    if (pressed("act") || (pressed("green") && door)) {
      if (door) return this.enterShop(door.door);
    } else if (pressed("swap") || pressed("green")) this.swap();

    const want = (k) => inp[k] || this.taps.has(k);
    if (want("melee") && p.meleeCool <= 0) this.doMelee();
    else if (want("fire") && p.fireCool <= 0) {
      if (this.ammo() > 0) this.fire();
      else if (p.meleeCool <= 0) {
        if (pressed("fire")) this.emit("empty");
        this.doMelee();
      }
    }

    this.stepProjectiles(dt);
    this.stepDinos(dt);
    if (this.mode === "city") this.stepCity(dt);
    else this.stepBlitz(dt);

    if (p.hp <= 0) this.die();
  }

  stepCity(dt) {
    const p = this.player;
    // doorway loot: walk through the lit doorway to grab what's floating in it
    for (const b of this.street.buildings) {
      const d = b.door;
      if (!d || d.shop || d.looted || Math.abs(d.x - p.x) > 26) continue;
      d.looted = true;
      const l = d.loot;
      if (l.kind === "cash") {
        this.addCash(l.amount);
        this.popup(d.x, `$${l.amount}`);
        this.emit("cash");
      } else if (l.kind === "med") {
        p.hp = Math.min(p.maxHp, p.hp + l.amount);
        this.popup(d.x, `HP+${l.amount}`, "#9cf06a");
        this.emit("pickup");
      } else {
        const g = this.gun,
          n = Math.max(8, Math.round((g.ammoPack || 30) * 0.4));
        this.inv.owned[g.id].ammo += n;
        this.popup(d.x, `×${n}`, "#ffffff");
        this.emit("pickup");
      }
    }
    // spawning stops when the clock runs out; the level clears once the street is quiet
    const done = this.t >= this.duration;
    if (!done) {
      this.spawnTimer -= dt;
      const cap = Math.min(4 + this.level, 16);
      if (this.spawnTimer <= 0 && this.dinos.length < cap) {
        const pack = this.rand() < Math.min(0.55, 0.18 + 0.03 * this.level) ? 2 + Math.floor(this.rand() * 2) : 1;
        // the dinos always come in from the right
        for (let i = 0; i < pack; i++) this.spawn(this.pickType(this.level), 1, i * 70);
        this.spawnTimer = Math.max(0.55, 2.2 - 0.12 * this.level) * (pack > 1 ? 1.6 : 1);
      }
    } else {
      for (const d of this.dinos) if (Math.abs(d.x - p.x) > 1400) d.gone = true;
      this.dinos = this.dinos.filter((d) => !d.gone);
      if (!this.dinos.length) {
        this.status = "clear";
        this.clearTimer = CLEAR_TIME;
        this.emit("levelClear", { level: this.level });
      }
    }
  }

  stepBlitz(dt) {
    const p = this.player;
    const lvl = 1 + Math.floor(this.t / 20);
    this.level = lvl;
    this.spawnTimer -= dt;
    const cap = Math.min(22, 8 + Math.floor(this.t / 15));
    if (this.spawnTimer <= 0 && this.dinos.length < cap) {
      const pack = this.rand() < Math.min(0.6, 0.2 + this.t / 300) ? 2 + Math.floor(this.rand() * 2) : 1;
      for (let i = 0; i < pack; i++) {
        const type = this.t > 90 && this.rand() < 0.15 ? "brute" : this.t > 30 && this.rand() < 0.3 ? "horned" : "raptor";
        this.spawn(type, 1, i * 70);
      }
      this.spawnTimer = Math.max(0.35, 1.6 - this.t * 0.008) * (pack > 1 ? 1.5 : 1);
    }
    // weapons, ammo and medicine fall from the sky
    this.dropTimer -= dt;
    if (this.dropTimer <= 0) {
      this.dropTimer = 5.5;
      const r = this.rand();
      const kind = r < 0.4 ? "weapon" : r < 0.75 ? "ammo" : "med";
      const pool = GUNS.filter((g) => g.id !== "usp");
      this.drops.push({
        x: clamp(p.x + (this.rand() - 0.5) * 700, 80, this.street.length - 80),
        y: -420,
        kind,
        weapon: kind === "weapon" ? pool[Math.floor(this.rand() * pool.length)].id : null,
        landed: false,
        life: 14,
      });
    }
    for (const d of this.drops) {
      if (!d.landed) {
        d.y += 380 * dt;
        if (d.y >= 0) {
          d.y = 0;
          d.landed = true;
        }
      } else d.life -= dt;
      if (d.landed && Math.abs(d.x - p.x) < 40) {
        d.life = 0;
        this.collectDrop(d);
      }
    }
    this.drops = this.drops.filter((d) => d.life > 0);
  }

  collectDrop(d) {
    const p = this.player;
    if (d.kind === "med") {
      p.hp = Math.min(p.maxHp, p.hp + 25);
      this.popup(p.x, "HP+25", "#ffe23a", 40);
    } else if (d.kind === "weapon") {
      const w = WEAPON[d.weapon];
      const o = (this.inv.owned[w.id] ||= { lv: this.profile.owned[w.id]?.lv || 1, ammo: 0 });
      o.ammo += w.startAmmo;
      this.inv.gun = w.id;
      this.popup(p.x, w.name.toUpperCase(), "#ffe23a", 40);
    } else {
      const g = this.gun,
        n = g.ammoPack || 30;
      this.inv.owned[g.id].ammo += n;
      this.popup(p.x, `×${n}`, "#ffffff", 40);
    }
    this.emit("pickup");
  }

  pickType(level) {
    const r = this.rand();
    if (level >= 8 && r < Math.min(0.3, 0.12 + 0.01 * (level - 8))) return "brute";
    if (level >= 3 && r < Math.min(0.6, 0.38 + 0.02 * (level - 3))) return "horned";
    return "raptor";
  }

  spawn(type, side, offset = 0) {
    const p = this.player,
      half = this.viewW / 2 + 230;
    // off-screen on the given side; at the very end of the street they
    // come out of the last building instead of appearing behind the kid
    let x = p.x + side * (half + offset);
    if (x > this.street.length - 30) x = this.street.length - 30 - offset * 0.3;
    const s = dinoStats(type, this.level);
    const d = {
      id: this.nextId++,
      type,
      x: clamp(x, 30, this.street.length - 30),
      hp: s.hp,
      max: s.hp,
      s,
      state: "walk",
      timer: 0,
      cool: 0.3 + this.rand() * 0.5,
      vx: 0,
      dir: -side,
      side: 0,
      offset: 0,
      biteCool: 0,
      phase: this.rand() * 6,
      pace: 0.88 + this.rand() * 0.24,
      flash: 0,
      lungeLeft: 0,
    };
    this.dinos.push(d);
    if (type === "brute") this.emit("roar");
    return d;
  }

  // ---------- dinosaurs: approach, lunge, latch, chomp. They never shoot. ----------
  stepDinos(dt) {
    const p = this.player;
    for (const d of this.dinos) {
      d.flash = Math.max(0, d.flash - dt);
      d.cool -= dt;
      d.phase += dt * 8;
      if (d.state === "latched") {
        d.x = p.x + d.side * d.offset;
        d.dir = -d.side;
        d.biteCool -= dt;
        if (d.biteCool <= 0) {
          d.biteCool = d.s.biteRate;
          this.bite(d);
        }
        continue;
      }
      // knockback slides
      if (d.vx) {
        d.x += d.vx * dt;
        d.vx *= Math.max(0, 1 - dt * 8);
        if (Math.abs(d.vx) < 8) d.vx = 0;
      }
      d.x = clamp(d.x, 20, this.street.length - 20);
      const dist = p.x - d.x,
        adist = Math.abs(dist),
        dir = Math.sign(dist) || 1;
      const contact = d.s.width * 0.92;
      d.timer -= dt;
      switch (d.state) {
        case "walk":
          d.dir = dir;
          if (adist > contact) d.x += dir * d.s.speed * d.pace * dt;
          if (adist <= d.s.lungeRange && d.cool <= 0) {
            d.state = "windup";
            d.timer = 0.18;
          } else if (adist <= contact && d.cool <= 0) this.latch(d);
          break;
        case "windup":
          if (d.timer <= 0) {
            d.state = "lunge";
            d.lungeLeft = d.s.lungeDist;
            this.emit("lunge", { dino: d.type });
          }
          break;
        case "lunge": {
          const step = d.s.lungeSpeed * dt;
          d.x += d.dir * step;
          d.lungeLeft -= step;
          if (Math.abs(p.x - d.x) <= contact || Math.sign(p.x - d.x) !== d.dir) this.latch(d);
          else if (d.lungeLeft <= 0) {
            d.state = "recover";
            d.timer = 0.45;
          }
          break;
        }
        case "recover":
        case "stagger":
          if (d.timer <= 0) {
            d.state = "walk";
            d.cool = 0.5 + this.rand() * 0.4;
          }
          break;
      }
    }
  }

  latch(d) {
    const p = this.player;
    d.state = "latched";
    d.side = Math.sign(d.x - p.x) || -p.facing;
    d.offset = d.s.width * 0.78 + this.rand() * 28;
    d.biteCool = 0.12;
    d.vx = 0;
  }

  bite(d) {
    const p = this.player;
    if (p.grace > 0) return;
    p.hp = Math.max(0, p.hp - d.s.bite);
    p.hurt = 0.15;
    p.blood = Math.min(14, p.blood + 1);
    this.bleed(p.x + d.side * 16, 90 + this.rand() * 55, -d.side, 0.8);
    this.emit("bite", { dino: d.type });
  }

  unlatch(d, push = 0) {
    if (d.state === "latched") {
      d.state = "stagger";
      d.timer = 0.3;
    }
    if (push) {
      d.state = "stagger";
      d.timer = Math.max(d.timer, 0.3);
      d.vx = push * (1 - d.s.knockResist);
    }
  }

  // ---------- player attacks ----------
  inFront(range, behindSlack = 30) {
    const p = this.player;
    return this.dinos
      .filter((d) => d.hp > 0)
      .map((d) => ({ d, rel: (d.x - p.x) * p.facing }))
      .filter((o) => o.rel >= -behindSlack && o.rel <= range)
      .sort((a, b) => a.rel - b.rel)
      .map((o) => o.d);
  }

  fire() {
    const p = this.player,
      g = this.gun,
      lv = this.lv(g.id),
      dmg = damageFor(g.id, lv);
    p.fireCool = g.rate;
    p.muzzle = 0.06;
    p.recoil = g.family === "shotgun" || g.family === "launcher" ? 1 : g.family === "pistol" ? 0.6 : 0.35;
    p.aim = 0.6; // the gun arm stays up for a moment after each shot
    if (g.family !== "flame") this.inv.owned[g.id].ammo -= 1;
    else this.inv.owned[g.id].ammo = Math.max(0, this.inv.owned[g.id].ammo - 1);
    const mx = p.x + p.facing * 48;
    this.emit("shot", { family: g.family });
    switch (g.family) {
      case "pistol":
      case "smg":
      case "rifle": {
        const targets = this.inFront(g.range).slice(0, 1 + (g.pierce || 0));
        const knock = g.family === "pistol" ? 60 : g.family === "rifle" ? 70 : 35;
        for (const d of targets) this.damage(d, dmg, p.facing * knock);
        const end = targets.length ? targets[targets.length - 1].x : p.x + p.facing * g.range;
        this.tracers.push({ x1: mx, x2: end, y: CHEST + (this.rand() - 0.5) * 8, life: 0.06, kind: "bullet" });
        break;
      }
      case "shotgun": {
        const targets = this.inFront(g.range).slice(0, 3);
        for (let i = 0; i < g.pellets; i++) {
          const d = targets[Math.min(i >> 1, targets.length - 1)];
          if (d) this.damage(d, dmg, p.facing * 70);
          this.tracers.push({ x1: mx, x2: d ? d.x : p.x + p.facing * g.range, y: CHEST + (i - g.pellets / 2) * 5, life: 0.07, kind: "pellet" });
        }
        break;
      }
      case "flame": {
        for (const d of this.inFront(g.range, 20)) this.damage(d, dmg, p.facing * 25, true);
        this.flames.push({ x: mx, dir: p.facing, len: g.range, life: 0.12, seed: this.rand() });
        break;
      }
      case "laser": {
        for (const d of this.inFront(g.range)) this.damage(d, dmg, p.facing * 90);
        this.tracers.push({ x1: mx, x2: p.x + p.facing * g.range, y: CHEST, life: 0.2, kind: "laser" });
        break;
      }
      case "saw":
      case "launcher":
        this.projectiles.push({
          kind: g.id === "grenade" ? "grenade" : g.family === "saw" ? "saw" : "rocket",
          x: mx,
          y: CHEST,
          vx: p.facing * g.speed,
          vy: g.arc ? 260 : 0,
          damage: dmg,
          splash: g.splash || 0,
          pierce: g.pierce || 0,
          hit: new Set(),
          life: 2.5,
          rot: 0,
        });
        break;
    }
  }

  stepProjectiles(dt) {
    for (const b of this.projectiles) {
      const prev = b.x;
      b.x += b.vx * dt;
      if (b.kind === "grenade") {
        b.vy -= 700 * dt;
        b.y += b.vy * dt;
      }
      b.rot += dt * 20;
      b.life -= dt;
      const lo = Math.min(prev, b.x) - 30,
        hi = Math.max(prev, b.x) + 30;
      const hits = this.dinos.filter((d) => d.hp > 0 && !b.hit.has(d.id) && d.x >= lo && d.x <= hi && b.y < 120);
      if (b.kind === "saw") {
        for (const d of hits) {
          b.hit.add(d.id);
          this.damage(d, b.damage, Math.sign(b.vx) * 90);
        }
      } else if (hits.length || (b.kind === "grenade" && b.y <= 0)) {
        this.explode(b.x, b.damage, b.splash);
        b.life = 0;
      }
      if (b.x < -200 || b.x > this.street.length + 200) b.life = 0;
    }
    this.projectiles = this.projectiles.filter((b) => b.life > 0);
  }

  explode(x, damage, radius) {
    this.explosions.push({ x, r: radius, life: 0.55, max: 0.55 });
    this.emit("explode");
    for (const d of this.dinos) {
      const dist = Math.abs(d.x - x);
      if (d.hp > 0 && dist <= radius) this.damage(d, damage * (1 - (0.5 * dist) / radius), Math.sign(d.x - x || 1) * 320);
    }
  }

  doMelee() {
    const p = this.player,
      m = this.melee,
      dmg = damageFor(m.id, this.lv(m.id));
    p.meleeCool = m.rate;
    p.swing = 0.22;
    this.emit("melee", { weapon: m.id });
    // the shove: every latched dino is shaken off, those in front take the hit
    const behind = new Set();
    for (const d of this.latched())
      if ((d.x - p.x) * p.facing < 0) {
        behind.add(d);
        this.unlatch(d, -p.facing * m.knock * 0.5);
      }
    for (const d of this.inFront(m.reach, 12)) if (!behind.has(d)) this.damage(d, dmg, p.facing * m.knock);
  }

  damage(d, amount, push = 0, burn = false) {
    if (d.hp <= 0) return;
    d.hp -= amount;
    d.flash = 0.1;
    const dir = Math.sign(push) || this.player.facing;
    this.bleed(d.x + d.dir * d.s.width * 0.55, (d.type === "brute" ? 170 : 112) + (this.rand() - 0.5) * 40, dir, Math.min(1.8, 0.6 + amount / 35));
    d.burn = burn ? 0.4 : d.burn;
    if (d.hp <= 0) return this.kill(d, push);
    this.unlatch(d, push);
  }

  kill(d, push) {
    d.hp = 0;
    this.dinos = this.dinos.filter((o) => o !== d);
    this.kills++;
    this.levelKills = (this.levelKills || 0) + 1;
    this.profile.best.totalKills = (this.profile.best.totalKills || 0) + 1;
    const reward = this.mode === "blitz" ? Math.round(d.s.blitzReward * (1 + this.t / 240)) : d.s.reward;
    this.addCash(reward);
    this.emit("kill", { dino: d.type });
    // gore: the head pops, eyes and meat fly, and everything stays on the pavement
    const dir = Math.sign(push) || -d.dir || 1;
    const big = d.type === "brute" ? 1.45 : 1;
    const headX = d.x + d.dir * d.s.width * 0.75;
    this.corpses.push({ x: d.x, type: d.type, dir: d.dir, life: 4.5, max: 4.5, burnt: !!d.burn });
    // the head goes up whole, spinning, and lands somewhere behind
    this.gibs.push({ x: headX, y: -135 * big, vx: dir * (90 + this.rand() * 120), vy: -500 - this.rand() * 110, rot: 0, vr: dir * (7 + this.rand() * 6), kind: "head", type: d.type, size: big });
    for (let i = 0; i < 2; i++)
      this.gibs.push({ x: headX, y: -110, vx: dir * (40 + this.rand() * 160) + (this.rand() - 0.5) * 120, vy: -380 - this.rand() * 260, rot: 0, vr: 14, kind: "eye", size: 1 });
    const chunks = 3 + Math.floor(this.rand() * 4);
    for (let i = 0; i < chunks; i++)
      this.gibs.push({
        x: d.x + (this.rand() - 0.5) * 40,
        y: -90,
        vx: dir * (30 + this.rand() * 220) + (this.rand() - 0.5) * 140,
        vy: -260 - this.rand() * 380,
        rot: this.rand() * 6,
        vr: (this.rand() - 0.5) * 20,
        kind: "chunk",
        size: 0.7 + this.rand() * 0.7,
      });
    this.addDecal({ x: d.x, kind: "pool", size: d.type === "brute" ? 1.9 : 1.3, rot: 0 });
    this.addDecal({ x: d.x + dir * 40, kind: "smear", size: 1 + this.rand() * 0.6, rot: dir });
    // the neck pumps while the body is still standing
    this.geysers.push({ x: d.x + d.dir * d.s.width * 0.5, h: 125 * big, dir: -dir * 0.3, life: 0.6, acc: 0 });
    this.bleed(headX, 125 * big, dir, 2.2);
    this.sprays.push({ x: headX, h: 125 * big, dir, life: 0.32, max: 0.32, n: 34, seed: this.rand() * 1000, big: 2.6, radial: true });
    if (this.mode === "city" && this.rand() < 0.55) this.addDecal({ x: d.x + dir * (20 + this.rand() * 60), kind: "wall", size: 0.8 + this.rand() * 0.8, h: 70 + this.rand() * 110, rot: this.rand() * 6 });
  }

  addCash(n) {
    this.profile.cash += n;
    this.earned += n;
    this.levelEarned = (this.levelEarned || 0) + n;
  }

  swap() {
    const owned = WEAPONS.filter((w) => !isMelee(w.id) && this.inv.owned[w.id]);
    if (owned.length < 2) return;
    const loaded = owned.filter((w) => this.inv.owned[w.id].ammo > 0);
    const list = loaded.length ? loaded : owned;
    const i = list.findIndex((w) => w.id === this.inv.gun);
    this.inv.gun = list[(i + 1) % list.length].id;
    this.emit("swap", { weapon: this.inv.gun });
  }

  die() {
    if (this.status === "dead") return;
    this.status = "dead";
    this.result = { mode: this.mode, level: this.level, time: this.mode === "blitz" ? this.t : this.runTime, kills: this.kills, earned: this.earned, at: Date.now() };
    this.emit("dead", { ...this.result, canRevive: !this.revived });
    if (!this.deferEnd) this.endRun();
  }

  // ---------- Gun Barn: a room you walk along, not a menu ----------
  shopItems() {
    const level = this.profile.level;
    const open = WEAPONS.filter((w) => w.price > 0 && w.unlock <= level).sort((a, b) => a.price - b.price);
    const items = open.map((w) => ({ kind: "weapon", id: w.id }));
    // the next few guns hang behind blank tags, as on the real rack
    const locked = WEAPONS.filter((w) => w.price > 0 && w.unlock > level).sort((a, b) => a.unlock - b.unlock || a.price - b.price);
    for (const w of locked.slice(0, 3)) items.push({ kind: "locked", id: w.id });
    items.push({ kind: "medkit", id: MEDKIT.id });
    return items.map((it, i) => ({ ...it, x: SHOP_RACK_X + i * SHOP_SLOT + SHOP_SLOT / 2 }));
  }

  enterShop(door) {
    const items = this.shopItems();
    this.scene = "shop";
    this.shop = {
      x: SHOP_EXIT_X + 70,
      width: SHOP_RACK_X + items.length * SHOP_SLOT + 140,
      items,
      returnX: door.x,
      selected: null,
      message: null,
      messageLife: 0,
    };
    this.projectiles = [];
    this.emit("enterShop");
  }

  exitShop() {
    const p = this.player;
    p.x = this.shop.returnX;
    p.facing = 1;
    p.grace = 1.2;
    // dinos crowding the door are shoved back so leaving the shop is not an ambush
    for (const d of this.dinos)
      if (Math.abs(d.x - p.x) < 260) {
        if (d.state === "latched") d.state = "walk";
        d.x = p.x + (Math.sign(d.x - p.x) || 1) * 300;
      }
    this.scene = "street";
    this.shop = null;
    this.emit("exitShop");
    this.emit("save");
  }

  shopSay(text) {
    this.shop.message = text;
    this.shop.messageLife = 1.6;
  }

  itemUnderKid() {
    const s = this.shop;
    return s.items.find((it) => Math.abs(it.x - s.x) < SHOP_SLOT / 2) || null;
  }

  stepShop(dt, pressed) {
    const s = this.shop,
      p = this.player,
      inp = this.input;
    s.messageLife = Math.max(0, s.messageLife - dt);
    const move = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    p.moving = !!move;
    if (move) {
      p.facing = move;
      p.walk += dt * 10;
    }
    s.x = clamp(s.x + move * PLAYER_SPEED * dt, 40, s.width - 40);
    // walking off the left edge (or the green button at the door) leaves
    if (move < 0 && s.x <= 40) {
      p.leaveTimer += dt;
      if (p.leaveTimer > 0.25) return this.exitShop();
    } else p.leaveTimer = 0;
    if ((pressed("green") || pressed("act")) && this.atShopExit) return this.exitShop();
    if (pressed("swap") || (pressed("green") && !this.atShopExit)) this.swap();
    s.selected = this.itemUnderKid();
    if (pressed("fire")) this.buy(s.selected);
    else if (pressed("melee")) this.buyAmmo(s.selected);
  }

  priceOf(item) {
    if (!item) return null;
    if (item.kind === "medkit") return MEDKIT.price;
    if (item.kind === "locked") return null;
    const o = this.profile.owned[item.id];
    if (!o) return WEAPON[item.id].price;
    return o.lv >= MAX_LV ? null : upgradePrice(item.id, o.lv);
  }

  buy(item) {
    if (!item || item.kind === "locked") return false;
    const price = this.priceOf(item);
    const p = this.player,
      prof = this.profile;
    if (price == null) return this.deny("MAXED OUT");
    if (prof.cash < price) return this.deny("NOT ENOUGH CASH");
    if (item.kind === "medkit") {
      if (p.hp >= p.maxHp) return this.deny("YOU LOOK FINE");
      prof.cash -= price;
      p.hp = Math.min(p.maxHp, p.hp + MEDKIT.heal);
      this.shopSay("PATCHED UP.");
    } else {
      const w = WEAPON[item.id];
      const o = prof.owned[w.id];
      prof.cash -= price;
      if (!o) {
        prof.owned[w.id] = { lv: 1, ammo: w.startAmmo || 0 };
        if (isMelee(w.id)) prof.melee = w.id;
        else prof.gun = w.id;
        this.shopSay(`${w.name.toUpperCase()}. GOOD CHOICE.`);
      } else {
        o.lv += 1;
        this.shopSay(`LV ${o.lv}. HITS HARDER.`);
      }
    }
    this.emit("buy");
    this.emit("save");
    return true;
  }

  buyAmmo(item) {
    if (!item || item.kind !== "weapon") return false;
    const w = WEAPON[item.id],
      o = this.profile.owned[w.id];
    if (!o || isMelee(w.id)) return this.deny(o ? "NO AMMO FOR THAT" : "BUY THE GUN FIRST");
    if (this.profile.cash < w.ammoPrice) return this.deny("NOT ENOUGH CASH");
    this.profile.cash -= w.ammoPrice;
    o.ammo += w.ammoPack;
    this.shopSay(`+${w.ammoPack} ROUNDS.`);
    this.emit("buy");
    this.emit("save");
    return true;
  }

  deny(msg) {
    this.shopSay(msg);
    this.emit("deny");
    return false;
  }
}
