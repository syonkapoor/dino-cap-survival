import { WEAPONS, HEROES, normalizeProfile } from "./data.js";
import { Renderer, VIEW } from "./render.js";
export { WEAPONS } from "./data.js";
const WORLD_LENGTH = 4200;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function missionForDay(day) {
  const missions = [
    { objective: "kills", target: 25, title: "DINO EXTERMINATION" },
    { objective: "survive", target: 90, title: "HOLD YOUR GROUND" },
    { objective: "distance", target: 1200, title: "MAKE A RUN FOR IT" },
    { objective: "eggs", target: 3, title: "EGG SNATCHER" },
  ];
  const m = missions[(day - 1) % 4];
  return {
    ...m,
    target:
      m.objective === "kills"
        ? m.target + Math.floor((day - 1) / 4) * 10
        : m.target,
  };
}
export class Game {
  constructor(canvas, profile, onUpdate, onFinish, onShop) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.profile = normalizeProfile(profile);
    this.onUpdate = onUpdate;
    this.onFinish = onFinish;
    this.onShop = onShop;
    this.status = "menu";
    this.edition = this.profile.edition;
    this.hero = this.profile.hero;
    this.biome = "jungle";
    this.mode = "arena";
    this.objective = "endless";
    this.target = 0;
    this.x = 980;
    this.camera = 480;
    this.facing = 1;
    this.maxHp = 100;
    this.hp = 100;
    this.weapon = 1;
    this.keys = {};
    this.mouse = { x: 800, y: 382, down: false };
    this.touchAim = false;
    this.inventory = [...this.profile.unlocked];
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.particles = [];
    this.corpses = [];
    this.events = [];
    this.eggs = [];
    this.allyUnits = [];
    this.wave = 1;
    this.waveKills = 0;
    this.kills = 0;
    this.earned = 0;
    this.time = 0;
    this.distance = 0;
    this.collectedEggs = 0;
    this.cool = 0;
    this.specialCool = 0;
    this.meleeHeld = false;
    this.inv = 0;
    this.attack = 0;
    this.swingWeapon = null;
    this.muzzle = 0;
    this.spawn = 1.5;
    this.pickupTimer = 6;
    this.nextHud = 0;
    this.last = 0;
    this.muted = false;
    this.destroyed = false;
    this.interactCool = 0;
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }
  configure({
    edition = this.edition,
    hero = this.hero,
    biome = this.biome,
    mode = this.mode,
    objective = "endless",
    target = 0,
  }) {
    this.edition = edition;
    this.hero = edition === "classic" ? "kid" : hero;
    this.biome = biome;
    this.mode = mode;
    this.objective = objective;
    this.target = target;
    this.renderer.prepare(biome);
    if (this.status === "menu") {
      const w = HEROES.find((h) => h.id === this.hero)?.weapon ?? 1;
      this.weapon = this.inventory.includes(w) ? w : 1;
    }
  }
  start() {
    this.maxHp = 100 + (this.profile.heroUpgrades[this.hero] || 0) * 10;
    this.hp = this.maxHp;
    this.x =
      this.objective === "distance" || this.objective === "eggs" ? 250 : 980;
    this.camera = clamp(this.x - 480, 0, WORLD_LENGTH - VIEW.width);
    this.allyUnits = this.profile.allies.map((id, i) => ({
      id,
      x: this.x - 65 - i * 45,
      cool: 0,
    }));
    this.eggs = [850, 1950, 3050].map((x) => ({ x, collected: false }));
    this.status = "playing";
    this.events = [
      {
        text:
          this.mode === "blitz"
            ? "JUNGLE BLITZ"
            : this.objective === "endless"
              ? "WAVE 1"
              : "DAY " + this.profile.day,
        life: 2,
      },
    ];
    this.emit();
  }
  pause() {
    if (this.status === "playing") {
      this.status = "paused";
      this.releaseInputs();
      this.emit();
    }
  }
  resume(profile) {
    if (profile) this.syncProfile(profile);
    this.status = "playing";
    this.last = 0;
    this.emit();
  }
  syncProfile(profile) {
    this.profile = normalizeProfile(profile);
    this.inventory = [
      ...new Set([...this.inventory, ...this.profile.unlocked]),
    ];
    this.maxHp = 100 + (this.profile.heroUpgrades[this.hero] || 0) * 10;
    for (const id of this.profile.allies)
      if (!this.allyUnits.some((a) => a.id === id))
        this.allyUnits.push({ id, x: this.x - 80, cool: 0 });
  }
  releaseInputs() {
    this.keys = {};
    this.mouse.down = false;
    this.meleeHeld = false;
  }
  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.audio?.close();
  }
  cycle(direction) {
    const current = this.inventory.indexOf(this.weapon);
    this.weapon =
      this.inventory[
        (current + direction + this.inventory.length) % this.inventory.length
      ];
    this.emit();
  }
  select(index) {
    if (this.inventory.includes(index)) {
      this.weapon = index;
      this.emit();
    }
  }
  emit() {
    this.onUpdate({
      hp: this.hp,
      maxHp: this.maxHp,
      weapon: this.weapon,
      inventory: [...this.inventory],
      kills: this.kills,
      wave: this.wave,
      waveKills: this.waveKills,
      waveTarget: 10 + this.wave * 2,
      profile: structuredClone(this.profile),
      earned: this.earned,
      time: this.time,
      distance: this.distance,
      eggs: this.collectedEggs,
      progress: this.progress(),
      objective: this.objective,
      target: this.target,
      specialCool: this.specialCool,
      nearShop: this.mode === "city" && Math.abs(this.x - 1050) < 90,
    });
  }
  progress() {
    return this.objective === "kills"
      ? this.kills
      : this.objective === "survive"
        ? this.time
        : this.objective === "distance"
          ? this.distance
          : this.objective === "eggs"
            ? this.collectedEggs
            : this.waveKills;
  }
  sound(kind = "shot") {
    if (this.muted) return;
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.audio.state === "suspended") this.audio.resume();
      const o = this.audio.createOscillator(),
        g = this.audio.createGain(),
        now = this.audio.currentTime;
      o.type =
        kind === "pickup" ? "sine" : kind === "shot" ? "sawtooth" : "triangle";
      o.frequency.setValueAtTime(
        kind === "pickup" ? 740 : kind === "hurt" ? 100 : 230,
        now,
      );
      o.frequency.exponentialRampToValueAtTime(
        kind === "pickup" ? 1100 : 45,
        now + 0.1,
      );
      g.gain.setValueAtTime(0.028, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      o.connect(g);
      g.connect(this.audio.destination);
      o.start();
      o.stop(now + 0.14);
    } catch {}
  }
  particle(x, y, text, color = "#ffe664") {
    this.particles.push({
      x,
      y,
      text,
      life: 0.8,
      color,
      size: 3,
      vx: 0,
      vy: -35,
    });
  }
  hurt(damage, from) {
    if (this.inv > 0 || this.status !== "playing") return;
    this.hp = clamp(this.hp - damage, 0, this.maxHp);
    this.inv = 0.7;
    this.x = clamp(
      this.x + Math.sign(this.x - from) * 28,
      45,
      WORLD_LENGTH - 45,
    );
    this.sound("hurt");
    this.particle(this.x, 326, "−" + damage, "#ff5341");
  }
  hit(enemy, damage, knock = 25, from = this.x) {
    if (enemy.dead) return;
    enemy.hp -= damage;
    enemy.flash = 0.14;
    enemy.vx =
      (enemy.vx || 0) +
      Math.sign(enemy.x - from) * knock * (enemy.type === 1 ? 0.16 : 1);
    this.particle(
      enemy.x,
      enemy.type === 1 ? 270 : 320,
      String(Math.round(damage)),
      "#fff1ca",
    );
    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.kills++;
      this.waveKills++;
      const cash = [60, 350, 120][enemy.type];
      this.earned += cash;
      this.profile.cash += cash;
      this.profile.exp += [20, 100, 45][enemy.type];
      this.corpses.push({ x: enemy.x, type: enemy.type });
      if (this.corpses.length > 50) this.corpses.shift();
      for (let i = 0; i < 8; i++)
        this.particles.push({
          x: enemy.x,
          y: 380,
          text: null,
          color: i % 3 ? "#d74736" : "#e9dec9",
          life: 0.7 + Math.random() * 0.4,
          size: 2 + Math.random() * 3,
          vx: (Math.random() - 0.5) * 150,
          vy: -50 - Math.random() * 100,
        });
      this.particle(enemy.x, 303, "+$" + cash);
      while (this.profile.exp >= this.profile.level * 100) {
        this.profile.exp -= this.profile.level * 100;
        this.profile.level++;
        this.hp = Math.min(this.maxHp, this.hp + 25);
        this.events.push({ text: "LEVEL UP!", life: 2 });
      }
      if (Math.random() < 0.43)
        this.drops.push({
          x: enemy.x,
          type: Math.random() < 0.5 ? "health" : "ammo",
          life: 18,
        });
      if (this.waveKills >= 10 + this.wave * 2) {
        this.wave++;
        this.waveKills = 0;
        if (this.objective === "endless") {
          this.hp = Math.min(this.maxHp, this.hp + 15);
          this.events.push({ text: "WAVE " + this.wave, life: 2 });
        }
      }
    }
  }
  quickMelee() {
    if (this.cool > 0) return;
    this.cool = 0.32;
    this.attack = 0.2;
    const index = this.hero === "knight" ? 25 : this.hero === "girl" ? 28 : 0;
    const w = WEAPONS[index];
    this.swingWeapon = index;
    this.enemies
      .filter(
        (e) =>
          Math.abs(e.x - this.x) < w.range &&
          (e.x - this.x) * this.facing > -20,
      )
      .forEach((e) =>
        this.hit(e, w.damage + this.profile.upgrades[index] * 2, 190),
      );
    this.sound();
  }
  special() {
    if (this.edition !== "sequel") return;
    if (this.specialCool > 0 || this.status !== "playing") return;
    if (this.profile.ammo.energy < 3) {
      this.particle(this.x, 320, "NO ENERGY", "#ffad73");
      return;
    }
    this.profile.ammo.energy -= 3;
    this.specialCool = 3;
    this.attack = 0.3;
    this.events.push({
      text:
        this.hero === "ninja"
          ? "NINJA STRIKE!"
          : this.hero === "girl"
            ? "CRATE SMASH!"
            : "FORCE BLAST!",
      life: 0.65,
    });
    this.enemies
      .filter((e) => Math.abs(e.x - this.x) < 280)
      .forEach((e) => this.hit(e, 45, 330));
    this.sound("pickup");
    this.emit();
  }
  attackPlayer() {
    const w = WEAPONS[this.weapon];
    if (this.cool > 0) return;
    if (w.ammo && this.profile.ammo[w.ammo] <= 0) {
      this.cool = 0.25;
      this.particle(this.x, 320, "NO AMMO", "#f88965");
      return;
    }
    this.cool = w.rate;
    this.attack = 0.2;
    this.swingWeapon = w.family === "melee" ? this.weapon : null;
    if (w.ammo) this.profile.ammo[w.ammo]--;
    this.sound();
    const damage = w.damage + this.profile.upgrades[this.weapon] * 2;
    if (w.family === "melee") {
      this.enemies
        .filter(
          (e) =>
            Math.abs(e.x - this.x) < w.range &&
            (e.x - this.x) * this.facing > -20,
        )
        .forEach((e) => this.hit(e, damage, 180));
      return;
    }
    this.muzzle = 0.065;
    const angle = this.touchAim
      ? this.facing === 1
        ? 0
        : Math.PI
      : Math.atan2(this.mouse.y - 382, this.mouse.x - (this.x - this.camera));
    const count = w.family === "shotgun" ? 3 : 1;
    for (let i = 0; i < count; i++) {
      let a = angle + (i - (count - 1) / 2) * 0.115;
      const speed =
        w.family === "flame" ? 410 : w.family === "launcher" ? 520 : 900;
      this.bullets.push({
        x: this.x + Math.cos(a) * 45,
        y: 382,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        damage: damage / count,
        life: w.family === "flame" ? 0.4 : 1.7,
        acid: false,
        family: w.family,
        knock: w.family === "shotgun" ? 200 : 35,
        owner: "player",
      });
    }
  }
  spawnEnemy() {
    const type =
      this.time < 8
        ? 0
        : Math.random() < Math.min(0.26, 0.07 + this.wave * 0.025)
          ? 1
          : Math.random() < 0.35
            ? 2
            : 0;
    let x =
      this.x + (Math.random() < 0.5 ? -1 : 1) * (620 + Math.random() * 130);
    if (x < 45) x = this.x + 660;
    if (x > WORLD_LENGTH - 45) x = this.x - 660;
    const max =
      [20, 150, 50][type] * (this.wave > 5 ? 1 + (this.wave - 5) * 0.06 : 1);
    this.enemies.push({
      x: clamp(x, 35, WORLD_LENGTH - 35),
      type,
      hp: max,
      max,
      cool: 1.4,
      flash: 0,
      attack: 0,
      vx: 0,
      dead: false,
      armored:
        this.edition === "sequel" && this.wave >= 2 && Math.random() < 0.4,
    });
  }
  collect(d) {
    if (d.type === "health") {
      this.hp = Math.min(this.maxHp, this.hp + 25);
      this.particle(this.x, 330, "+25 HP", "#b2f592");
    } else if (d.type === "weapon") {
      if (!this.inventory.includes(d.weapon)) this.inventory.push(d.weapon);
      this.weapon = d.weapon;
      const w = WEAPONS[d.weapon];
      if (w.ammo) this.profile.ammo[w.ammo] += w.family === "launcher" ? 6 : 45;
      this.particle(this.x, 330, w.name.toUpperCase(), "#ffd465");
    } else {
      this.profile.ammo.shells += 8;
      this.profile.ammo.smg += 40;
      this.profile.ammo.rifle += 30;
      this.profile.ammo.energy += 20;
      this.particle(this.x, 330, "AMMO +", "#ffd465");
    }
    d.life = 0;
    this.sound("pickup");
  }
  update(dt) {
    this.time += dt;
    this.cool -= dt;
    this.specialCool = Math.max(0, this.specialCool - dt);
    this.inv -= dt;
    this.attack = Math.max(0, this.attack - dt);
    this.muzzle = Math.max(0, this.muzzle - dt);
    this.interactCool -= dt;
    const move =
      (this.keys.d || this.keys.ArrowRight ? 1 : 0) -
      (this.keys.a || this.keys.ArrowLeft ? 1 : 0);
    this.moving = !!move;
    const before = this.x;
    this.x = clamp(
      this.x + move * (this.hero === "ninja" ? 260 : 230) * dt,
      45,
      WORLD_LENGTH - 45,
    );
    this.distance += Math.abs(this.x - before);
    if (this.touchAim && move) this.facing = move;
    else if (!this.touchAim)
      this.facing = this.mouse.x > this.x - this.camera ? 1 : -1;
    this.camera +=
      (clamp(this.x - 480, 0, WORLD_LENGTH - VIEW.width) - this.camera) *
      Math.min(1, dt * 7);
    if (this.meleeHeld || this.keys.j) this.quickMelee();
    else if (this.mouse.down || this.keys[" "] || this.keys.k)
      this.attackPlayer();
    if (
      this.mode === "city" &&
      this.keys.f &&
      this.interactCool <= 0 &&
      Math.abs(this.x - 1050) < 90
    ) {
      this.interactCool = 1;
      this.pause();
      this.onShop?.();
      return;
    }
    this.spawn -= dt;
    if (this.spawn <= 0 && this.enemies.length < 18) {
      this.spawnEnemy();
      this.spawn = Math.max(0.4, 1.9 - this.wave * 0.11);
    }
    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.pickupTimer = this.mode === "blitz" ? 8 : 18;
      this.drops.push({
        x: clamp(this.x + (Math.random() - 0.5) * 600, 60, WORLD_LENGTH - 60),
        type: this.mode === "blitz" ? "weapon" : "ammo",
        weapon: 1 + Math.floor(Math.random() * 24),
        life: 20,
      });
    }
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.attack = Math.max(0, e.attack - dt);
      e.cool -= dt;
      e.x = clamp(e.x + (e.vx || 0) * dt, 30, WORLD_LENGTH - 30);
      e.vx *= Math.max(0, 1 - dt * 9);
      const dist = this.x - e.x,
        speed = [107, 44, 72][e.type];
      if (Math.abs(dist) > (e.type === 2 ? 280 : e.type === 1 ? 73 : 47))
        e.x +=
          Math.sign(dist) *
          speed *
          dt *
          (e.type === 0 && Math.abs(dist) < 160 ? 1.85 : 1);
      if (e.cool <= 0) {
        if (e.type === 2 && Math.abs(dist) < 680) {
          const a = Math.atan2(4, dist);
          this.bullets.push({
            x: e.x + Math.sign(dist) * 45,
            y: 378,
            vx: Math.cos(a) * 250,
            vy: Math.sin(a) * 250,
            damage: 12,
            life: 3,
            acid: true,
          });
          e.cool = 2.3;
          e.attack = 0.3;
        } else if (Math.abs(dist) < (e.type === 1 ? 90 : 65)) {
          this.hurt([10, 35, 12][e.type], e.x);
          e.cool = e.type === 1 ? 1.4 : 0.95;
          e.attack = 0.4;
        }
      }
    }
    for (const b of this.bullets) {
      const previous = b.x;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      const crossed = (x) =>
        x >= Math.min(previous, b.x) - 20 && x <= Math.max(previous, b.x) + 20;
      if (b.acid) {
        if (crossed(this.x) && Math.abs(b.y - 380) < 45 && this.inv <= 0) {
          this.hurt(b.damage, b.x - Math.sign(b.vx) * 20);
          b.life = 0;
        }
      } else {
        const e = this.enemies.find(
          (e) =>
            !e.dead &&
            crossed(e.x) &&
            b.y > 430 - (e.type === 1 ? 175 : 110) &&
            b.y < 435,
        );
        if (e) {
          this.hit(e, b.damage, b.knock || 30, b.x - Math.sign(b.vx) * 30);
          if (b.family === "launcher") {
            this.enemies
              .filter((n) => n !== e && !n.dead && Math.abs(n.x - e.x) < 120)
              .forEach((n) => this.hit(n, b.damage * 0.65, 100, e.x));
            this.particle(e.x, 350, "BOOM!", "#ffb347");
          }
          if (b.family === "laser" || b.family === "saw") {
            b.damage *= 0.6;
            b.x += Math.sign(b.vx) * 48;
            if (b.damage < 4) b.life = 0;
          } else b.life = 0;
        }
      }
    }
    for (const a of this.allyUnits) {
      a.cool -= dt;
      a.attack = Math.max(0, (a.attack || 0) - dt);
      const targetX = this.x - 65 - this.allyUnits.indexOf(a) * 48;
      a.x += clamp(targetX - a.x, -250 * dt, 250 * dt);
      if (Math.abs(a.x - this.x) > 700) a.x = targetX;
      if (a.cool <= 0) {
        const target = this.enemies
          .filter(
            (e) =>
              !e.dead && Math.abs(e.x - a.x) < (a.id === "knight" ? 145 : 570),
          )
          .sort((e, b) => Math.abs(e.x - a.x) - Math.abs(b.x - a.x))[0];
        if (target) {
          a.facing = Math.sign(target.x - a.x);
          a.attack = 0.2;
          if (a.id === "knight") this.hit(target, 18, 110, a.x);
          else
            this.bullets.push({
              x: a.x,
              y: 382,
              vx: Math.sign(target.x - a.x) * 900,
              vy: 0,
              damage: 12,
              life: 1,
              acid: false,
              family: "rifle",
              knock: 30,
              owner: "ally",
            });
          a.cool = 0.6;
        }
      }
    }
    for (const d of this.drops) {
      d.life -= dt;
      if (Math.abs(this.x - d.x) < 35) this.collect(d);
    }
    for (const e of this.eggs)
      if (
        this.objective === "eggs" &&
        !e.collected &&
        Math.abs(e.x - this.x) < 35
      ) {
        e.collected = true;
        this.collectedEggs++;
        this.particle(e.x, 330, "EGG " + this.collectedEggs + "/3");
        this.sound("pickup");
      }
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.bullets = this.bullets.filter(
      (b) => b.life > 0 && b.y > -40 && b.y < 440,
    );
    this.drops = this.drops.filter((d) => d.life > 0);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      if (!p.text) p.vy += 280 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.events.forEach((e) => (e.life -= dt));
    this.events = this.events.filter((e) => e.life > 0);
    if (this.hp <= 0) {
      this.finish(false);
      return;
    }
    if (this.objective !== "endless" && this.progress() >= this.target) {
      this.finish(true);
      return;
    }
    if (this.time >= this.nextHud) {
      this.nextHud = this.time + 0.1;
      this.emit();
    }
  }
  finish(success) {
    this.status = success ? "complete" : "dead";
    this.releaseInputs();
    this.profile.best = Math.max(this.profile.best, this.kills);
    let bonus = 0;
    if (success) {
      bonus = 300 + this.profile.day * 100;
      this.profile.cash += bonus;
      this.earned += bonus;
      this.profile.day++;
    }
    this.emit();
    this.onFinish({
      success,
      bonus,
      profile: structuredClone(this.profile),
      kills: this.kills,
      earned: this.earned,
      wave: this.wave,
      time: this.time,
    });
  }
  frame(timestamp) {
    if (this.destroyed) return;
    const dt = this.last ? Math.min(0.04, (timestamp - this.last) / 1000) : 0;
    this.last = timestamp;
    if (this.status === "playing") this.update(dt);
    this.renderer.draw(this, timestamp / 1000);
    this.raf = requestAnimationFrame(this.frame);
  }
}
