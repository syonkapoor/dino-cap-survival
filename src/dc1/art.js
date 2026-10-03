// Hand-inked look, drawn in code: thick black outlines, flat fills, slightly
// irregular curves. Every function draws with its origin at the feet (or the
// object's base) so the renderer only translates. Original art: nothing here
// is traced from or copies another game's sprites.
import { WEAPON, SKINS, OUTFITS, SHOES, BOWS, baseLook } from "./data.js";

export const INK = "#141218";
export const FONT = '"Bangers", "Impact", "Arial Black", sans-serif';

// Smooth closed (or open) path through points using midpoint quadratics: the
// cheap way to get a hand-drawn, slightly lumpy outline.
// The last shape built, so inked() can shade it and add a rough second line.
let LAST = null;
const hash = (x, y) => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function trace(c, pts, closed, jitter = 0) {
  const P = jitter ? pts.map(([x, y]) => [x + (hash(x, y) - 0.5) * jitter, y + (hash(y, x) - 0.5) * jitter]) : pts;
  const n = P.length;
  c.beginPath();
  if (!closed) {
    c.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const [x, y] = P[i],
        [nx, ny] = P[i + 1];
      c.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
    }
    c.lineTo(P[n - 1][0], P[n - 1][1]);
    return;
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(P[n - 1], P[0]);
  c.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const q = P[i],
      m = mid(q, P[(i + 1) % n]);
    c.quadraticCurveTo(q[0], q[1], m[0], m[1]);
  }
  c.closePath();
}
function tracePoly(c, P) {
  c.beginPath();
  c.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]);
  c.closePath();
}
export function blob(c, pts, closed = true) {
  LAST = { kind: "blob", pts, closed };
  return trace(c, pts, closed);
}
export function poly(c, pts) {
  LAST = { kind: "poly", pts, closed: true };
  tracePoly(c, pts);
}
// While a tint is set every inked fill uses it: drawing a sprite a second
// time, tinted and translucent, is the hit flash.
let TINT = null;
export const setTint = (color) => (TINT = color);
let SHADE = true;
export const setShade = (on) => (SHADE = on);
// The 2000s comic look: flat fill, a hard cel shadow on the lower-right of
// every shape, a heavy ink line and a thinner second pass that misses the
// first by a hair, the way a hand-inked panel does.
export function inked(c, fill, width = 3.5) {
  const shape = LAST;
  LAST = null;
  if (fill) {
    c.fillStyle = TINT || fill;
    c.fill();
    if (SHADE && shape && !TINT) {
      let x0, y0, x1, y1;
      if (shape.kind === "ellipse") {
        const [x, y, rx, ry] = shape.args;
        x0 = x - rx;
        x1 = x + rx;
        y0 = y - ry;
        y1 = y + ry;
      } else {
        x0 = y0 = Infinity;
        x1 = y1 = -Infinity;
        for (const [x, y] of shape.pts) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      if (x1 - x0 > 6 && y1 - y0 > 6) {
        const g = c.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "rgba(255,248,220,0.10)");
        g.addColorStop(0.3, "rgba(255,248,220,0)");
        g.addColorStop(0.62, "rgba(20,12,24,0)");
        g.addColorStop(0.63, "rgba(20,12,24,0.26)");
        g.addColorStop(1, "rgba(20,12,24,0.34)");
        c.fillStyle = g;
        c.fill();
      }
    }
  }
  c.lineWidth = width * 1.12;
  c.strokeStyle = INK;
  c.lineJoin = "round";
  c.lineCap = "round";
  c.stroke();
  if (shape && width >= 2.4) {
    c.save();
    c.globalAlpha *= 0.55;
    c.lineWidth = Math.max(1, width * 0.38);
    if (shape.kind === "ellipse") {
      const [x, y, rx, ry, rot] = shape.args;
      c.beginPath();
      c.ellipse(x + 0.9, y - 0.7, rx * 1.02, ry * 0.99, rot + 0.04, 0.2, Math.PI * 1.85);
    } else if (shape.kind === "poly") tracePoly(c, shape.pts.map(([x, y]) => [x + (hash(x, y) - 0.5) * 2.4, y + (hash(y, x) - 0.5) * 2.4]));
    else trace(c, shape.pts, shape.closed, 2.6);
    c.stroke();
    c.restore();
  }
}
// fill without ink: also forgets the shape so the next inked() can't misuse it
export function fillPlain(c) {
  c.fill();
  LAST = null;
}
export function ellipse(c, x, y, rx, ry, rot = 0) {
  LAST = { kind: "ellipse", args: [x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot] };
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
}
export function outlinedText(c, text, x, y, size, fill, { align = "center", stroke = INK, width, italic = false, base = "alphabetic" } = {}) {
  c.font = `${italic ? "italic " : ""}${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = base;
  c.lineJoin = "round";
  c.lineWidth = width ?? Math.max(3, size * 0.16);
  c.strokeStyle = stroke;
  c.strokeText(text, x, y);
  c.fillStyle = fill;
  c.fillText(text, x, y);
}

// ---------------------------------------------------------------- weapons
// Drawn pointing right, grip at the origin. size ~ 1 is in-hand scale.
export function drawGun(c, id, size = 1) {
  const w = WEAPON[id];
  if (!w) return;
  c.save();
  c.scale(size, size);
  const metal = "#3b3f48",
    dark = "#24262c",
    wood = "#8a5530",
    hi = "#6d7380";
  const f = w.family;
  const L = { pistol: 30, smg: 40, rifle: 62, shotgun: 58, launcher: 64, saw: 56, flame: 60, laser: 54 }[f] || 30;
  if (f === "pistol") {
    const big = id === "magnum" || id === "deagle";
    if (id === "magnum") {
      // revolver: cylinder and long barrel, silver
      poly(c, [[-4, -10], [30, -10], [30, -4], [10, -4], [8, 0], [-4, 0]]);
      inked(c, "#c9ccd2", 2.5);
      ellipse(c, 6, -5, 6, 5);
      inked(c, "#9ea3ab", 2);
      poly(c, [[-4, -2], [2, -2], [-2, 12], [-10, 12]]);
      inked(c, "#2b2b2b", 2.5);
    } else {
      poly(c, [[-4, -11], [big ? 30 : 24, -11], [big ? 30 : 24, -3], [4, -3], [2, 1], [-4, 1]]);
      inked(c, id === "deagle" ? "#b9bcc4" : metal, 2.5);
      poly(c, [[-4, -2], [3, -2], [-1, 12], [-9, 12]]);
      inked(c, dark, 2.5);
    }
  } else if (f === "shotgun") {
    // lever-action / pump: long barrel over a tube, wooden stock
    poly(c, [[-26, -6], [-6, -9], [-6, -1], [-22, 6], [-30, 6]]);
    inked(c, id === "aa12" ? dark : wood, 2.5);
    poly(c, [[-8, -10], [L - 20, -10], [L - 20, -4], [-8, -4]]);
    inked(c, metal, 2.5);
    poly(c, [[-8, -4], [L - 26, -4], [L - 26, 0], [-8, 0]]);
    inked(c, id === "m1887" ? wood : dark, 2);
    if (id === "m1887") {
      c.beginPath();
      c.arc(-4, 4, 6, 0, Math.PI);
      inked(c, null, 2.5);
    }
    if (id === "aa12") {
      poly(c, [[6, 0], [14, 0], [14, 14], [6, 14]]);
      inked(c, dark, 2);
    }
  } else if (f === "smg" || f === "rifle") {
    const stock = f === "rifle" || id === "ump45" || id === "kriss";
    if (stock) {
      poly(c, [[-26, -8], [-6, -9], [-6, 0], [-24, 4]]);
      inked(c, id === "ak47" ? wood : dark, 2.5);
    }
    poly(c, [[-8, -12], [L - 22, -12], [L - 22, -3], [-8, -3]]);
    inked(c, id === "m61" ? "#4b5160" : metal, 2.5);
    poly(c, [[L - 22, -9], [L - 12, -9], [L - 12, -6], [L - 22, -6]]);
    inked(c, dark, 2);
    // magazine
    const curve = id === "ak47" ? 6 : 0;
    poly(c, [[2, -3], [9, -3], [9 + curve, 14], [2 + curve, 15]]);
    inked(c, dark, 2);
    poly(c, [[-6, -3], [-1, -3], [-3, 9], [-8, 9]]);
    inked(c, dark, 2);
    if (id === "m61") {
      for (let i = 0; i < 3; i++) {
        poly(c, [[L - 22, -12 + i * 3], [L - 6, -12 + i * 3], [L - 6, -10 + i * 3], [L - 22, -10 + i * 3]]);
        inked(c, hi, 1.5);
      }
    }
  } else if (f === "launcher") {
    if (id === "rocket") {
      poly(c, [[-26, -14], [L - 24, -14], [L - 24, -2], [-26, -2]]);
      inked(c, "#4f6b3a", 3);
      poly(c, [[L - 24, -11], [L - 12, -8], [L - 24, -5]]);
      inked(c, "#c43a2a", 2);
    } else {
      poly(c, [[-20, -6], [-4, -9], [-4, 0], [-18, 5]]);
      inked(c, dark, 2.5);
      poly(c, [[-4, -14], [L - 26, -14], [L - 26, -2], [-4, -2]]);
      inked(c, "#4f6b3a", 3);
      ellipse(c, 6, -8, 8, 8);
      inked(c, dark, 2);
    }
    poly(c, [[-2, -2], [4, -2], [2, 10], [-4, 10]]);
    inked(c, dark, 2);
  } else if (f === "saw") {
    poly(c, [[-22, -12], [L - 30, -12], [L - 30, -2], [-22, -2]]);
    inked(c, "#c98a2a", 3);
    drawSawBlade(c, L - 24, -7, 11, 0);
    poly(c, [[-4, -2], [2, -2], [0, 10], [-6, 10]]);
    inked(c, dark, 2);
  } else if (f === "flame") {
    ellipse(c, -12, -4, 10, 12);
    inked(c, "#c7322a", 2.5);
    poly(c, [[-4, -10], [L - 26, -8], [L - 26, -3], [-4, -1]]);
    inked(c, metal, 2.5);
    poly(c, [[L - 26, -10], [L - 18, -11], [L - 18, -1], [L - 26, -2]]);
    inked(c, dark, 2);
  } else if (f === "laser") {
    poly(c, [[-14, -14], [L - 26, -11], [L - 18, -7], [L - 26, -3], [-14, 0]]);
    inked(c, "#d9e3ee", 2.5);
    poly(c, [[0, -11], [16, -11], [16, -4], [0, -4]]);
    inked(c, "#39d4ff", 2);
    poly(c, [[-6, 0], [0, 0], [-2, 10], [-8, 10]]);
    inked(c, dark, 2);
  }
  c.restore();
}

export function drawMelee(c, id, size = 1) {
  c.save();
  c.scale(size, size);
  if (id === "crowbar") {
    c.beginPath();
    c.moveTo(0, 6);
    c.lineTo(0, -58);
    c.quadraticCurveTo(0, -68, 10, -66);
    inked(c, null, 9);
    c.beginPath();
    c.moveTo(0, 6);
    c.lineTo(0, -58);
    c.quadraticCurveTo(0, -68, 10, -66);
    c.lineWidth = 4.5;
    c.strokeStyle = "#b8bec8";
    c.stroke();
  } else if (id === "axe") {
    poly(c, [[-3, 8], [3, 8], [3, -62], [-3, -62]]);
    inked(c, "#a0522d", 2.5);
    poly(c, [[2, -64], [22, -70], [26, -50], [2, -48]]);
    inked(c, "#c9302c", 2.5);
    poly(c, [[20, -70], [26, -70], [30, -50], [24, -50]]);
    inked(c, "#cfd3da", 2);
  } else if (id === "chainsaw") {
    poly(c, [[-10, 6], [12, 6], [12, -14], [-10, -14]]);
    inked(c, "#e8a21a", 2.5);
    poly(c, [[-2, -14], [6, -14], [6, -66], [-2, -66]]);
    inked(c, "#c2c7cf", 2.5);
    for (let y = -62; y < -14; y += 7) {
      c.beginPath();
      c.moveTo(6, y);
      c.lineTo(10, y + 3);
      c.lineTo(6, y + 6);
      inked(c, null, 1.5);
    }
  } else {
    // spiked club / bat
    blob(c, [[-3, 8], [3, 8], [7, -40], [8, -60], [0, -66], [-8, -60], [-7, -40]]);
    inked(c, "#9c6a3f", 2.5);
    for (const [x, y] of [[-8, -52], [8, -46], [-7, -36], [8, -58]]) {
      poly(c, [[x, y], [x + Math.sign(x) * 7, y - 2], [x, y + 4]]);
      inked(c, "#e8e2d0", 1.5);
    }
  }
  c.restore();
}

export function drawSawBlade(c, x, y, r, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      rr = i % 2 ? r : r * 0.78;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  inked(c, "#dfe3ea", 2);
  ellipse(c, 0, 0, r * 0.25, r * 0.25);
  inked(c, "#7c828c", 1.5);
  c.restore();
}

// ammo icon shown in the HUD badge
export function drawAmmoIcon(c, family, x, y, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(-0.5);
  if (family === "shotgun") {
    poly(c, [[-7, -14], [7, -14], [7, 8], [-7, 8]]);
    inked(c, "#d8402f", 2.5);
    poly(c, [[-7, 8], [7, 8], [7, 15], [-7, 15]]);
    inked(c, "#e0b53d", 2.5);
  } else if (family === "launcher") {
    blob(c, [[0, -20], [7, -8], [7, 12], [-7, 12], [-7, -8]]);
    inked(c, "#c9d0d8", 2.5);
    poly(c, [[-7, 6], [-12, 16], [12, 16], [7, 6]]);
    inked(c, "#c43a2a", 2);
  } else if (family === "saw") {
    drawSawBlade(c, 0, 0, 13, 0.3);
  } else if (family === "flame") {
    ellipse(c, 0, 0, 9, 14);
    inked(c, "#c7322a", 2.5);
    poly(c, [[-4, -18], [4, -18], [4, -12], [-4, -12]]);
    inked(c, "#3b3f48", 2);
  } else if (family === "laser") {
    poly(c, [[-8, -14], [8, -14], [8, 14], [-8, 14]]);
    inked(c, "#39d4ff", 2.5);
    poly(c, [[-3, -18], [3, -18], [3, -14], [-3, -14]]);
    inked(c, "#d9e3ee", 2);
  } else if (family === "melee") {
    c.rotate(0.5);
    drawMelee(c, "club", 0.42);
  } else {
    const n = family === "smg" || family === "rifle" ? 2 : 1;
    for (let i = 0; i < n; i++) {
      c.save();
      c.translate(i * 9 - (n - 1) * 4.5, 0);
      blob(c, [[0, -16], [6, -6], [6, 12], [-6, 12], [-6, -6]]);
      inked(c, "#f2c84b", 2.5);
      c.restore();
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- the characters
// Chibi proportions from the footage: a big round head, wide eyes that look up,
// heavy outlines. The KID wears a numbered jersey; the BRAWLER has long
// black hair, a bow, a dress and swings a wooden "TON" hammer.

const shade = (hex, f = 0.78) => {
  const n = parseInt(hex.slice(1), 16);
  const k = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${k(n >> 16)},${k((n >> 8) & 255)},${k(n & 255)})`;
};
// where blood lands, in order, as the bites add up
const KID_SPLATS = [
  [6, -78, 7], [-8, -64, 6], [14, -58, 5], [18, -112, 6], [-4, -92, 5], [2, -50, 6], [26, -100, 4],
  [-12, -80, 4], [10, -40, 5], [30, -120, 4], [-6, -122, 5], [-14, -56, 4], [22, -70, 5], [8, -136, 4],
];
function splat(c, x, y, r, seed) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2,
      rr = r * (0.6 + hash(seed + i, x) * 0.7);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  trace(c, pts, true);
  c.fillStyle = "#a3101a";
  c.fill();
}

// the girl's melee weapon: a wooden barrel hammer stencilled "TON"
export function drawHammer(c, size = 1) {
  c.save();
  c.scale(size, size);
  poly(c, [[-3, 8], [3, 8], [3, -50], [-3, -50]]);
  inked(c, "#8a5530", 2.5);
  blob(c, [[-30, -86], [26, -84], [30, -50], [-28, -48]]);
  inked(c, "#b4653b", 3.5);
  for (const y of [-80, -54]) {
    poly(c, [[-30, y - 3], [30, y - 3], [30, y + 3], [-30, y + 3]]);
    inked(c, "#c9a24a", 2);
  }
  c.font = `20px ${FONT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#3b1d0e";
  c.fillText("TON", 0, -67);
  c.restore();
}

function hairBack(c, look) {
  if (look.char !== "girl") return;
  c.fillStyle = "#141010";
  if (look.hair === 0) blob(c, [[-34, -50], [-40, -10], [-36, 40], [-14, 46], [10, 30], [24, -20]]);
  else if (look.hair === 1) blob(c, [[-36, -48], [-40, -8], [-30, 6], [24, 2], [30, -30]]);
  else blob(c, [[-30, -54], [-58, -40], [-66, -6], [-52, 6], [-40, -24], [-20, -40]]);
  inked(c, "#141010", 3);
}
function hairFront(c, look) {
  const dark = "#130e0c";
  if (look.char === "girl") {
    // bangs and the bow
    blob(c, [[-32, -36], [-26, -58], [0, -66], [26, -60], [36, -40], [30, -34], [16, -46], [0, -42], [-14, -46]]);
    inked(c, dark, 2.5);
    c.save();
    c.translate(-6, -62);
    c.rotate(-0.3);
    const bow = BOWS[look.bow];
    blob(c, [[0, 0], [-22, -16], [-28, -2], [-8, 6]]);
    inked(c, bow, 2.5);
    blob(c, [[0, 0], [24, -14], [28, 2], [8, 6]]);
    inked(c, bow, 2.5);
    blob(c, [[-6, 2], [-18, 26], [-10, 28], [0, 6]]);
    inked(c, bow, 2);
    ellipse(c, 0, 1, 6, 5);
    inked(c, bow, 2);
    c.restore();
    return;
  }
  if (look.hair === 1) {
    // afro
    blob(c, [[-40, -30], [-42, -58], [-20, -78], [12, -80], [38, -64], [42, -38], [30, -46], [0, -52], [-24, -46]]);
    inked(c, dark, 2.5);
  } else if (look.hair === 2) {
    // buzz: a thin cap of hair
    blob(c, [[-32, -38], [-26, -58], [0, -63], [26, -57], [33, -40], [22, -50], [0, -54], [-20, -50]]);
    c.fillStyle = "#2a1d17";
    fillPlain(c);
  } else if (look.hair === 3) {
    // mohawk
    blob(c, [[-14, -52], [-8, -76], [6, -82], [18, -72], [16, -54]]);
    inked(c, dark, 2.5);
  } else {
    // flat top, faded at the sides
    blob(c, [[-32, -36], [-28, -62], [-4, -70], [24, -64], [34, -42], [26, -50], [2, -54], [-22, -50]]);
    inked(c, dark, 2.5);
  }
}

export function drawKid(c, o) {
  const {
    facing = 1,
    walk = 0,
    moving = false,
    swing = 0,
    muzzle = 0,
    gun = "usp",
    melee = "club",
    shooting = false,
    dead = false,
    t = 0,
    recoil = 0,
    blood = 0,
    hurt = 0,
    aim = 0,
  } = o;
  const look = o.look || baseLook();
  const girl = look.char === "girl";
  const SKIN = SKINS[look.skin],
    SKIN_D = shade(SKIN, 0.75);
  const fit = OUTFITS[look.outfit];
  const shoe = SHOES[look.shoes];
  c.save();
  c.scale(facing, 1);
  // gait: a bouncy stride with a forward lean; standing still he breathes
  const stride = moving ? Math.sin(walk) : 0;
  const bob = moving ? Math.abs(Math.cos(walk)) * 5 : 0;
  const breath = moving ? 0 : Math.sin(t * 2.6);
  const lean = moving ? 0.08 : 0;
  c.translate(-recoil * 4, -bob);
  const leg = (dx, ang, back) => {
    c.save();
    c.translate(dx, -34);
    c.rotate(ang);
    if (girl) {
      poly(c, [[-5, -2], [5, -2], [4, 24], [-4, 24]]);
      inked(c, back ? SKIN_D : SKIN, 2.5);
    } else {
      poly(c, [[-7, -2], [7, -2], [6, 18], [-6, 18]]);
      inked(c, back ? shade(fit.main, 0.88) : fit.main, 3);
      poly(c, [[-5, 16], [5, 16], [5, 24], [-5, 24]]);
      inked(c, back ? SKIN_D : SKIN, 2.5);
    }
    blob(c, [[-9, 23], [13, 22], [17, 30], [15, 34], [-10, 34]]);
    inked(c, back ? shade(shoe, 0.75) : shoe, 3);
    poly(c, [[-8, 31], [16, 31], [15, 34], [-9, 34]]);
    inked(c, "#f1ede4", 1.5);
    c.restore();
  };
  // girl's hair hangs behind everything
  c.save();
  c.rotate(lean);
  c.translate(0, -86 - breath * 3.4);
  hairBack(c, look);
  c.restore();

  leg(-5, stride * 0.75, true);
  if (!girl) {
    c.save();
    c.rotate(lean);
    poly(c, [[-15, -46], [15, -46], [16, -30], [-16, -30]]);
    inked(c, fit.main, 3);
    c.fillStyle = fit.trim;
    c.fillRect(-15, -36, 31, 3);
    c.restore();
  }
  leg(6, -stride * 0.75, false);

  // torso breathes from the waist up
  c.save();
  c.rotate(lean);
  c.translate(0, -46);
  c.scale(1 + breath * 0.025, 1 + breath * 0.06);
  c.translate(0, 46);
  // back arm swings opposite the front leg
  c.save();
  c.translate(-8, -80);
  c.rotate(moving ? -stride * 0.8 : 0.15 + breath * 0.06);
  blob(c, [[-5, 0], [5, 0], [6, 26], [-4, 28]]);
  inked(c, SKIN_D, 3);
  c.restore();
  if (girl) {
    // a white dress that flares at the hem
    blob(c, [[-14, -86], [12, -86], [16, -66], [26, -30], [-26, -30], [-17, -66]]);
    inked(c, fit.main, 3.5);
    c.strokeStyle = fit.trim;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-24, -34);
    c.lineTo(24, -34);
    c.stroke();
  } else {
    blob(c, [[-18, -86], [15, -86], [20, -70], [18, -44], [-18, -44], [-21, -68]]);
    inked(c, fit.main, 3.5);
    c.strokeStyle = fit.trim;
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(-8, -86);
    c.quadraticCurveTo(0, -78, 8, -86);
    c.stroke();
    c.font = `${look.number > 9 ? 18 : 22}px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineWidth = 2.5;
    c.strokeStyle = shade(fit.num, 0.55);
    c.strokeText(String(look.number), 4, -64);
    c.fillStyle = fit.num;
    c.fillText(String(look.number), 4, -64);
  }
  for (let i = 0; i < Math.min(blood, KID_SPLATS.length); i++) {
    const [x, y, r] = KID_SPLATS[i];
    if (y > -90) splat(c, x, y, r, i * 7.1);
  }
  c.restore();

  // head
  c.save();
  c.rotate(lean);
  c.translate(0, -86 - breath * 3.4 + (moving ? Math.cos(walk * 2) * 1.2 : 0));
  c.rotate(hurt > 0 ? -0.18 : dead ? 0.3 : 0);
  ellipse(c, 2, -32, 34, 32);
  inked(c, SKIN, 3.5);
  if (!girl) {
    ellipse(c, -14, -28, 6, 8);
    inked(c, SKIN_D, 2.5);
  }
  hairFront(c, look);
  // eyes: big whites, pupils looking up, heavy lids. They blink.
  const blink = !dead && t % 3.9 < 0.11;
  if (blink || dead) {
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath();
    if (dead)
      for (const ex of [16, 30]) {
        c.moveTo(ex - 5, -38);
        c.lineTo(ex + 5, -28);
        c.moveTo(ex + 5, -38);
        c.lineTo(ex - 5, -28);
      }
    else {
      c.moveTo(8, -32);
      c.lineTo(24, -32);
      c.moveTo(26, -31);
      c.lineTo(35, -31);
    }
    c.stroke();
  } else {
    ellipse(c, 16, -31, 9.5, 11);
    inked(c, "#ffffff", 2.5);
    ellipse(c, 30, -30, 6.5, 10);
    inked(c, "#ffffff", 2.5);
    c.fillStyle = INK;
    const lx = hurt > 0 ? 2 : 0;
    ellipse(c, 19 + lx, -37, 2.4, 2.8);
    fillPlain(c);
    ellipse(c, 32 + lx, -36, 2, 2.6);
    fillPlain(c);
    c.beginPath();
    c.moveTo(6, -38);
    c.quadraticCurveTo(16, -45, 26, -39);
    c.moveTo(25, -38);
    c.quadraticCurveTo(31, -43, 37, -37);
    c.lineWidth = girl ? 2.5 : 3.5;
    c.strokeStyle = INK;
    c.stroke();
    if (girl) {
      // lashes
      c.beginPath();
      c.moveTo(24, -41);
      c.lineTo(28, -45);
      c.moveTo(36, -38);
      c.lineTo(40, -41);
      c.lineWidth = 2;
      c.stroke();
    }
  }
  c.beginPath();
  c.moveTo(36, -24);
  c.quadraticCurveTo(40, -20, 35, -18);
  c.lineWidth = 2.5;
  c.strokeStyle = SKIN_D;
  c.stroke();
  ellipse(c, 27, -10, hurt > 0 ? 5 : 3.5, hurt > 0 ? 4 : 2.2);
  inked(c, "#6d2a22", 2);
  for (let i = 0; i < Math.min(blood, KID_SPLATS.length); i++) {
    const [x, y, r] = KID_SPLATS[i];
    if (y <= -90) splat(c, x, y + 86, r, i * 3.3);
  }
  c.restore();

  // weapon arm
  c.save();
  c.rotate(lean);
  c.translate(4, -76 - breath * 2.6);
  const drawMeleeFor = (size) => (girl ? drawHammer(c, size * 0.95) : drawMelee(c, melee, size));
  if (swing > 0) {
    // overhead, two-handed, with the motion smear of the video
    const swingT = 1 - swing / 0.22;
    const ease = 1 - (1 - swingT) * (1 - swingT);
    const a = -2.6 + ease * 3.4;
    for (const [lag, alpha] of [
      [0.9, 0.16],
      [0.55, 0.28],
      [0.25, 0.45],
    ]) {
      if (a - lag < -2.6) continue;
      c.save();
      c.globalAlpha *= alpha;
      c.rotate(a - lag + Math.PI / 2);
      setShade(false);
      drawMeleeFor(1.05);
      setShade(true);
      c.restore();
    }
    c.rotate(a + Math.PI / 2);
    drawMeleeFor(1.05);
    c.rotate(-(a + Math.PI / 2));
    c.rotate(a);
    blob(c, [[0, -6], [28, -6], [30, 6], [0, 6]]);
    inked(c, SKIN, 3);
    ellipse(c, 28, 0, 7, 7);
    inked(c, SKIN, 2.5);
  } else {
    // shooting: the arm thrusts straight out at shoulder height, one-handed,
    // and kicks up with each shot; otherwise the gun hangs low at the hip
    const up = Math.min(1, aim / 0.2);
    const swingArm = moving ? Math.sin(walk) * 0.05 * (1 - up) : 0;
    c.rotate(-recoil * 0.3 + swingArm + (1 - up) * 0.55 - 0.05 * up);
    blob(c, [[-2, -6], [34, -5], [36, 6], [-4, 6]]);
    inked(c, SKIN, 3);
    ellipse(c, 36, 0, 6.5, 6.5);
    inked(c, SKIN, 2.5);
    c.save();
    c.translate(36, 4);
    c.rotate(-(1 - up) * 0.55);
    drawGun(c, gun, 1);
    if (muzzle > 0 && shooting) {
      const L = { pistol: 30, smg: 40, rifle: 62, shotgun: 58, launcher: 64, saw: 56, flame: 60, laser: 54 }[WEAPON[gun].family] - 18;
      c.translate(L, -7);
      c.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2,
          r = i % 2 ? 6 : 16 + (i % 4) * 3;
        c.lineTo(Math.cos(a) * r * 1.4 + 9, Math.sin(a) * r * 0.75);
      }
      c.closePath();
      c.fillStyle = "#ffcf3a";
      fillPlain(c);
      c.fillStyle = "#fff6c4";
      ellipse(c, 7, 0, 8, 4);
      fillPlain(c);
    }
    c.restore();
  }
  c.restore();
  c.restore();
}

// ---------------------------------------------------------------- dinosaurs
// Drawn from the gameplay video: chunky body, cyan shark-fin stripes, one huge
// white eye under an angry brow, a wide red mouth with a tongue, tan throat.
export const DINO_LOOK = {
  raptor: { body: "#4a78c9", dark: "#2f539a", stripe: "#a9dcf3", throat: "#c99b7d", spike: "#f3f1e8", scale: 1.15 },
  horned: { body: "#c3916a", dark: "#8f6143", stripe: "#f0d6b0", throat: "#e2c19c", spike: "#f3ead6", scale: 1.2, horns: true },
  brute: { body: "#6c9750", dark: "#486b35", stripe: "#b5d68f", throat: "#c9c08f", spike: "#e9e6cf", scale: 1.42, skull: "#e3dfc3" },
};

// the head on its own, origin at the back of the skull where the neck joins.
// Drawn after the game's icon: a blocky skull with white chips on the crown,
// a horn on the snout, a slanted angry eye, a tan jaw with a few big fangs
// and a long red tongue lolling out. The video's kill throws exactly this.
export function drawDinoHead(c, type, jaw = 0.4, t = 0, severed = false) {
  const look = DINO_LOOK[type] || DINO_LOOK.raptor;
  const skin = look.skull || look.body;
  // lower jaw, tongue and lower fangs
  c.save();
  c.translate(8, 6);
  c.rotate(jaw);
  blob(c, [[-6, -4], [52, -2], [68, 6], [62, 18], [30, 22], [0, 16]]);
  inked(c, look.throat, 3.5);
  poly(c, [[2, -3], [64, 0], [58, 7], [4, 8]]);
  c.fillStyle = "#7d1119";
  fillPlain(c);
  for (const [x, h] of [
    [18, 9],
    [42, 11],
    [58, 8],
  ]) {
    poly(c, [[x - 4, 1], [x, -h], [x + 4, 1]]);
    inked(c, "#fffdf3", 1.8);
  }
  // the tongue hangs out past the jaw
  const flop = Math.sin(t * 6) * 3;
  blob(c, [[14, 2], [44, 0], [70, 6], [86, 22 + flop], [80, 34 + flop], [70, 24 + flop], [50, 10], [20, 8]]);
  inked(c, "#b8262f", 2.8);
  c.strokeStyle = "#7d1119";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(30, 5);
  c.quadraticCurveTo(58, 8, 76, 24 + flop);
  c.stroke();
  c.restore();
  // skull
  blob(c, [[-16, 2], [-12, -30], [6, -46], [34, -50], [58, -42], [78, -30], [88, -14], [84, 2], [12, 8]]);
  inked(c, skin, 4);
  // brushy shading under the cheek
  c.strokeStyle = look.dark || "rgba(0,0,0,.3)";
  c.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    c.lineWidth = 3 - i * 0.3;
    c.beginPath();
    c.moveTo(-6 + i * 14, -4 - (i % 2) * 4);
    c.quadraticCurveTo(2 + i * 14, -10, 8 + i * 14, -2);
    c.stroke();
  }
  // inside of the mouth + upper fangs
  poly(c, [[10, 4], [84, 0], [78, 9], [12, 10]]);
  c.fillStyle = "#7d1119";
  fillPlain(c);
  for (const [x, h] of [
    [24, 13],
    [46, 15],
    [70, 11],
  ]) {
    poly(c, [[x - 5, 3], [x, 3 + h], [x + 5, 3]]);
    inked(c, "#fffdf3", 1.8);
  }
  if (!look.skull) {
    // white chips on the crown, and the horns
    for (const pts of [
      [[2, -40], [16, -48], [20, -38], [8, -34]],
      [[28, -48], [44, -48], [40, -38], [30, -40]],
      [[52, -42], [62, -38], [56, -32]],
    ]) {
      poly(c, pts);
      inked(c, look.stripe, 1.6);
    }
    poly(c, [[-8, -30], [-24, -50], [-2, -38]]);
    inked(c, "#f6f3ea", 2.5);
    poly(c, [[66, -36], [78, -62], [80, -30]]);
    inked(c, "#f6f3ea", 2.5);
  }
  if (look.horns) {
    poly(c, [[40, -46], [50, -74], [56, -44]]);
    inked(c, "#f3ead6", 2.5);
  }
  // nostril
  ellipse(c, 80, -16, 3.5, 2.5, 0.4);
  c.fillStyle = INK;
  fillPlain(c);
  if (look.skull) {
    // brute: pale skull face, dark socket, tiny glint
    ellipse(c, 30, -20, 14, 12);
    inked(c, "#2a2224", 2.5);
    c.fillStyle = "#ffffff";
    ellipse(c, 34, -22, 3, 3);
    fillPlain(c);
  } else {
    // the slanted, angry eye
    poly(c, [[18, -30], [42, -36], [52, -24], [28, -18]]);
    inked(c, "#ffffff", 3);
    c.fillStyle = INK;
    ellipse(c, severed ? 32 : 40, -27 + (severed ? 3 : 0), 2.4, 2.4);
    fillPlain(c);
    c.beginPath();
    c.moveTo(12, -40);
    c.lineTo(54, -30);
    c.lineWidth = 6;
    c.strokeStyle = INK;
    c.stroke();
  }
  if (severed) drawMeat(c, -14, -10, 17);
}

// raw meat: red flesh with darker pits and white flecks (the neck stump in the video)
export function drawMeat(c, x, y, r) {
  ellipse(c, x, y, r, r * 1.1);
  inked(c, "#c42532", 3);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4,
      rr = r * 0.55 * ((i % 3) / 2 + 0.2);
    c.fillStyle = i % 3 === 0 ? "#f3d6c8" : "#7a0c14";
    ellipse(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.8 + (i % 2), 1.8 + (i % 2));
    fillPlain(c);
  }
}

// state: walk | windup | lunge | latched | stagger | recover. dir 1 = facing right.
// opts.headless draws the body only, with a meat stump where the head was.
export function drawDino(c, d, t = 0, opts = {}) {
  const look = DINO_LOOK[d.type];
  const s = look.scale;
  c.save();
  c.scale(d.dir * s, s);
  const st = d.state;
  const walk = st === "walk" ? Math.sin(d.phase) : st === "lunge" ? Math.sin(d.phase * 2) : 0;
  const crouch = st === "windup" ? 10 : st === "latched" ? 4 : 0;
  const stretch = st === "lunge" ? 1.12 : 1;
  let jaw = 0.22 + Math.max(0, Math.sin(d.phase * 0.7)) * 0.18;
  if (st === "windup" || st === "lunge") jaw = 0.8;
  if (st === "latched") jaw = 0.25 + Math.abs(Math.sin(t * 14 + d.id)) * 0.6;
  if (st === "stagger") jaw = 0.6;
  const idle = st !== "walk" && st !== "lunge";
  const breath = Math.sin(t * 3.1 + d.id * 1.7);
  const hit = d.flash > 0 ? d.flash / 0.1 : 0;
  c.translate(-hit * 8, crouch);
  if (idle) {
    c.translate(0, -50);
    c.scale(1, 1 + breath * 0.03);
    c.translate(0, 50);
  }
  // tail, swaying
  c.save();
  c.translate(-44, -78);
  c.rotate(Math.sin(t * 2.2 + d.id) * 0.07 - 0.05);
  blob(c, [[6, -14], [-40, -16], [-92, -24], [-100, -18], [-44, 2], [4, 12]]);
  inked(c, look.body, 3.5);
  for (let i = 0; i < 4; i++) {
    const x = -14 - i * 20,
      y = -12 - i * 2.5;
    poly(c, [[x - 7, y + 3], [x + 1, y - 12], [x + 6, y + 3]]);
    inked(c, look.stripe, 1.8);
  }
  c.restore();
  // legs: thick thighs, stubby shins, big feet
  const legDraw = (dx, ang, shade) => {
    c.save();
    c.translate(dx, -56);
    c.rotate(ang);
    blob(c, [[-18, -14], [18, -12], [14, 20], [4, 30], [-14, 22]]);
    inked(c, shade, 3.5);
    poly(c, [[-3, 24], [9, 24], [7, 44], [-4, 44]]);
    inked(c, shade, 3);
    blob(c, [[-10, 44], [20, 41], [26, 52], [-12, 52]]);
    inked(c, shade, 3);
    for (const x of [8, 16, 23]) {
      poly(c, [[x, 49], [x + 5, 52], [x, 54]]);
      inked(c, "#f3f1e8", 1.2);
    }
    c.restore();
  };
  legDraw(-20, walk * 0.5, look.dark);
  // body
  c.save();
  c.scale(stretch, 1);
  blob(c, [[-52, -84], [-14, -110], [30, -108], [56, -88], [52, -58], [14, -44], [-36, -50]]);
  inked(c, look.body, 3.8);
  // underside shading, brushy
  blob(c, [[-40, -54], [10, -48], [48, -62], [30, -54], [-10, -50]]);
  c.fillStyle = look.dark;
  fillPlain(c);
  // shark-fin stripes along the back and flank
  for (let i = 0; i < 5; i++) {
    const x = -36 + i * 17,
      y = -100 + Math.abs(i - 2) * 3;
    poly(c, [[x - 6, y + 22], [x + 2, y - 2], [x + 8, y + 22]]);
    inked(c, look.stripe, 1.8);
  }
  // spikes
  for (let i = 0; i < 5; i++) {
    const x = -32 + i * 15,
      y = -106 - Math.sin(i * 0.8) * 3;
    poly(c, [[x - 5, y + 3], [x + 1, y - 10], [x + 6, y + 3]]);
    inked(c, look.spike, 1.8);
  }
  c.restore();
  legDraw(8, -walk * 0.5, look.body);
  // little arms, clawing
  c.save();
  c.translate(44, -78);
  c.rotate(0.7 + (st === "latched" ? Math.sin(t * 20) * 0.35 : Math.sin(t * 4 + d.id) * 0.1));
  blob(c, [[0, -5], [20, -3], [24, 4], [0, 5]]);
  inked(c, look.body, 2.5);
  c.restore();
  // neck and head
  if (opts.headless) {
    blob(c, [[34, -108], [58, -104], [60, -76], [40, -70]]);
    inked(c, look.body, 3.5);
    drawMeat(c, 56, -92, 15);
  } else {
    c.save();
    c.translate(48 * stretch, -100);
    c.rotate((st === "latched" ? 0.25 : st === "lunge" ? -0.12 : 0.04) - hit * 0.35);
    drawDinoHead(c, d.type, jaw, t);
    c.restore();
  }
  c.restore();
}

// a killed dino: stands headless for a beat, then slumps in a heap. k = 0..1 slump.
export function drawCorpse(c, type, dir, burnt, k = 1, t = 0) {
  c.save();
  c.rotate(dir * 0.32 * k);
  c.scale(1, 1 - 0.42 * k);
  const d = { type, dir, state: "stagger", phase: 0, id: 0, flash: 0 };
  if (burnt) setTint("#3a3030");
  drawDino(c, d, t, { headless: true });
  if (burnt) setTint(null);
  c.restore();
}

// ---------------------------------------------------------------- gore
export function drawGib(c, kind, size, rot, type = "raptor", seed = 0) {
  c.save();
  c.rotate(rot);
  c.scale(size, size);
  if (kind === "eye") {
    ellipse(c, 0, 0, 8, 8);
    inked(c, "#ffffff", 2.5);
    c.fillStyle = INK;
    ellipse(c, 3, 0, 2.6, 2.6);
    fillPlain(c);
    c.beginPath();
    c.moveTo(-8, 0);
    c.quadraticCurveTo(-14, 4, -18, 1);
    c.lineWidth = 3;
    c.strokeStyle = "#b0141c";
    c.stroke();
  } else if (kind === "head") {
    c.scale(0.9, 0.9);
    drawDinoHead(c, type, 0.7, 0, true);
  } else {
    const r = (k) => ((Math.sin(seed * 13.7 + k * 3.1) + 1) / 2) * 4;
    blob(c, [[-10 - r(1), -4], [-2, -9 - r(2)], [10 + r(3), -5], [9, 6 + r(4)], [-6, 8]]);
    inked(c, "#c4323a", 2.5);
    ellipse(c, 0, -1, 4, 2.5);
    c.fillStyle = "#f0a3a3";
    fillPlain(c);
    poly(c, [[3, 2], [12, 0], [12, 3], [3, 4]]);
    inked(c, "#f1ead6", 1.5);
  }
  c.restore();
}

export function drawPool(c, size, seed) {
  c.save();
  c.scale(size, size);
  const r = (k) => ((Math.sin(seed * 9.1 + k * 2.3) + 1) / 2) * 10;
  c.fillStyle = "#7a0911";
  blob(c, [[-62 - r(1), 1], [-30, -8 - r(2) * 0.3], [12, -9], [56 + r(3), -3], [44, 7], [0, 9 + r(4) * 0.3], [-48, 7]]);
  fillPlain(c);
  c.fillStyle = "#a50f19";
  blob(c, [[-40, 0], [-10, -5], [30, -4], [26, 3], [-20, 4]]);
  fillPlain(c);
  c.fillStyle = "rgba(255,190,190,.55)";
  ellipse(c, -8, -2, 14, 1.6);
  fillPlain(c);
  c.restore();
}

// ---------------------------------------------------------------- the clerk
// Big guy in a cap, goatee, tattooed forearm, leaning on the counter, pointing.
export function drawClerk(c, t = 0, talking = false) {
  c.save();
  const breathe = Math.sin(t * 2) * 2;
  // body behind the counter
  blob(c, [[-70, 40], [-80, -40], [-50, -95 + breathe], [30, -100 + breathe], [70, -50], [70, 40]]);
  inked(c, "#2c2c33", 4);
  // far arm resting on the counter
  blob(c, [[-40, -10], [40, -14], [80, 0], [80, 22], [-30, 26]]);
  inked(c, "#e9b39e", 3.5);
  // tattoo
  c.strokeStyle = "#2f5aa8";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(30, 6, 9, 0, Math.PI * 2);
  c.moveTo(16, 6);
  c.lineTo(44, 6);
  c.stroke();
  // head
  c.save();
  c.translate(-10, -120 + breathe);
  blob(c, [[-40, 0], [-36, -40], [0, -54], [36, -40], [42, 4], [30, 34], [-30, 34]]);
  inked(c, "#efbca7", 4);
  // goatee
  blob(c, [[0, 18], [26, 14], [34, 36], [12, 48], [-4, 34]]);
  inked(c, "#e0c25c", 3);
  if (talking) {
    ellipse(c, 16, 22, 8, 5 + Math.abs(Math.sin(t * 18)) * 4);
    inked(c, "#6e1a1a", 2.5);
  } else {
    c.beginPath();
    c.moveTo(4, 20);
    c.quadraticCurveTo(16, 26, 28, 18);
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.stroke();
  }
  // squint and brow
  c.beginPath();
  c.moveTo(6, -12);
  c.lineTo(26, -10);
  c.moveTo(4, -22);
  c.lineTo(28, -16);
  c.lineWidth = 4;
  c.strokeStyle = INK;
  c.stroke();
  ellipse(c, 34, 2, 8, 10);
  inked(c, "#e7a892", 3);
  // cap
  blob(c, [[-44, -26], [-34, -58], [6, -68], [40, -52], [46, -30]]);
  inked(c, "#6f7046", 4);
  blob(c, [[20, -34], [72, -30], [70, -20], [22, -24]]);
  inked(c, "#5b5c39", 3.5);
  c.restore();
  // pointing arm toward the rack
  c.save();
  c.translate(40, -60 + breathe);
  c.rotate(-0.35 + Math.sin(t * 1.5) * 0.05);
  blob(c, [[0, -14], [70, -12], [96, -8], [96, 8], [70, 12], [0, 18]]);
  inked(c, "#efbca7", 3.5);
  blob(c, [[94, -6], [126, -10], [128, -2], [98, 4]]);
  inked(c, "#efbca7", 3);
  blob(c, [[92, -2], [112, 6], [104, 14], [90, 10]]);
  inked(c, "#efbca7", 3);
  c.restore();
  c.restore();
}

// ---------------------------------------------------------------- pickups
export function drawCrate(c, glow = 0) {
  if (glow) {
    c.save();
    c.globalAlpha = 0.35 + glow * 0.3;
    ellipse(c, 0, 2, 46, 10);
    c.fillStyle = "#fff6b0";
    fillPlain(c);
    c.restore();
  }
  poly(c, [[-26, -36], [26, -36], [26, 0], [-26, 0]]);
  inked(c, "#a8733f", 3.5);
  c.strokeStyle = "#6e4a26";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-26, -18);
  c.lineTo(26, -18);
  c.moveTo(-26, -36);
  c.lineTo(26, 0);
  c.stroke();
}
export function drawMedBottle(c) {
  blob(c, [[-14, -34], [14, -34], [16, 0], [-16, 0]]);
  inked(c, "#f6f2ea", 3);
  poly(c, [[-10, -42], [10, -42], [10, -34], [-10, -34]]);
  inked(c, "#d8352f", 2.5);
  c.fillStyle = "#e0322b";
  c.fillRect(-3, -26, 6, 18);
  c.fillRect(-9, -20, 18, 6);
}

// ---------------------------------------------------------------- blood
const BLOOD = "#a50f19",
  BLOOD_D = "#6d070d",
  BLOOD_L = "#d42a33";
// a fan of streaks and drops thrown in one direction (the spray in the footage)
export function drawSpray(c, sp) {
  const t = 1 - sp.life / sp.max;
  c.save();
  c.globalAlpha = Math.min(1, sp.life / sp.max + 0.25);
  for (let i = 0; i < sp.n; i++) {
    const r1 = hash(sp.seed + i, 1.3),
      r2 = hash(sp.seed, i * 2.1);
    const a = sp.radial ? (r1 - 0.5) * 3.0 - 0.35 : (r1 - 0.62) * 1.4;
    const len = (30 + r2 * 70) * sp.big * (0.4 + t * 0.9);
    const dx = Math.cos(a) * len * sp.dir,
      dy = Math.sin(a) * len;
    c.strokeStyle = i % 3 ? BLOOD : BLOOD_L;
    c.lineWidth = (2 + r2 * 4) * (1 - t * 0.5);
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(dx * 0.25, dy * 0.25);
    c.lineTo(dx, dy);
    c.stroke();
    c.beginPath();
    c.arc(dx, dy, 2 + r1 * 3 * sp.big, 0, Math.PI * 2);
    c.fillStyle = BLOOD;
    fillPlain(c);
  }
  // the burst at the wound
  if (t < 0.5) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2,
        r = (i % 2 ? 6 : 14) * sp.big * (1 - t);
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    tracePoly(c, pts);
    c.fillStyle = BLOOD_L;
    fillPlain(c);
  }
  c.restore();
}
export function drawDrop(c, g) {
  const ang = Math.atan2(g.vy, g.vx);
  c.save();
  c.rotate(ang);
  c.beginPath();
  c.ellipse(0, 0, 4 * g.size + Math.min(8, Math.hypot(g.vx, g.vy) / 80), 2.6 * g.size, 0, 0, Math.PI * 2);
  c.fillStyle = BLOOD;
  fillPlain(c);
  c.restore();
}
export function drawSplat(c, size, seed) {
  const pts = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2,
      r = (i % 2 ? 5 : 9) * size * (0.6 + hash(seed, i) * 0.8);
    pts.push([Math.cos(a) * r * 1.6, Math.sin(a) * r * 0.45]);
  }
  trace(c, pts, true);
  c.fillStyle = BLOOD_D;
  fillPlain(c);
}
export function drawSmear(c, size, dir, seed) {
  c.save();
  c.scale(dir || 1, 1);
  const L = 70 * size;
  trace(c, [[-10, -3], [L * 0.5, -5], [L, -2], [L * 0.6, 3], [0, 4]], true);
  c.fillStyle = BLOOD_D;
  fillPlain(c);
  c.strokeStyle = "rgba(60,0,4,.6)";
  c.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(0, -2 + i * 2);
    c.lineTo(L * (0.5 + hash(seed, i) * 0.4), -2 + i * 2);
    c.stroke();
  }
  c.restore();
}
// a splat on a wall with drips running down
export function drawWallSplat(c, size, seed) {
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2,
      r = (i % 2 ? 9 : 22) * size * (0.6 + hash(seed, i) * 0.8);
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  trace(c, pts, true);
  c.fillStyle = BLOOD;
  fillPlain(c);
  c.strokeStyle = BLOOD;
  c.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const x = (hash(seed, i + 9) - 0.5) * 30 * size,
      L = 16 + hash(i, seed) * 50 * size;
    c.lineWidth = 3 + hash(seed + i, 2) * 3;
    c.beginPath();
    c.moveTo(x, 4);
    c.lineTo(x, L);
    c.stroke();
    c.beginPath();
    c.arc(x, L, c.lineWidth * 0.7, 0, Math.PI * 2);
    c.fillStyle = BLOOD;
    fillPlain(c);
  }
}
