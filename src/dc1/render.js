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
  fillPlain,
  setShade,
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
  drawSpray,
  drawDrop,
  drawSplat,
  drawSmear,
  drawWallSplat,
  drawDinoHead,
} from "./art.js";

// the video's camera is close: characters are about a third of the screen tall
export const CHAR = 1.3;
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
  c.fillStyle = far ? "#8996a6" : "#6f7d8e";
  let x = -20;
  while (x < w) {
    const bw = 60 + r() * (far ? 140 : 110),
      bh = (far ? 80 : 60) + r() * (far ? 170 : 130);
    c.fillRect(x, h - bh, bw, bh);
    if (!far && r() < 0.6)
      for (let i = 0; i < 6; i++)
        if (r() < 0.35) {
          c.fillStyle = "#5e6a79";
          c.fillRect(x + 8 + r() * (bw - 20), h - bh + 10 + r() * (bh - 30), 6, 8);
          c.fillStyle = "#6f7d8e";
        }
    if (far && r() < 0.25) {
      // a construction crane
      const cx = x + bw / 2,
        top = h - bh - 90;
      c.strokeStyle = "#8996a6";
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

// cross-hatching inside a rectangle: the cheapest way to get the inked-shadow look
function hatch(c, x, y, w, h, gap = 7, alpha = 0.32, dir = 1) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = `rgba(18,14,22,${alpha})`;
  c.lineWidth = 1.4;
  for (let i = -h; i < w + h; i += gap) {
    c.beginPath();
    c.moveTo(x + i, y + h);
    c.lineTo(x + i + dir * h, y);
    c.stroke();
  }
  c.restore();
}
function grime(c, w, h, r, floorY = h) {
  // water stains and soot running down from ledges
  for (let i = 0; i < 7; i++) {
    const x = r() * w,
      y = r() * floorY * 0.8,
      rw = 20 + r() * 60,
      rh = 30 + r() * 90;
    const g = c.createLinearGradient(x, y, x, y + rh);
    g.addColorStop(0, "rgba(20,18,16,0.28)");
    g.addColorStop(1, "rgba(20,18,16,0)");
    c.fillStyle = g;
    c.fillRect(x - rw / 2, y, rw, rh);
  }
  // cracks
  c.strokeStyle = "rgba(15,12,14,0.65)";
  c.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    let x = r() * w,
      y = r() * floorY;
    c.beginPath();
    c.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += (r() - 0.5) * 22;
      y += 6 + r() * 14;
      c.lineTo(x, y);
    }
    c.stroke();
  }
  // grime along the base
  const g = c.createLinearGradient(0, h - 40, 0, h);
  g.addColorStop(0, "rgba(25,20,18,0)");
  g.addColorStop(1, "rgba(25,20,18,0.45)");
  c.fillStyle = g;
  c.fillRect(0, h - 40, w, 40);
}

const SIGNS = {
  deli: { panel: "#3a63b5", border: "#24418a", text: "#ffd23f", stroke: INK, tilt: -0.05, size: 54 },
  checks: { panel: "#fff4c7", border: "#d6a419", text: "#f2c62b", stroke: "#5b3a12", tilt: 0, size: 40 },
  ammo: { panel: "#ffffff", border: "#e2512b", text: "#4d86d6", stroke: "#173a7a", tilt: 0, size: 44 },
  laundro: { panel: "#ffffff", border: "#2e8b3a", text: "#e9f6e0", stroke: "#1f6b2a", tilt: 0, size: 38 },
  jumbo: { panel: "#ffffff", border: "#7a3cc8", text: "#8b4fe0", stroke: "#3a1470", tilt: 0, size: 44 },
};
const WALLS = { deli: "#6c8783", checks: "#667e7a", ammo: "#6a827e", laundro: "#718682", jumbo: "#637a77", motel: "#77726d", house: "#6b8876", lot: null };
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
    hatch(c, 44, h - 212, 26, 212, 6, 0.3);
    hatch(c, w - 80, h - 212, 36, 212, 6, 0.38);
    hatch(c, 44, h - 212, w - 88, 18, 6, 0.4);
    grime(c, w, h, r);
    // bush
    blob(c, [[50, h], [40, h - 40], [80, h - 60], [120, h - 40], [118, h]]);
    inked(c, "#3f5f42", 3);
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
  hatch(c, 6, top, 30, h - top, 6, 0.34);
  hatch(c, w - 50, top, 44, h - top, 6, 0.42);
  // ground-floor storefront band
  poly(c, [[6, h - 150], [w - 6, h - 150], [w - 6, h], [6, h]]);
  inked(c, "#566b6a", 4);
  hatch(c, 6, h - 150, w - 12, 16, 5, 0.32);
  // two lit side windows with blinds, as in the footage
  for (const x of [40, w - 120]) {
    poly(c, [[x, h - 112], [x + 80, h - 112], [x + 80, h - 34], [x, h - 34]]);
    inked(c, "#ffd23f", 3.5);
    c.fillStyle = INK;
    c.fillRect(x + 22, h - 100, 9, 54);
    c.fillRect(x + 50, h - 100, 9, 54);
  }
  grime(c, w, h, r, h - 150);
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
    fillPlain(c);
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

// ------------------------------------------------------------ the other maps
const MAP_SKY = {
  jungle: null,
  wasteland: ["#e3874a", "#f1b46d", "#f7d69a"],
  cherry: ["#e9c3d6", "#f6dbe4", "#fcefe8"],
  cavern: ["#120f19", "#1d1826", "#2a2434"],
};
function paintMapLayer(map, layer, w, h) {
  const cv = offscreen(w, h),
    c = cv.getContext("2d"),
    r = rng(map.length * 977 + layer * 31);
  if (map === "wasteland") {
    if (layer === 0) {
      // mesas on the horizon
      c.fillStyle = "#c9794a";
      let x = -40;
      while (x < w) {
        const mw = 160 + r() * 260,
          mh = 60 + r() * 120;
        poly(c, [[x, h], [x + 30, h - mh], [x + mw - 40, h - mh - r() * 10], [x + mw, h]]);
        fillPlain(c);
        x += mw + r() * 120;
      }
    } else {
      // a broken highway and the bones of buildings
      c.fillStyle = "#94603f";
      for (let x = 60; x < w; x += 420 + r() * 200) {
        c.fillRect(x, h - 150, 26, 150);
        c.fillRect(x + 180, h - 150, 26, 150);
        poly(c, [[x - 40, h - 160], [x + 260 - r() * 60, h - 168], [x + 240, h - 150], [x - 40, h - 146]]);
        fillPlain(c);
      }
      for (let i = 0; i < 4; i++) {
        const x = r() * w,
          bh = 90 + r() * 90;
        poly(c, [[x, h], [x, h - bh], [x + 30, h - bh - 20], [x + 50, h - bh + 10], [x + 90, h - bh], [x + 90, h]]);
        c.fillStyle = "#7d4f35";
        fillPlain(c);
      }
      // dead trees
      c.strokeStyle = "#5b3b28";
      c.lineCap = "round";
      for (let i = 0; i < 5; i++) {
        const x = r() * w;
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(x, h);
        c.lineTo(x + 6, h - 90);
        c.lineTo(x - 24, h - 130);
        c.moveTo(x + 4, h - 70);
        c.lineTo(x + 34, h - 112);
        c.stroke();
      }
    }
  } else if (map === "cherry") {
    if (layer === 0) {
      c.fillStyle = "#d6bccf";
      c.beginPath();
      c.moveTo(0, h);
      for (let x = 0; x <= w; x += 40) c.lineTo(x, h - 60 - Math.abs(Math.sin(x * 0.004 + 1)) * 150 - r() * 12);
      c.lineTo(w, h);
      c.fill();
      // a pagoda on the ridge
      const px = w * 0.6;
      c.fillStyle = "#b99db4";
      for (let i = 0; i < 4; i++) {
        poly(c, [[px - 60 + i * 10, h - 120 - i * 34], [px + 60 - i * 10, h - 120 - i * 34], [px + 40 - i * 10, h - 136 - i * 34], [px - 40 + i * 10, h - 136 - i * 34]]);
        fillPlain(c);
        c.fillRect(px - 26 + i * 6, h - 120 - i * 34, 52 - i * 12, 34);
      }
    } else {
      // village houses with curved roofs, and blossom trees between them
      for (let x = 0; x < w; x += 360) {
        const hx = x + 40;
        poly(c, [[hx, h - 130], [hx + 220, h - 130], [hx + 220, h], [hx, h]]);
        inked(c, "#9a6a45", 3.5);
        c.strokeStyle = "#5a3a26";
        c.lineWidth = 3;
        for (let k = 1; k < 4; k++) {
          c.beginPath();
          c.moveTo(hx + k * 55, h - 130);
          c.lineTo(hx + k * 55, h);
          c.stroke();
        }
        poly(c, [[hx + 60, h - 100], [hx + 160, h - 100], [hx + 160, h - 40], [hx + 60, h - 40]]);
        inked(c, "#f2e2b8", 3);
        blob(c, [[hx - 34, h - 122], [hx + 30, h - 168], [hx + 190, h - 168], [hx + 254, h - 122], [hx + 110, h - 138]]);
        inked(c, "#3a4458", 4);
        // a red lantern
        ellipse(c, hx + 30, h - 104, 10, 13);
        inked(c, "#d8362f", 2.5);
        // blossom tree
        const tx = x + 310;
        c.strokeStyle = INK;
        c.lineWidth = 12;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(tx, h);
        c.quadraticCurveTo(tx - 10, h - 90, tx + 20, h - 170);
        c.stroke();
        c.strokeStyle = "#5a3a2e";
        c.lineWidth = 7;
        c.stroke();
        for (let k = 0; k < 7; k++) {
          const bx = tx + 20 + (r() - 0.5) * 150,
            by = h - 190 + (r() - 0.5) * 80,
            br = 30 + r() * 26;
          ellipse(c, bx, by, br, br * 0.8);
          inked(c, k % 2 ? "#f4a6c2" : "#f8c6d8", 3);
        }
      }
    }
  } else if (map === "cavern") {
    if (layer === 0) {
      // the far wall, stalactites and glowing crystals
      c.fillStyle = "#26202f";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#1a1621";
      for (let x = 0; x < w; x += 40 + r() * 60) {
        const L = 40 + r() * 140;
        poly(c, [[x, 0], [x + 26 + r() * 20, 0], [x + 14, L]]);
        fillPlain(c);
      }
      for (let i = 0; i < 10; i++) {
        const x = r() * w,
          y = h * (0.35 + r() * 0.5),
          col = r() < 0.5 ? "120,230,255" : "200,130,255";
        const g = c.createRadialGradient(x, y, 2, x, y, 70);
        g.addColorStop(0, `rgba(${col},0.45)`);
        g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g;
        c.fillRect(x - 70, y - 70, 140, 140);
        for (let k = 0; k < 3; k++) {
          poly(c, [[x - 8 + k * 9, y + 10], [x - 4 + k * 9, y - 22 - r() * 16], [x + 2 + k * 9, y + 10]]);
          inked(c, `rgb(${col})`, 2);
        }
      }
    } else {
      // stalagmite pillars
      for (let x = 30; x < w; x += 260 + r() * 180) {
        const ph = 160 + r() * 140;
        blob(c, [[x - 40, h], [x - 22, h - ph * 0.6], [x - 6, h - ph], [x + 10, h - ph * 0.7], [x + 34, h]]);
        inked(c, "#3a3245", 3.5);
      }
    }
  }
  return cv;
}
function paintMapFront(map, w) {
  const cv = offscreen(w, 160),
    c = cv.getContext("2d"),
    r = rng(map.length * 131 + 7);
  const H = 160;
  for (let i = 0; i < 12; i++) {
    const x = r() * w;
    if (map === "wasteland") {
      if (i % 4 === 0) {
        // a cactus
        blob(c, [[x - 10, H], [x - 10, H - 90], [x, H - 100], [x + 10, H - 90], [x + 10, H]]);
        inked(c, "#5f8a4a", 3);
        blob(c, [[x + 8, H - 50], [x + 26, H - 54], [x + 28, H - 80], [x + 20, H - 80], [x + 18, H - 62], [x + 8, H - 60]]);
        inked(c, "#5f8a4a", 2.5);
      } else if (i % 4 === 1) {
        // a rusted car shell
        blob(c, [[x - 70, H - 10], [x - 66, H - 40], [x - 30, H - 46], [x - 10, H - 70], [x + 40, H - 70], [x + 60, H - 44], [x + 76, H - 38], [x + 76, H - 10]]);
        inked(c, "#9c5634", 3.5);
        for (const wx of [x - 40, x + 44]) {
          ellipse(c, wx, H - 10, 16, 16);
          inked(c, "#2b2420", 3);
        }
      } else {
        blob(c, [[x - 30, H], [x - 22, H - 26], [x + 6, H - 34], [x + 30, H - 14], [x + 34, H]]);
        inked(c, "#a87650", 3);
      }
    } else if (map === "cherry") {
      blob(c, [[x - 50, H], [x - 40, H - 46], [x - 6, H - 70], [x + 34, H - 50], [x + 54, H]]);
      inked(c, i % 3 ? "#5f8c58" : "#f0a3c0", 3);
    } else {
      // cavern: rocks and crystal clusters
      blob(c, [[x - 46, H], [x - 30, H - 40], [x + 8, H - 52], [x + 40, H - 24], [x + 50, H]]);
      inked(c, "#2e2838", 3.5);
      if (i % 3 === 0)
        for (let k = 0; k < 3; k++) {
          poly(c, [[x - 10 + k * 10, H - 30], [x - 5 + k * 10, H - 70 - k * 8], [x + 2 + k * 10, H - 30]]);
          inked(c, k % 2 ? "#7ee6ff" : "#c98bff", 2);
        }
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
    this.drawPost(world);
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
    else if (world.map === "jungle") this.drawJungleBack(cam);
    else this.drawMapBack(world.map, cam);

    // ground decals: blood pools, chunks, eyes, heads. They stay all level.
    for (const d of world.decals) {
      const x = d.x - cam;
      if (x < -120 || x > W + 120) continue;
      c.save();
      if (d.kind === "wall") {
        c.translate(x, SIDEWALK_TOP - d.h);
        c.rotate(d.rot * 0.2);
        drawWallSplat(c, d.size, d.seed);
      } else {
        c.translate(x, GROUND_Y + 6);
        if (d.kind === "pool") drawPool(c, d.size, d.seed);
        else if (d.kind === "splat") drawSplat(c, d.size, d.seed);
        else if (d.kind === "smear") drawSmear(c, d.size, d.rot, d.seed);
        else {
          c.scale(CHAR, CHAR);
          // a head that landed lies on its side
          drawGib(c, d.kind, d.size * 0.9, d.kind === "eye" ? 0 : d.kind === "head" ? (d.rot > 0 ? 1.4 : -1.4) : d.rot, d.type, d.seed);
        }
      }
      c.restore();
    }
    for (const k of world.corpses) {
      const x = k.x - cam;
      if (x < -260 || x > W + 260) continue;
      c.save();
      c.globalAlpha = Math.min(1, k.life / 0.6);
      c.translate(x, GROUND_Y + 4);
      c.scale(CHAR, CHAR);
      const age = k.max - k.life;
      const slump = Math.min(1, Math.max(0, (age - 0.45) / 0.3));
      drawCorpse(c, k.type, k.dir, k.burnt, slump * slump, this.t);
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
      c.scale(CHAR, CHAR);
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
    // every dino, the ones biting included, sits behind the kid: their jaws close
    // around him and he stays readable, as in the footage
    for (const d of order) drawD(d);
    // the kid
    c.save();
    c.translate(p.x - cam, GROUND_Y);
    c.scale(CHAR, CHAR);
    ellipse(c, 0, 4, 30, 7);
    c.fillStyle = "rgba(0,0,0,.25)";
    fillPlain(c);
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
      t: this.t,
      recoil: p.recoil,
      blood: p.blood,
      hurt: p.hurt,
      aim: p.aim,
      look: world.profile.look,
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

    this.drawEffects(world, cam);
    if (city) this.drawStreetFront(world, cam);
    else if (world.map === "jungle") this.tile(c, this.cached("ferns", () => paintFerns(1400, 5)), cam * 1.25, this.H - 120);
    else this.drawMapFront(world.map, cam);
    this.drawPopups(world.popups, cam, GROUND_Y - 170);
  }

  drawCityBack(world, cam) {
    const c = this.c,
      W = this.W;
    const g = c.createLinearGradient(0, 0, 0, SIDEWALK_TOP);
    g.addColorStop(0, "#8e9bab");
    g.addColorStop(0.75, "#b1bac3");
    g.addColorStop(1, "#c2c6c4");
    c.fillStyle = g;
    c.fillRect(0, 0, W, SIDEWALK_TOP);
    // clouds
    c.fillStyle = "rgba(255,255,255,.07)";
    for (let i = 0; i < 4; i++) {
      const x = ((i * 520 - cam * 0.1) % (W + 400)) - 200;
      ellipse(c, x < -200 ? x + W + 400 : x, 60 + i * 22, 180, 18);
      fillPlain(c);
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
    c.fillStyle = "#aca592";
    c.fillRect(0, SIDEWALK_TOP, W, CURB_Y - SIDEWALK_TOP);
    c.fillStyle = "#968f7c";
    c.fillRect(0, SIDEWALK_TOP, W, 6);
    c.strokeStyle = "rgba(0,0,0,.22)";
    c.lineWidth = 2;
    for (let x = -((cam * 1) % 120); x < W; x += 120) {
      c.beginPath();
      c.moveTo(x, SIDEWALK_TOP + 6);
      c.lineTo(x - 14, CURB_Y);
      c.stroke();
    }
    // stains and cracks on the pavement, fixed to the world
    for (let i = Math.floor(cam / 160) - 1; i < (cam + W) / 160 + 1; i++) {
      const r = rng(i * 7919 + 13),
        x = i * 160 + r() * 120 - cam;
      if (r() < 0.6) {
        c.fillStyle = "rgba(40,34,28,0.18)";
        c.beginPath();
        c.ellipse(x, SIDEWALK_TOP + 18 + r() * 30, 20 + r() * 40, 4 + r() * 6, 0, 0, Math.PI * 2);
        c.fill();
      }
      if (r() < 0.4) {
        c.strokeStyle = "rgba(20,16,14,0.5)";
        c.lineWidth = 1.5;
        c.beginPath();
        let cx = x,
          cy = SIDEWALK_TOP + 10;
        c.moveTo(cx, cy);
        for (let k = 0; k < 4; k++) {
          cx += (r() - 0.3) * 20;
          cy += 6 + r() * 8;
          c.lineTo(cx, cy);
        }
        c.stroke();
      }
    }
    hatch(c, 0, SIDEWALK_TOP, W, 8, 5, 0.3);
  }

  drawStreetFront(world, cam) {
    const c = this.c,
      W = this.W,
      H = this.H;
    // curb with storm drains
    c.fillStyle = "#8b877d";
    c.fillRect(0, CURB_Y, W, 14);
    c.fillStyle = INK;
    c.fillRect(0, CURB_Y, W, 3);
    c.fillRect(0, CURB_Y + 14, W, 3);
    for (let x = -((cam % 420) + 420) + 160; x < W + 100; x += 420) {
      poly(c, [[x, CURB_Y + 2], [x + 90, CURB_Y + 2], [x + 90, CURB_Y + 16], [x, CURB_Y + 16]]);
      inked(c, "#2a2626", 2.5);
      c.fillStyle = "#8b877d";
      for (let k = 1; k < 6; k++) c.fillRect(x + k * 15, CURB_Y + 4, 4, 10);
    }
    // road
    c.fillStyle = "#c5bda7";
    c.fillRect(0, CURB_Y + 17, W, H - CURB_Y - 17);
    c.fillStyle = "#d0c9b4";
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
        const n = Math.max(8, Math.round((world.gun.ammoPack || 30) * 0.4));
        drawAmmoIcon(c, world.gun.family, -16, 0, 0.8);
        outlinedText(c, `×${n}`, 4, 10, 24, "#ffffff", { width: 4, align: "left" });
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
    fillPlain(c);
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

  drawMapBack(map, cam) {
    const c = this.c,
      W = this.W,
      H = this.H;
    const [a, b, d] = MAP_SKY[map];
    const g = c.createLinearGradient(0, 0, 0, SIDEWALK_TOP);
    g.addColorStop(0, a);
    g.addColorStop(0.6, b);
    g.addColorStop(1, d);
    c.fillStyle = g;
    c.fillRect(0, 0, W, SIDEWALK_TOP);
    if (map === "wasteland") {
      // a big low sun with a haze around it
      const sx = W * 0.7 - cam * 0.05;
      const sg = c.createRadialGradient(sx, 150, 20, sx, 150, 200);
      sg.addColorStop(0, "rgba(255,244,200,0.9)");
      sg.addColorStop(0.25, "rgba(255,226,160,0.5)");
      sg.addColorStop(1, "rgba(255,200,120,0)");
      c.fillStyle = sg;
      c.fillRect(sx - 200, -50, 400, 400);
      ellipse(c, sx, 150, 46, 46);
      c.fillStyle = "#fff3cf";
      fillPlain(c);
    }
    this.tile(c, this.cached(`map0:${map}`, () => paintMapLayer(map, 0, 1600, map === "cavern" ? SIDEWALK_TOP : 300)), cam * 0.25, map === "cavern" ? 0 : SIDEWALK_TOP - 300);
    this.tile(c, this.cached(`map1:${map}`, () => paintMapLayer(map, 1, 1500, 260)), cam * 0.55, SIDEWALK_TOP - 258);
    // the ground
    const ground = { wasteland: ["#c99a68", "#b5835a", "#9c7046"], cherry: ["#bfb19b", "#8fb07a", "#9d8f7a"], cavern: ["#4a4252", "#5d5468", "#3a3341"] }[map];
    c.fillStyle = ground[0];
    c.fillRect(0, SIDEWALK_TOP, W, H - SIDEWALK_TOP);
    c.fillStyle = ground[1];
    c.fillRect(0, SIDEWALK_TOP, W, 10);
    c.fillStyle = INK;
    c.fillRect(0, SIDEWALK_TOP + 10, W, 2.5);
    c.strokeStyle = ground[2];
    c.lineWidth = 2;
    for (let i = Math.floor(cam / 110) - 1; i < (cam + W) / 110 + 1; i++) {
      const rr = rng(i * 4517 + map.length),
        x = i * 110 - cam;
      c.beginPath();
      if (map === "cherry") {
        // flagstones
        c.moveTo(x, SIDEWALK_TOP + 12);
        c.lineTo(x - 18, H);
      } else {
        // cracks
        let cx = x + rr() * 60,
          cy = SIDEWALK_TOP + 14 + rr() * 30;
        c.moveTo(cx, cy);
        for (let k = 0; k < 4; k++) c.lineTo((cx += (rr() - 0.5) * 40), (cy += 8 + rr() * 10));
      }
      c.stroke();
      if (map === "cavern" && rr() < 0.3) {
        ellipse(c, x + 50, SIDEWALK_TOP + 60 + rr() * 30, 40, 6);
        c.fillStyle = "rgba(126,230,255,0.18)";
        fillPlain(c);
      }
    }
  }

  drawMapFront(map, cam) {
    const c = this.c;
    this.tile(c, this.cached(`mapF:${map}`, () => paintMapFront(map, 1500)), cam * 1.25, this.H - 150);
    // moving air: petals, dust or drips
    const n = map === "cherry" ? 26 : map === "wasteland" ? 14 : 12;
    for (let i = 0; i < n; i++) {
      const rr = rng(i * 7 + 3);
      const speed = 30 + rr() * 50;
      const x = (((rr() * 2000 - cam * 0.9 + this.t * (map === "cavern" ? 0 : map === "cherry" ? -40 : 90)) % (this.W + 80)) + this.W + 80) % (this.W + 80) - 40;
      const y = map === "cavern" ? ((rr() * 600 + this.t * 260) % 560) : ((rr() * 600 + this.t * speed) % (this.H + 40)) - 20;
      c.save();
      c.translate(x, y);
      if (map === "cherry") {
        c.rotate(this.t * 2 + i);
        ellipse(c, 0, 0, 5, 3);
        c.fillStyle = "#f7b7cf";
        fillPlain(c);
      } else if (map === "wasteland") {
        ellipse(c, 0, 0, 2.5, 1.5);
        c.fillStyle = "rgba(240,210,160,0.7)";
        fillPlain(c);
      } else {
        ellipse(c, 0, 0, 1.8, 4);
        c.fillStyle = "rgba(160,220,255,0.7)";
        fillPlain(c);
      }
      c.restore();
    }
  }

  // small previews for the menus
  drawMapPreview(map) {
    const c = this.c;
    c.setTransform(this.k * this.dpr, 0, 0, this.k * this.dpr, 0, 0);
    if (map === "jungle") {
      this.drawJungleBack(0);
      this.tile(c, this.cached("ferns", () => paintFerns(1400, 5)), 0, this.H - 120);
    } else {
      this.drawMapBack(map, 0);
      this.drawMapFront(map, 0);
    }
  }
  drawCharacterPreview(look, t) {
    const c = this.c,
      W = this.W,
      H = this.H;
    this.t = t;
    c.setTransform(this.k * this.dpr, 0, 0, this.k * this.dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#8e9bab");
    g.addColorStop(1, "#c2c6c4");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#aca592";
    c.fillRect(0, H * 0.82, W, H * 0.18);
    c.fillStyle = INK;
    c.fillRect(0, H * 0.82, W, 3);
    c.save();
    c.translate(W / 2 - 20, H * 0.84);
    c.scale(2.6, 2.6);
    ellipse(c, 0, 4, 30, 7);
    c.fillStyle = "rgba(0,0,0,.2)";
    fillPlain(c);
    drawKid(c, { look, t, facing: 1, gun: "usp", melee: "club", aim: Math.sin(t * 0.7) > 0.6 ? 0.5 : 0 });
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
        fillPlain(c);
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
        fillPlain(c);
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
      fillPlain(c);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ellipse(c, Math.cos(a) * e.r * 0.6 * t, Math.sin(a) * e.r * 0.4 * t - 30 * t, 26 + 20 * t, 22 + 16 * t);
        c.fillStyle = "rgba(60,60,64,.8)";
        fillPlain(c);
      }
      c.restore();
    }
    for (const sp of world.sprays) {
      c.save();
      c.translate(sp.x - cam, GROUND_Y - sp.h);
      drawSpray(c, sp);
      c.restore();
    }
    for (const g of world.gibs) {
      c.save();
      c.translate(g.x - cam, GROUND_Y + g.y);
      if (g.kind === "drop") {
        drawDrop(c, g);
        c.restore();
        continue;
      }
      c.scale(CHAR, CHAR);
      drawGib(c, g.kind, g.size, g.rot, g.type, 3);
      if (g.kind !== "eye") {
        c.fillStyle = "#b0141c";
        ellipse(c, -g.vx * 0.02, -g.vy * 0.02, 3, 3);
        fillPlain(c);
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
        fillPlain(c);
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
    c.scale(1.15, 1.15);
    ellipse(c, 0, 4, 30, 7);
    c.fillStyle = "rgba(0,0,0,.2)";
    fillPlain(c);
    drawKid(c, { facing: p.facing, walk: p.walk, moving: p.moving, gun: world.inv.gun, melee: world.inv.melee, t: this.t, blood: p.blood, look: world.profile.look });
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

  // ------------------------------------------------------------ the 2000s comic finish
  drawPost(world) {
    const c = this.c,
      W = this.W,
      H = this.H;
    // a warm, dirty grade
    c.save();
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "rgba(240,224,196,0.3)";
    c.fillRect(0, 0, W, H);
    c.restore();
    // vignette
    const vig = this.cached(`vig:${Math.round(W)}`, () => {
      const cv = offscreen(W, H),
        x = cv.getContext("2d");
      const g = x.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.5, W * 0.72);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(10,6,4,0.32)");
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      return cv;
    });
    c.drawImage(vig, 0, 0);
    // film grain, re-rolled every frame
    const grain = this.cached("grain", () => {
      const cv = offscreen(200, 200),
        x = cv.getContext("2d"),
        img = x.createImageData(200, 200);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random();
        const on = v < 0.12 || v > 0.9;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v > 0.5 ? 255 : 0;
        img.data[i + 3] = on ? 90 : 0;
      }
      x.putImageData(img, 0, 0);
      return cv;
    });
    c.save();
    c.globalAlpha = 0.09;
    const ox = Math.floor(Math.random() * 200),
      oy = Math.floor(Math.random() * 200);
    for (let x = -ox; x < W; x += 200) for (let y = -oy; y < H; y += 200) c.drawImage(grain, x, y);
    c.restore();
    // blood at the edges of the screen when you are close to dying
    const p = world.player,
      f = p.hp / p.maxHp;
    if (world.status !== "card" && (f < 0.35 || p.hurt > 0)) {
      const pulse = f < 0.35 ? 0.35 + 0.25 * Math.sin(this.t * 6) + (0.35 - f) : 0.25;
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.65);
      g.addColorStop(0, "rgba(150,0,10,0)");
      g.addColorStop(1, `rgba(150,0,10,${Math.min(0.75, pulse)})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
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
    fillPlain(c);
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
      // a dino head with a red X through it
      c.save();
      c.translate(W / 2 - 76, 38);
      c.save();
      c.scale(0.4, 0.4);
      c.translate(-30, 18);
      drawDinoHead(c, "raptor", 0.5);
      c.restore();
      c.strokeStyle = INK;
      c.lineWidth = 11;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-20, -18);
      c.lineTo(20, 18);
      c.moveTo(20, -18);
      c.lineTo(-20, 18);
      c.stroke();
      c.strokeStyle = "#e3242b";
      c.lineWidth = 6;
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
