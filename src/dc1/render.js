// Canvas renderer for the Dino Cap world. Logical height is 540; logical width
// follows the screen's aspect so a phone in landscape is filled edge to edge.
import { GROUND_Y, VIEW_H, WEAPON, MEDKIT, damageFor } from "./data.js";
import { SHOP_SLOT, SHOP_RACK_X, SHOP_EXIT_X } from "./engine.js";
import {
  INK,
  FONT,
  blob,
  poly,
  inked,
  ellipse,
  outlinedText,
  setTint,
  drawGun,
  drawMelee,
  drawSawBlade,
  drawAmmoIcon,
  drawKid,
  drawDino,
  drawCorpse,
  drawGib,
  drawPool,
  drawClerk,
  drawCrate,
  drawMedBottle,
} from "./art.js";

export const SIDEWALK_TOP = 398;
export const CURB_Y = 458;
const SHOP_FLOOR_Y = 478;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = (seed) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

function offscreen(w, h) {
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(w);
  cv.height = Math.ceil(h);
  return cv;
}

// ------------------------------------------------------------ city backdrops
function paintSkyline(w, h, seed, far) {
  const cv = offscreen(w, h),
    c = cv.getContext("2d"),
    r = rng(seed);
  c.fillStyle = far ? "#363c4f" : "#2b3040";
  let x = -20;
  while (x < w) {
    const bw = 60 + r() * (far ? 140 : 110),
      bh = (far ? 80 : 60) + r() * (far ? 170 : 130);
    c.fillRect(x, h - bh, bw, bh);
    if (!far && r() < 0.6)
      for (let i = 0; i < 6; i++)
        if (r() < 0.35) {
          c.fillStyle = "#5d5a45";
          c.fillRect(x + 8 + r() * (bw - 20), h - bh + 10 + r() * (bh - 30), 6, 8);
          c.fillStyle = "#2b3040";
        }
    if (far && r() < 0.25) {
      // a construction crane
      const cx = x + bw / 2,
        top = h - bh - 90;
      c.strokeStyle = "#363c4f";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(cx, h - bh);
      c.lineTo(cx, top);
      c.moveTo(cx - 40, top + 6);
      c.lineTo(cx + 120, top + 6);
      c.stroke();
      c.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.moveTo(cx - 40 + i * 20, top + 6);
        c.lineTo(cx - 30 + i * 20, top + 16);
        c.lineTo(cx - 20 + i * 20, top + 6);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(cx + 100, top + 6);
      c.lineTo(cx + 100, top + 60);
      c.stroke();
    }
    if (far && r() < 0.2) {
      // billboard on stilts
      c.fillRect(x + 10, h - bh - 46, 70, 34);
      c.fillRect(x + 22, h - bh - 14, 4, 14);
      c.fillRect(x + 62, h - bh - 14, 4, 14);
    }
    x += bw + (far ? 4 : 10);
  }
  return cv;
}

const SIGNS = {
  deli: { panel: "#3a63b5", border: "#24418a", text: "#ffd23f", stroke: INK, tilt: -0.05, size: 54 },
  checks: { panel: "#fff4c7", border: "#d6a419", text: "#f2c62b", stroke: "#5b3a12", tilt: 0, size: 40 },
  ammo: { panel: "#ffffff", border: "#e2512b", text: "#4d86d6", stroke: "#173a7a", tilt: 0, size: 44 },
  laundro: { panel: "#ffffff", border: "#2e8b3a", text: "#e9f6e0", stroke: "#1f6b2a", tilt: 0, size: 38 },
  jumbo: { panel: "#ffffff", border: "#7a3cc8", text: "#8b4fe0", stroke: "#3a1470", tilt: 0, size: 44 },
};
const WALLS = { deli: "#535c6c", checks: "#4c5463", ammo: "#4f5868", laundro: "#535a66", jumbo: "#4a5260", motel: "#55505a", house: "#5d7262", lot: null };
export const BUILD_H = 330;

function paintBuilding(b) {
  const w = b.w,
    h = BUILD_H,
    cv = offscreen(w, h),
    c = cv.getContext("2d"),
    r = rng(b.variant * 97 + w);
  const wall = WALLS[b.type];
  if (b.type === "lot") {
    // empty lot: chain-link fence and weeds
    c.strokeStyle = "#565e6c";
    c.lineWidth = 2;
    for (let x = 10; x < w - 10; x += 12) {
      c.beginPath();
      c.moveTo(x, h - 90);
      c.lineTo(x + 12, h - 10);
      c.moveTo(x + 12, h - 90);
      c.lineTo(x, h - 10);
      c.stroke();
    }
    for (const x of [10, w / 2, w - 12]) {
      poly(c, [[x - 3, h - 96], [x + 3, h - 96], [x + 3, h], [x - 3, h]]);
      inked(c, "#4b525e", 2.5);
    }
    for (let i = 0; i < 6; i++) {
      const x = 20 + r() * (w - 40);
      c.beginPath();
      c.moveTo(x, h);
      c.quadraticCurveTo(x - 6, h - 20, x - 12, h - 30);
      c.moveTo(x, h);
      c.quadraticCurveTo(x + 4, h - 24, x + 10, h - 32);
      c.lineWidth = 3;
      c.strokeStyle = "#2f4a35";
      c.stroke();
    }
    return cv;
  }
  if (b.type === "house") {
    poly(c, [[30, h - 210], [w / 2, h - 290], [w - 30, h - 210]]);
    inked(c, "#3e4a44", 4);
    poly(c, [[44, h - 212], [w - 44, h - 212], [w - 44, h], [44, h]]);
    inked(c, wall, 4);
    for (const x of [80, w - 150]) {
      poly(c, [[x, h - 180], [x + 70, h - 180], [x + 70, h - 120], [x, h - 120]]);
      inked(c, r() < 0.6 ? "#ffd23f" : "#2a2e3a", 3.5);
      c.fillStyle = INK;
      c.fillRect(x + 33, h - 180, 4, 60);
    }
    // bush
    blob(c, [[50, h], [40, h - 40], [80, h - 60], [120, h - 40], [118, h]]);
    inked(c, "#3f6b45", 3);
    return cv;
  }
  // storefront
  const floors = b.type === "motel" ? 2 : 1 + (b.variant % 2);
  const top = h - 160 - floors * 70;
  poly(c, [[6, top], [w - 6, top], [w - 6, h], [6, h]]);
  inked(c, wall, 4);
  // upper windows
  for (let f = 0; f < floors; f++)
    for (let x = 40; x < w - 70; x += 90) {
      const lit = r() < 0.25;
      poly(c, [[x, top + 20 + f * 70], [x + 50, top + 20 + f * 70], [x + 50, top + 64 + f * 70], [x, top + 64 + f * 70]]);
      inked(c, lit ? "#e8c64a" : "#2c313d", 3);
      if (!lit && r() < 0.4) {
        // claw marks / boarded
        c.strokeStyle = INK;
        c.lineWidth = 2.5;
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.moveTo(x + 10 + k * 10, top + 26 + f * 70);
          c.lineTo(x + 18 + k * 10, top + 56 + f * 70);
          c.stroke();
        }
      }
    }
  // ground-floor storefront band
  poly(c, [[6, h - 150], [w - 6, h - 150], [w - 6, h], [6, h]]);
  inked(c, "#424a58", 4);
  // two lit side windows with blinds, as in the footage
  for (const x of [40, w - 120]) {
    poly(c, [[x, h - 112], [x + 80, h - 112], [x + 80, h - 34], [x, h - 34]]);
    inked(c, "#ffd23f", 3.5);
    c.fillStyle = INK;
    c.fillRect(x + 22, h - 100, 9, 54);
    c.fillRect(x + 50, h - 100, 9, 54);
  }
  // sign
  const s = SIGNS[b.type];
  if (s) {
    c.save();
    c.translate(w / 2, h - 172);
    c.rotate(s.tilt);
    const sw = Math.min(w - 40, b.sign.length * s.size * 0.62 + 50);
    poly(c, [[-sw / 2, -36], [sw / 2, -36], [sw / 2, 36], [-sw / 2, 36]]);
    inked(c, s.border, 4);
    poly(c, [[-sw / 2 + 9, -27], [sw / 2 - 9, -27], [sw / 2 - 9, 27], [-sw / 2 + 9, 27]]);
    c.fillStyle = s.panel;
    c.fill();
    outlinedText(c, b.sign, 0, 2, s.size, s.text, { stroke: s.stroke, base: "middle", width: 6 });
    c.restore();
  } else if (b.type === "motel") {
    poly(c, [[w - 56, top - 20], [w - 16, top - 20], [w - 16, top + 200], [w - 56, top + 200]]);
    inked(c, "#f4ede0", 3.5);
    "MOTEL".split("").forEach((ch, i) => outlinedText(c, ch, w - 36, top + 22 + i * 38, 34, "#e64b3c", { width: 4 }));
  }
  return cv;
}

// ------------------------------------------------------------ jungle backdrop
function paintJungle(w, h, seed, layer) {
  const cv = offscreen(w, h),
    c = cv.getContext("2d"),
    r = rng(seed);
  if (layer === 0) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#14302f");
    g.addColorStop(1, "#24443f");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    // distant trunks
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      c.fillStyle = "#1b3836";
      c.fillRect(x, 0, 30 + r() * 30, h);
    }
  }
  // twisted vines and trunks
  const col = layer === 0 ? "#21423f" : "#1a3533";
  for (let i = 0; i < (layer === 0 ? 10 : 7); i++) {
    const x = r() * w;
    c.beginPath();
    c.moveTo(x, -10);
    c.bezierCurveTo(x + (r() - 0.5) * 300, h * 0.3, x + (r() - 0.5) * 300, h * 0.6, x + (r() - 0.5) * 120, h + 10);
    c.lineWidth = 16 + r() * 14;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth -= 6;
    c.strokeStyle = col;
    c.stroke();
    // loops
    if (layer === 1 && r() < 0.6) {
      c.beginPath();
      c.arc(x + 20, h * (0.2 + r() * 0.4), 30 + r() * 30, 0, Math.PI * 1.7);
      c.lineWidth = 9;
      c.strokeStyle = INK;
      c.stroke();
      c.lineWidth = 5;
      c.strokeStyle = col;
      c.stroke();
    }
  }
  if (layer === 1) {
    // pink seed pods and bushes along the path
    for (let i = 0; i < 6; i++) {
      const x = r() * w,
        y = 300 + r() * 60;
      blob(c, [[x - 10, y], [x, y - 26], [x + 10, y], [x, y + 10]]);
      inked(c, "#a84f8e", 2.5);
    }
    for (let i = 0; i < 18; i++) {
      const x = r() * w,
        y = 400;
      blob(c, [[x - 40, y], [x - 30, y - 40], [x, y - 55], [x + 30, y - 40], [x + 44, y]]);
      inked(c, "#2c5a47", 3);
    }
  }
  return cv;
}

function paintFerns(w, seed) {
  const cv = offscreen(w, 140),
    c = cv.getContext("2d"),
    r = rng(seed);
  for (let i = 0; i < 22; i++) {
    const x = r() * w,
      base = 140;
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.45 + (r() - 0.5) * 0.2,
        L = 70 + r() * 50;
      blob(c, [
        [x, base],
        [x + Math.cos(a - 0.15) * L * 0.6, base + Math.sin(a - 0.15) * L * 0.6],
        [x + Math.cos(a) * L, base + Math.sin(a) * L],
        [x + Math.cos(a + 0.15) * L * 0.6, base + Math.sin(a + 0.15) * L * 0.6],
      ]);
      inked(c, k % 2 ? "#2b6b4c" : "#347a57", 3);
    }
  }
  return cv;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d");
    this.W = 960;
    this.H = VIEW_H;
    this.k = 1;
    this.dpr = 1;
    this.cam = 0;
    this.cache = new Map();
    this.t = 0;
  }
  resize(cssW, cssH, dpr = 1) {
    this.dpr = Math.min(2, dpr);
    this.k = cssH / VIEW_H;
    this.W = clamp(cssW / this.k, 760, 1300);
    this.canvas.width = Math.round(this.W * this.k * this.dpr);
    this.canvas.height = Math.round(VIEW_H * this.k * this.dpr);
    return this.W;
  }
  cached(key, make) {
    let v = this.cache.get(key);
    if (!v) this.cache.set(key, (v = make()));
    return v;
  }
  tile(c, img, offset, y) {
    const w = img.width;
    let x = -(((offset % w) + w) % w);
    for (; x < this.W; x += w) c.drawImage(img, x, y);
  }

  draw(world, dt = 1 / 60) {
    const c = this.c;
    this.t += dt;
    c.setTransform(this.k * this.dpr, 0, 0, this.k * this.dpr, 0, 0);
    c.imageSmoothingEnabled = true;
    if (!world) {
      c.fillStyle = "#000";
      c.fillRect(0, 0, this.W, this.H);
      return;
    }
    if (world.scene === "shop") this.drawShop(world);
    else this.drawStreet(world, dt);
    this.drawHud(world);
    this.drawOverlay(world);
  }

  // ------------------------------------------------------------ street
  camera(world, dt) {
    const p = world.player;
    const target = clamp(p.x - this.W / 2 + p.facing * 70, 0, Math.max(0, world.street.length - this.W));
    this.cam += (target - this.cam) * Math.min(1, dt * 5);
    if (Math.abs(target - this.cam) > this.W) this.cam = target;
    return this.cam;
  }

  drawStreet(world, dt) {
    const c = this.c,
      W = this.W,
      cam = this.camera(world, dt),
      city = world.mode === "city";
    if (city) this.drawCityBack(world, cam);
    else this.drawJungleBack(cam);

    // ground decals: blood pools, chunks, eyes, heads. They stay all level.
    for (const d of world.decals) {
      const x = d.x - cam;
      if (x < -120 || x > W + 120) continue;
      c.save();
      c.translate(x, GROUND_Y + 6);
      if (d.kind === "pool") drawPool(c, d.size, d.seed);
      else drawGib(c, d.kind, d.size * 0.9, d.kind === "eye" ? 0 : d.rot, d.type, d.seed);
      c.restore();
    }
    for (const k of world.corpses) {
      const x = k.x - cam;
      if (x < -200 || x > W + 200) continue;
      c.save();
      c.globalAlpha = Math.min(1, k.life / 0.6);
      c.translate(x, GROUND_Y + 4);
      drawCorpse(c, k.type, k.dir, k.burnt);
      c.restore();
    }
    // drops (Jungle Blitz)
    for (const d of world.drops) {
      const x = d.x - cam;
      c.save();
      c.translate(x, GROUND_Y + d.y);
      if (!d.landed) {
        c.strokeStyle = "rgba(255,255,255,.45)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-14, -60);
        c.lineTo(-14, -110);
        c.moveTo(14, -60);
        c.lineTo(14, -120);
        c.stroke();
      }
      if (d.landed && d.life < 3 && Math.floor(this.t * 8) % 2) c.globalAlpha = 0.4;
      if (d.kind === "med") drawMedBottle(c);
      else {
        drawCrate(c, d.landed ? 0.5 + Math.sin(this.t * 6) * 0.5 : 0);
        c.translate(0, -18);
        if (d.kind === "weapon") drawGun(c, d.weapon, 0.55);
        else drawAmmoIcon(c, world.gun.family, 0, 0, 0.6);
      }
      c.restore();
    }

    const p = world.player;
    const order = [...world.dinos].sort((a, b) => (a.id % 3) - (b.id % 3) || a.x - b.x);
    const drawD = (d) => {
      const x = d.x - cam;
      if (x < -200 || x > W + 200) return;
      c.save();
      c.translate(x, GROUND_Y + (d.id % 3) * 4 - 4);
      drawDino(c, d, this.t);
      if (d.flash > 0) {
        c.globalAlpha = 0.6;
        setTint("#ffffff");
        drawDino(c, d, this.t);
        setTint(null);
      } else if (d.burn > 0) {
        c.globalAlpha = 0.45;
        setTint("#ff7a1a");
        drawDino(c, d, this.t);
        setTint(null);
      }
      c.restore();
    };
    for (const d of order) if (d.state !== "latched") drawD(d);
    // the kid
    c.save();
    c.translate(p.x - cam, GROUND_Y);
    ellipse(c, 0, 4, 30, 7);
    c.fillStyle = "rgba(0,0,0,.25)";
    c.fill();
    const kid = {
      facing: p.facing,
      walk: p.walk,
      moving: p.moving,
      swing: p.swing,
      muzzle: p.muzzle,
      gun: world.inv.gun,
      melee: world.inv.melee,
      shooting: true,
      dead: world.status === "dead",
    };
    if (world.status === "dead") {
      c.rotate(-p.facing * 1.35);
      c.translate(-p.facing * 20, 0);
    }
    if (p.grace > 0 && Math.floor(this.t * 12) % 2) c.globalAlpha = 0.5;
    drawKid(c, kid);
    if (p.hurt > 0) {
      c.globalAlpha = 0.55;
      setTint("#ff3b3b");
      drawKid(c, kid);
      setTint(null);
    }
    c.restore();
    // the pack eating him is drawn over him
    for (const d of order) if (d.state === "latched") drawD(d);

    this.drawEffects(world, cam);
    if (city) this.drawStreetFront(world, cam);
    else this.tile(c, this.cached("ferns", () => paintFerns(1400, 5)), cam * 1.25, this.H - 120);
    this.drawPopups(world.popups, cam, GROUND_Y - 170);
  }

  drawCityBack(world, cam) {
    const c = this.c,
      W = this.W;
    const g = c.createLinearGradient(0, 0, 0, SIDEWALK_TOP);
    g.addColorStop(0, "#3c4357");
    g.addColorStop(1, "#666d7e");
    c.fillStyle = g;
    c.fillRect(0, 0, W, SIDEWALK_TOP);
    // clouds
    c.fillStyle = "rgba(255,255,255,.07)";
    for (let i = 0; i < 4; i++) {
      const x = ((i * 520 - cam * 0.1) % (W + 400)) - 200;
      ellipse(c, x < -200 ? x + W + 400 : x, 60 + i * 22, 180, 18);
      c.fill();
    }
    this.tile(c, this.cached("sky-far", () => paintSkyline(1700, 300, 11, true)), cam * 0.22, SIDEWALK_TOP - 300 - 20);
    this.tile(c, this.cached("sky-mid", () => paintSkyline(1500, 220, 23, false)), cam * 0.45, SIDEWALK_TOP - 220);
    // the storefronts
    const near = world.nearShopDoor;
    for (const b of world.street.buildings) {
      const x = b.x - cam;
      if (x > W || x + b.w < 0) continue;
      const img = this.cached(`b:${b.type}:${b.variant}:${b.w}`, () => paintBuilding(b));
      c.drawImage(img, x, SIDEWALK_TOP - BUILD_H + 2);
      if (b.door) this.drawDoor(world, b, x, near === b);
    }
    // street props between buildings: streetlights and hydrants
    for (let i = Math.floor(cam / 640) - 1; i < (cam + W) / 640 + 1; i++) {
      const x = i * 640 + 300 - cam;
      this.drawStreetlight(x);
      if (i % 3 === 0) this.drawHydrant(x + 170);
    }
    // sidewalk
    c.fillStyle = "#958d79";
    c.fillRect(0, SIDEWALK_TOP, W, CURB_Y - SIDEWALK_TOP);
    c.fillStyle = "#857d69";
    c.fillRect(0, SIDEWALK_TOP, W, 6);
    c.strokeStyle = "rgba(0,0,0,.18)";
    c.lineWidth = 2;
    for (let x = -((cam * 1) % 120); x < W; x += 120) {
      c.beginPath();
      c.moveTo(x, SIDEWALK_TOP + 6);
      c.lineTo(x - 14, CURB_Y);
      c.stroke();
    }
  }

  drawStreetFront(world, cam) {
    const c = this.c,
      W = this.W,
      H = this.H;
    // curb with storm drains
    c.fillStyle = "#6d6a63";
    c.fillRect(0, CURB_Y, W, 14);
    c.fillStyle = INK;
    c.fillRect(0, CURB_Y, W, 3);
    c.fillRect(0, CURB_Y + 14, W, 3);
    for (let x = -((cam % 420) + 420) + 160; x < W + 100; x += 420) {
      poly(c, [[x, CURB_Y + 2], [x + 90, CURB_Y + 2], [x + 90, CURB_Y + 16], [x, CURB_Y + 16]]);
      inked(c, "#2a2626", 2.5);
      c.fillStyle = "#6d6a63";
      for (let k = 1; k < 6; k++) c.fillRect(x + k * 15, CURB_Y + 4, 4, 10);
    }
    // road
    c.fillStyle = "#b3aa95";
    c.fillRect(0, CURB_Y + 17, W, H - CURB_Y - 17);
    c.fillStyle = "#c2b9a4";
    c.fillRect(0, CURB_Y + 17, W, 8);
    c.fillStyle = "#ebe6d6";
    for (let x = -((cam * 1.05) % 260); x < W; x += 260) c.fillRect(x, H - 34, 130, 8);
    // newspapers blowing on the road
    for (let i = Math.floor(cam / 900) - 1; i < (cam + W) / 900 + 1; i++) {
      const x = i * 900 + 520 - cam * 1.05,
        y = H - 52 + (i % 2) * 18;
      c.save();
      c.translate(x, y);
      c.rotate(-0.25 + (i % 3) * 0.1);
      poly(c, [[-26, -10], [24, -14], [28, 10], [-22, 12]]);
      inked(c, "#f3f1ea", 2.5);
      c.strokeStyle = "#8c8c8c";
      c.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(-16, -6 + k * 6);
        c.lineTo(16, -8 + k * 6);
        c.stroke();
      }
      c.restore();
    }
  }

  drawDoor(world, b, x, near) {
    const c = this.c,
      d = b.door,
      dx = d.x - b.x + x;
    const top = SIDEWALK_TOP - 118;
    if (b.type === "house") {
      poly(c, [[dx - 26, top + 14], [dx + 26, top + 14], [dx + 26, SIDEWALK_TOP], [dx - 26, SIDEWALK_TOP]]);
      inked(c, d.looted ? "#1a1c22" : "#c0443e", 3.5);
      if (!d.looted) {
        poly(c, [[dx - 10, top + 40], [dx + 4, top + 40], [dx + 4, top + 70], [dx - 10, top + 70]]);
        inked(c, "#e8e2d2", 2);
      }
    } else {
      const lit = d.shop || !d.looted;
      poly(c, [[dx - 40, top], [dx + 40, top], [dx + 40, SIDEWALK_TOP], [dx - 40, SIDEWALK_TOP]]);
      inked(c, lit ? "#ffd23f" : "#15171c", 3.5);
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(dx, top);
      c.lineTo(dx, SIDEWALK_TOP);
      c.stroke();
      if (lit) {
        c.fillStyle = INK;
        c.fillRect(dx - 12, top + 46, 5, 30);
        c.fillRect(dx + 7, top + 46, 5, 30);
      } else {
        // smashed glass
        c.strokeStyle = "#5a6070";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(dx - 30, top + 10);
        c.lineTo(dx - 12, top + 40);
        c.lineTo(dx - 24, top + 70);
        c.moveTo(dx + 30, top + 20);
        c.lineTo(dx + 14, top + 50);
        c.stroke();
      }
    }
    if (d.shop) {
      if (near) {
        const bob = Math.sin(this.t * 6) * 6;
        c.save();
        c.translate(dx, top - 30 + bob);
        ellipse(c, 0, 0, 20, 20);
        inked(c, "#4fbf5a", 3.5);
        c.fillStyle = "#ffffff";
        c.fillRect(-3, -11, 6, 22);
        c.fillRect(-11, -3, 22, 6);
        c.restore();
      }
    } else if (!d.looted) {
      // the loot floats in the doorway
      const bob = Math.sin(this.t * 3 + b.x) * 4;
      c.save();
      c.translate(dx, top + 54 + bob);
      if (d.loot.kind === "cash") outlinedText(c, `$${d.loot.amount}`, 0, 8, 26, "#ffe23a", { width: 5 });
      else if (d.loot.kind === "med") {
        c.translate(0, 18);
        c.scale(0.8, 0.8);
        drawMedBottle(c);
      } else {
        drawAmmoIcon(c, world.gun.family, -10, 0, 0.8);
        outlinedText(c, "×", 14, 10, 22, "#ffffff", { width: 4 });
      }
      c.restore();
    }
  }

  drawStreetlight(x) {
    const c = this.c,
      base = SIDEWALK_TOP + 14;
    c.save();
    c.translate(x, base);
    c.fillStyle = "rgba(255,240,180,.08)";
    ellipse(c, 34, -290, 70, 50);
    c.fill();
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -280);
    c.quadraticCurveTo(4, -300, 30, -300);
    c.lineWidth = 9;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth = 5;
    c.strokeStyle = "#4a5060";
    c.stroke();
    blob(c, [[22, -304], [44, -304], [42, -292], [24, -292]]);
    inked(c, "#fff8d2", 2.5);
    c.restore();
  }
  drawHydrant(x) {
    const c = this.c;
    c.save();
    c.translate(x, SIDEWALK_TOP + 18);
    blob(c, [[-11, 0], [-11, -30], [-7, -40], [7, -40], [11, -30], [11, 0]]);
    inked(c, "#b8433a", 3);
    poly(c, [[-16, -26], [16, -26], [16, -20], [-16, -20]]);
    inked(c, "#9d3830", 2.5);
    c.restore();
  }

  drawJungleBack(cam) {
    const c = this.c;
    this.tile(c, this.cached("jungle0", () => paintJungle(1600, this.H, 3, 0)), cam * 0.3, 0);
    this.tile(c, this.cached("jungle1", () => paintJungle(1500, this.H, 9, 1)), cam * 0.6, 0);
    // the path
    c.fillStyle = "#3e6d4c";
    c.fillRect(0, SIDEWALK_TOP, this.W, this.H - SIDEWALK_TOP);
    c.fillStyle = "#4b7d58";
    c.fillRect(0, SIDEWALK_TOP + 10, this.W, 60);
    c.strokeStyle = "#2f5a3e";
    c.lineWidth = 3;
    for (let x = -((cam * 1) % 90); x < this.W; x += 90) {
      c.beginPath();
      c.moveTo(x, SIDEWALK_TOP + 6);
      c.lineTo(x + 6, SIDEWALK_TOP - 8);
      c.lineTo(x + 12, SIDEWALK_TOP + 6);
      c.stroke();
    }
  }

  drawEffects(world, cam) {
    const c = this.c;
    for (const tr of world.tracers) {
      const y = GROUND_Y - tr.y - 22;
      c.save();
      if (tr.kind === "laser") {
        c.globalAlpha = Math.min(1, tr.life / 0.12);
        c.strokeStyle = "#39d4ff";
        c.lineWidth = 16;
        c.beginPath();
        c.moveTo(tr.x1 - cam, y);
        c.lineTo(tr.x2 - cam, y);
        c.stroke();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 6;
        c.stroke();
      } else {
        // a short bright streak, not a line to the target
        const dir = Math.sign(tr.x2 - tr.x1) || 1;
        const len = Math.min(Math.abs(tr.x2 - tr.x1), 90);
        const head = tr.x1 + dir * Math.abs(tr.x2 - tr.x1) * (1 - tr.life / 0.07);
        c.strokeStyle = "#fff2a0";
        c.lineWidth = tr.kind === "pellet" ? 2.5 : 3.5;
        c.beginPath();
        c.moveTo(head - cam, y);
        c.lineTo(head - dir * len * 0.6 - cam, y);
        c.stroke();
      }
      c.restore();
    }
    for (const f of world.flames) {
      c.save();
      c.translate(f.x - cam, GROUND_Y - 74);
      c.scale(f.dir, 1);
      for (let i = 0; i < 9; i++) {
        const t = i / 8,
          r = 10 + t * 30;
        const x = t * f.len,
          y = Math.sin(this.t * 30 + i * 2 + f.seed * 9) * 8 * t;
        ellipse(c, x, y, r, r * 0.8);
        c.fillStyle = i % 3 === 0 ? "#ffef7a" : i % 3 === 1 ? "#ff9a1f" : "#ff5a12";
        c.globalAlpha = 0.85 - t * 0.4;
        c.fill();
      }
      c.restore();
    }
    for (const b of world.projectiles) {
      const x = b.x - cam,
        y = GROUND_Y - b.y - 22;
      c.save();
      c.translate(x, y);
      if (b.kind === "saw") drawSawBlade(c, 0, 0, 16, b.rot);
      else if (b.kind === "rocket") {
        c.scale(Math.sign(b.vx), 1);
        poly(c, [[-22, -6], [10, -6], [20, 0], [10, 6], [-22, 6]]);
        inked(c, "#cfd3da", 2.5);
        ellipse(c, -30, 0, 12, 5);
        c.fillStyle = "#ff9a1f";
        c.fill();
      } else {
        ellipse(c, 0, 0, 8, 8);
        inked(c, "#3a4a32", 2.5);
      }
      c.restore();
    }
    for (const e of world.explosions) {
      const t = 1 - e.life / e.max;
      c.save();
      c.translate(e.x - cam, GROUND_Y - 50);
      c.globalAlpha = 1 - t;
      ellipse(c, 0, 0, e.r * (0.4 + t * 0.7), e.r * (0.35 + t * 0.55));
      c.fillStyle = t < 0.35 ? "#ffd23f" : "#ff7a1a";
      c.fill();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ellipse(c, Math.cos(a) * e.r * 0.6 * t, Math.sin(a) * e.r * 0.4 * t - 30 * t, 26 + 20 * t, 22 + 16 * t);
        c.fillStyle = "rgba(60,60,64,.8)";
        c.fill();
      }
      c.restore();
    }
    for (const g of world.gibs) {
      c.save();
      c.translate(g.x - cam, GROUND_Y + g.y);
      drawGib(c, g.kind, g.size, g.rot, g.type, 3);
      if (g.kind !== "eye") {
        c.fillStyle = "#b0141c";
        ellipse(c, -g.vx * 0.02, -g.vy * 0.02, 3, 3);
        c.fill();
      }
      c.restore();
    }
  }

  drawPopups(list, cam, baseY) {
    for (const p of list) {
      const t = 1 - p.life / 1.1;
      this.c.save();
      this.c.globalAlpha = Math.min(1, p.life * 3);
      outlinedText(this.c, p.text, p.x - cam, baseY - p.y - t * 50, 30, p.color, { width: 5 });
      this.c.restore();
    }
  }

  // ------------------------------------------------------------ Ammo-Country
  drawShop(world) {
    const c = this.c,
      W = this.W,
      H = this.H,
      s = world.shop;
    const cam = clamp(s.x - W / 2, 0, Math.max(0, s.width - W));
    this.cam = world.player.x; // so the street camera snaps back when we leave
    // striped wallpaper
    c.fillStyle = "#f6f8f8";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#c6dce8";
    for (let x = -((cam * 1) % 36); x < W; x += 36) c.fillRect(x, 0, 14, 340);
    // the exit door on the left wall
    const ex = SHOP_EXIT_X - cam;
    if (ex > -120) {
      poly(c, [[ex - 50, 150], [ex + 30, 150], [ex + 30, 340], [ex - 50, 340]]);
      inked(c, "#7b5a3a", 4);
      outlinedText(c, "EXIT", ex - 10, 140, 26, "#e64b3c", { width: 4 });
    }
    // the orange slatted gun wall
    const rx0 = SHOP_RACK_X - 30 - cam,
      rx1 = SHOP_RACK_X + s.items.length * SHOP_SLOT + 20 - cam;
    poly(c, [[rx0, 110], [rx1, 110], [rx1, 300], [rx0, 300]]);
    inked(c, "#e48c58", 5);
    c.strokeStyle = "#b9663a";
    c.lineWidth = 3;
    for (let y = 132; y < 300; y += 22) {
      c.beginPath();
      c.moveTo(rx0 + 4, y);
      c.lineTo(rx1 - 4, y);
      c.stroke();
    }
    for (const it of s.items) {
      const x = it.x - cam;
      if (x < -120 || x > W + 120) continue;
      const sel = s.selected === it;
      c.save();
      c.translate(x, 190);
      if (it.kind === "weapon") {
        c.rotate(-0.42);
        if (sel) {
          c.shadowColor = "#fff27a";
          c.shadowBlur = 22;
        }
        if (WEAPON[it.id].family === "melee") {
          c.rotate(1.2);
          drawMelee(c, it.id, 1.25);
        } else drawGun(c, it.id, 1.5);
      } else if (it.kind === "medkit") {
        c.translate(0, 30);
        c.scale(1.3, 1.3);
        drawMedBottle(c);
      }
      c.restore();
      this.drawTags(world, it, x, sel);
    }
    // counter, then the checkered floor
    poly(c, [[-10, 318], [W + 10, 318], [W + 10, 334], [-10, 334]]);
    inked(c, "#d9b07c", 4);
    c.fillStyle = "#c69760";
    c.fillRect(0, 334, W, 64);
    c.strokeStyle = "#8d6338";
    c.lineWidth = 2.5;
    for (let x = -((cam * 1) % 26); x < W; x += 26) {
      c.beginPath();
      c.moveTo(x, 336);
      c.lineTo(x, 396);
      c.stroke();
    }
    c.fillStyle = INK;
    c.fillRect(0, 396, W, 4);
    const tile = 46;
    for (let y = 400, row = 0; y < H; y += tile * 0.55, row++)
      for (let x = -((cam % (tile * 2)) + tile * 2) + (row % 2) * tile; x < W + tile; x += tile * 2) {
        poly(c, [[x, y], [x + tile, y], [x + tile * 1.2, y + tile * 0.55], [x + tile * 0.2, y + tile * 0.55]]);
        c.fillStyle = "#7eaed6";
        c.fill();
      }
    c.fillStyle = "rgba(170,205,232,.55)";
    c.fillRect(0, 400, W, H - 400);
    // the clerk, leaning on the counter at the left, pointing at the guns
    c.save();
    c.translate(190 - cam, 330);
    drawClerk(c, this.t, s.messageLife > 0);
    c.restore();
    if (s.messageLife > 0) {
      const bx = 330 - cam,
        by = 60;
      c.save();
      c.font = `24px ${FONT}`;
      const tw = c.measureText(s.message).width + 40;
      blob(c, [[bx - 10, by], [bx + tw, by - 4], [bx + tw + 6, by + 46], [bx + 30, by + 50], [bx + 4, by + 76], [bx + 10, by + 48], [bx - 14, by + 44]]);
      inked(c, "#ffffff", 3.5);
      outlinedText(c, s.message, bx + tw / 2, by + 32, 24, INK, { stroke: "#ffffff", width: 1 });
      c.restore();
    }
    // the kid, walking along the front of the counter
    const p = world.player;
    c.save();
    c.translate(s.x - cam, SHOP_FLOOR_Y);
    ellipse(c, 0, 4, 30, 7);
    c.fillStyle = "rgba(0,0,0,.2)";
    c.fill();
    drawKid(c, { facing: p.facing, walk: p.walk, moving: p.moving, gun: world.inv.gun, melee: world.inv.melee });
    c.restore();
    // what the buttons do here
    const it = s.selected;
    if (it && it.kind !== "locked") {
      const price = world.priceOf(it);
      const owned = world.profile.owned[it.id];
      let line =
        it.kind === "medkit"
          ? `ORANGE: MED KIT $${MEDKIT.price}`
          : !owned
            ? `ORANGE: BUY ${WEAPON[it.id].name.toUpperCase()} $${price}`
            : price == null
              ? `${WEAPON[it.id].name.toUpperCase()} MAXED`
              : `ORANGE: UPGRADE TO LV ${owned.lv + 1} $${price}`;
      if (owned && WEAPON[it.id].ammoPrice) line += `   BLUE: AMMO +${WEAPON[it.id].ammoPack} $${WEAPON[it.id].ammoPrice}`;
      outlinedText(c, line, W / 2, 392, 22, "#ffffff", { width: 5 });
    }
  }

  drawTags(world, it, x, sel) {
    const c = this.c;
    const tag = (cx, cy, w, h, text, size, color = INK, pin = true) => {
      c.save();
      c.translate(cx, cy);
      c.rotate(((cx * 7) % 5) * 0.006 - 0.012);
      poly(c, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]);
      inked(c, sel ? "#fff27a" : "#f6e7a4", 3);
      if (pin) {
        ellipse(c, -w / 2 + 10, -h / 2 + 7, 4, 4);
        inked(c, "#d8352f", 1.5);
      }
      if (text) outlinedText(c, text, 6, size * 0.36, size, color, { stroke: "#f6e7a4", width: 1 });
      c.restore();
    };
    if (it.kind === "locked") return tag(x, 266, 112, 34, "$", 24);
    const price = world.priceOf(it);
    const o = world.profile.owned[it.id];
    if (it.kind === "medkit") return tag(x, 266, 112, 34, `$ ${MEDKIT.price}`, 26);
    tag(x, 262, 112, 32, o ? (price == null ? "MAX" : `$ ${price}`) : `$ ${price}`, 26, o ? "#2f6b2a" : INK);
    const w = WEAPON[it.id];
    if (o) tag(x - 30, 292, 52, 22, `LV ${o.lv}`, 17, INK, false);
    if (w.ammoPrice) tag(x + 30, 292, 56, 22, `•$${w.ammoPrice}`, 17, INK, false);
  }

  // ------------------------------------------------------------ HUD
  drawHud(world) {
    const c = this.c,
      W = this.W,
      p = world.player;
    const g = world.gun;
    // weapon badge
    c.save();
    c.translate(14, 10);
    blob(c, [[6, 0], [92, 0], [102, 40], [92, 80], [6, 80], [-2, 40]]);
    inked(c, "#1d1b22", 3);
    blob(c, [[16, 12], [80, 12], [86, 40], [80, 68], [16, 68], [10, 40]]);
    inked(c, "#8fc6ef", 3);
    drawAmmoIcon(c, g.family, 48, 40, 1.25);
    c.restore();
    // orange health bar in a black frame
    const bx = 112,
      by = 16,
      bw = Math.min(260, W * 0.26);
    poly(c, [[bx, by], [bx + bw, by], [bx + bw - 6, by + 30], [bx - 4, by + 30]]);
    inked(c, "#1d1b22", 3);
    const f = clamp(p.hp / p.maxHp, 0, 1);
    poly(c, [[bx + 5, by + 5], [bx + 5 + (bw - 14) * f, by + 5], [bx + 3 + (bw - 14) * f, by + 25], [bx + 3, by + 25]]);
    c.fillStyle = "#ff6a1f";
    c.fill();
    c.fillStyle = "rgba(0,0,0,.18)";
    c.fillRect(bx + 4, by + 18, (bw - 14) * f, 7);
    // white skewed ammo box
    poly(c, [[bx - 2, by + 38], [bx + 112, by + 38], [bx + 100, by + 66], [bx - 10, by + 66]]);
    inked(c, "#ffffff", 3);
    const ammo = world.ammo();
    outlinedText(c, `×${ammo > 99999 ? "∞" : ammo}`, bx + 10, by + 61, 28, INK, { align: "left", stroke: "#ffffff", width: 1, italic: true });
    // centre: cash in the city, kills and time in the jungle
    if (world.mode === "city" || world.scene === "shop") {
      outlinedText(c, `$${world.profile.cash}`, W / 2, 60, 54, "#ffe23a", { width: 8 });
    } else {
      c.save();
      c.translate(W / 2 - 74, 38);
      c.scale(0.32, 0.32);
      c.translate(-40, 110);
      drawGib(c, "head", 2.2, 0, "raptor");
      c.restore();
      c.save();
      c.strokeStyle = "#e3242b";
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(W / 2 - 92, 20);
      c.lineTo(W / 2 - 58, 52);
      c.moveTo(W / 2 - 58, 20);
      c.lineTo(W / 2 - 92, 52);
      c.stroke();
      c.restore();
      outlinedText(c, String(world.kills), W / 2 - 46, 58, 50, "#ffe23a", { align: "left", width: 8 });
      const t = Math.floor(world.t);
      outlinedText(c, `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, W / 2 + 120, 50, 26, "#ffe23a", { align: "left", italic: true, width: 5 });
    }
    // pause glyph (the button over it is in the DOM)
    for (const x of [W - 52, W - 34]) {
      poly(c, [[x, 18], [x + 11, 18], [x + 11, 54], [x, 54]]);
      inked(c, "#f4f2ec", 3);
    }
  }

  drawOverlay(world) {
    const c = this.c,
      W = this.W,
      H = this.H;
    if (world.status === "card") {
      c.fillStyle = "rgba(0,0,0,.55)";
      c.fillRect(0, 0, W, H);
      outlinedText(c, `LEVEL ${world.level}`, W / 2, H / 2 + 20, 84, "#ffffff", { italic: true, width: 10 });
    } else if (world.status === "clear") {
      c.fillStyle = "rgba(0,0,0,.25)";
      c.fillRect(0, 0, W, H);
      outlinedText(c, "LEVEL CLEAR!", W / 2, H / 2 + 20, 92, "#ffe23a", { italic: true, width: 11 });
    }
  }
}
