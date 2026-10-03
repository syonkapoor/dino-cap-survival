// Hand-inked look, drawn in code: thick black outlines, flat fills, slightly
// irregular curves. Every function draws with its origin at the feet (or the
// object's base) so the renderer only translates. Original art: nothing here
// is traced from or copies Triniti's sprites.
import { WEAPON } from "./data.js";

export const INK = "#141218";
export const FONT = '"Bangers", "Impact", "Arial Black", sans-serif';

// Smooth closed (or open) path through points using midpoint quadratics: the
// cheap way to get a hand-drawn, slightly lumpy outline.
export function blob(c, pts, closed = true) {
  c.beginPath();
  const n = pts.length;
  if (!closed) {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const [x, y] = pts[i],
        [nx, ny] = pts[i + 1];
      c.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
    }
    c.lineTo(pts[n - 1][0], pts[n - 1][1]);
    return;
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  c.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i],
      m = mid(p, pts[(i + 1) % n]);
    c.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  c.closePath();
}
export function poly(c, pts) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
}
// While a tint is set every inked fill uses it: drawing a sprite a second
// time, tinted and translucent, is the hit flash.
let TINT = null;
export const setTint = (color) => (TINT = color);
export function inked(c, fill, width = 3.5) {
  if (fill) {
    c.fillStyle = TINT || fill;
    c.fill();
  }
  c.lineWidth = width;
  c.strokeStyle = INK;
  c.lineJoin = "round";
  c.lineCap = "round";
  c.stroke();
}
export function ellipse(c, x, y, rx, ry, rot = 0) {
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

// ---------------------------------------------------------------- the kid
// White #8 jersey with red trim, red shoes, big round head. ~150px tall.
const SKIN = "#5e3a24",
  SKIN_D = "#4a2c1b";
export function drawKid(c, o) {
  const { facing = 1, walk = 0, moving = false, swing = 0, muzzle = 0, gun = "usp", melee = "club", shooting = false, dead = false } = o;
  c.save();
  c.scale(facing, 1);
  const stride = moving ? Math.sin(walk) : 0;
  const bob = moving ? Math.abs(Math.cos(walk)) * 3 : 0;
  c.translate(0, -bob);
  // legs
  const leg = (dx, ang, back) => {
    c.save();
    c.translate(dx, -38);
    c.rotate(ang);
    poly(c, [[-7, 0], [7, 0], [6, 26], [-6, 26]]);
    inked(c, back ? "#d9d6cf" : "#f4f2ec", 3);
    poly(c, [[-6, 22], [6, 22], [6, 30], [-6, 30]]);
    inked(c, SKIN, 2.5);
    blob(c, [[-8, 30], [14, 30], [16, 38], [-9, 38]]);
    inked(c, back ? "#b12a26" : "#d8352f", 3);
    c.restore();
  };
  leg(-6, stride * 0.5, true);
  // shorts
  poly(c, [[-16, -50], [16, -50], [17, -32], [-17, -32]]);
  inked(c, "#f4f2ec", 3);
  c.fillStyle = "#d8352f";
  c.fillRect(-16, -36, 33, 3);
  leg(6, -stride * 0.5, false);
  // jersey
  blob(c, [[-18, -92], [16, -92], [20, -72], [18, -48], [-18, -48], [-21, -72]]);
  inked(c, "#f7f5ef", 3.5);
  c.beginPath();
  c.moveTo(-8, -92);
  c.quadraticCurveTo(0, -84, 8, -92);
  c.lineWidth = 4;
  c.strokeStyle = "#d8352f";
  c.stroke();
  c.font = `20px ${FONT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.strokeText("8", 2, -70);
  c.fillStyle = "#d8352f";
  c.fillText("8", 2, -70);
  // back arm
  const swingT = swing > 0 ? 1 - swing / 0.22 : 0;
  const isSwing = swing > 0;
  // head
  c.save();
  c.translate(0, -92);
  ellipse(c, 0, -30, 31, 30);
  inked(c, SKIN, 3.5);
  // short hair: flat top fade
  blob(c, [[-30, -36], [-26, -56], [0, -62], [24, -56], [30, -40], [24, -46], [0, -50], [-22, -46]]);
  inked(c, "#16110f", 2.5);
  // ear
  ellipse(c, -14, -26, 6, 8);
  inked(c, SKIN_D, 2.5);
  // eyes: big whites, small pupils looking ahead
  ellipse(c, 14, -32, 9, 10);
  inked(c, "#ffffff", 2.5);
  ellipse(c, 26, -31, 6, 9);
  inked(c, "#ffffff", 2.5);
  c.fillStyle = INK;
  ellipse(c, 17, -31, 2.6, 3);
  c.fill();
  ellipse(c, 28, -30, 2.2, 3);
  c.fill();
  c.beginPath();
  c.moveTo(8, -45);
  c.lineTo(20, -43);
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.stroke();
  // mouth
  c.beginPath();
  if (dead) c.arc(22, -12, 5, Math.PI, 0);
  else c.arc(22, -14, 4, 0, Math.PI);
  c.lineWidth = 2.5;
  c.stroke();
  c.restore();
  // weapon arm
  c.save();
  c.translate(4, -76);
  if (isSwing) {
    const a = -2.2 + swingT * 3.0;
    c.rotate(a + Math.PI / 2);
    drawMelee(c, melee, 0.9);
    c.rotate(-(a + Math.PI / 2));
    c.rotate(a);
    blob(c, [[0, -5], [26, -5], [26, 5], [0, 5]]);
    inked(c, SKIN, 3);
  } else {
    // hold the gun at the waist, pointing forward
    blob(c, [[-2, -6], [18, 4], [24, 12], [14, 16], [-4, 6]]);
    inked(c, SKIN, 3);
    c.save();
    c.translate(22, 12);
    drawGun(c, gun, 1);
    if (muzzle > 0 && shooting) {
      const L = { pistol: 30, smg: 40, rifle: 62, shotgun: 58, launcher: 64, saw: 56, flame: 60, laser: 54 }[WEAPON[gun].family] - 18;
      c.translate(L, -7);
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2,
          r = i % 2 ? 7 : 18;
        c.lineTo(Math.cos(a) * r * 1.3 + 8, Math.sin(a) * r * 0.7);
      }
      c.closePath();
      c.fillStyle = "#ffd23a";
      c.fill();
      c.fillStyle = "#fff6c4";
      ellipse(c, 6, 0, 7, 4);
      c.fill();
    }
    c.restore();
  }
  c.restore();
  c.restore();
}

// ---------------------------------------------------------------- dinosaurs
export const DINO_LOOK = {
  raptor: { body: "#3f63ae", belly: "#6b90d6", stripe: "#94c4f0", spike: "#f3f1e8", scale: 1, head: null },
  horned: { body: "#c39467", belly: "#ddb68b", stripe: "#8a5634", spike: "#f3ead6", scale: 1.05, head: null, horns: true },
  brute: { body: "#6e9853", belly: "#93b874", stripe: "#486b35", spike: "#e9e6cf", scale: 1.5, head: "#e3dfc3" },
};

// state: walk | windup | lunge | latched | stagger | recover. dir 1 = facing right.
export function drawDino(c, d, t = 0) {
  const look = DINO_LOOK[d.type];
  const s = look.scale;
  c.save();
  c.scale(d.dir * s, s);
  const st = d.state;
  const walk = st === "walk" ? Math.sin(d.phase) : st === "lunge" ? Math.sin(d.phase * 2) : 0;
  const crouch = st === "windup" ? 10 : st === "latched" ? 4 : 0;
  const stretch = st === "lunge" ? 1.12 : 1;
  let jaw = 0.18 + Math.max(0, Math.sin(d.phase * 0.7)) * 0.15;
  if (st === "windup" || st === "lunge") jaw = 0.75;
  if (st === "latched") jaw = 0.25 + Math.abs(Math.sin(t * 14 + d.id)) * 0.55;
  if (st === "stagger") jaw = 0.5;
  c.translate(0, crouch);
  // tail
  blob(c, [[-30, -70], [-70, -78], [-112, -92], [-118, -88], [-72, -62], [-28, -52]]);
  inked(c, look.body, 3.5);
  for (let i = 0; i < 4; i++) {
    const x = -44 - i * 18,
      y = -74 - i * 4;
    poly(c, [[x - 6, y], [x, y - 11], [x + 6, y]]);
    inked(c, look.spike, 2);
  }
  // back leg
  const legDraw = (dx, ang, shade) => {
    c.save();
    c.translate(dx, -52);
    c.rotate(ang);
    blob(c, [[-14, -10], [14, -8], [10, 22], [2, 30], [-10, 24]]);
    inked(c, shade, 3);
    poly(c, [[0, 26], [6, 26], [4, 44], [-2, 44]]);
    inked(c, shade, 3);
    blob(c, [[-6, 44], [16, 42], [20, 50], [-8, 50]]);
    inked(c, shade, 3);
    c.restore();
  };
  legDraw(-14, walk * 0.45, look.stripe === "#486b35" ? "#5a8044" : shadeOf(look.body));
  // body
  c.save();
  c.scale(stretch, 1);
  blob(c, [[-40, -78], [-8, -100], [28, -98], [48, -82], [44, -58], [10, -46], [-30, -50]]);
  inked(c, look.body, 3.5);
  // belly
  blob(c, [[-12, -50], [22, -50], [40, -62], [30, -60], [0, -56]]);
  c.fillStyle = look.belly;
  c.fill();
  // stripes
  c.strokeStyle = look.stripe;
  c.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(-26 + i * 15, -92 + i * 1.5);
    c.quadraticCurveTo(-20 + i * 15, -80, -24 + i * 15, -68);
    c.stroke();
  }
  // back spikes
  for (let i = 0; i < 5; i++) {
    const x = -30 + i * 14,
      y = -96 - Math.sin(i * 0.8) * 3;
    poly(c, [[x - 6, y + 3], [x + 1, y - 12], [x + 7, y + 3]]);
    inked(c, look.spike, 2);
  }
  c.restore();
  legDraw(8, -walk * 0.45, look.body);
  // little arms
  c.save();
  c.translate(40, -70);
  c.rotate(0.6 + (st === "latched" ? Math.sin(t * 20) * 0.3 : 0));
  blob(c, [[0, -4], [18, -2], [20, 4], [0, 4]]);
  inked(c, look.body, 2.5);
  c.restore();
  // head
  c.save();
  c.translate(46 * stretch, -92);
  c.rotate(st === "latched" ? 0.25 : st === "lunge" ? -0.1 : 0.05);
  // lower jaw
  c.save();
  c.translate(4, 4);
  c.rotate(jaw);
  blob(c, [[0, -2], [52, 2], [50, 14], [6, 14]]);
  inked(c, look.body, 3);
  poly(c, [[6, 0], [50, 3], [48, 9], [6, 8]]);
  c.fillStyle = "#7a1016";
  c.fill();
  for (let i = 0; i < 6; i++) {
    poly(c, [[10 + i * 7, 2], [13 + i * 7, -6], [16 + i * 7, 2]]);
    inked(c, "#fffdf3", 1.5);
  }
  c.restore();
  // upper head
  const skull = look.head;
  blob(c, [[-8, -26], [24, -34], [58, -18], [62, 2], [8, 6], [-12, -4]]);
  inked(c, skull || look.body, 3.5);
  // mouth interior + upper teeth
  poly(c, [[8, 4], [60, 2], [56, 8], [8, 9]]);
  c.fillStyle = "#7a1016";
  c.fill();
  for (let i = 0; i < 7; i++) {
    poly(c, [[12 + i * 7, 2], [15 + i * 7, 11], [18 + i * 7, 2]]);
    inked(c, "#fffdf3", 1.5);
  }
  if (look.horns) {
    poly(c, [[34, -24], [44, -46], [46, -22]]);
    inked(c, "#f3ead6", 2.5);
    poly(c, [[14, -30], [18, -48], [24, -30]]);
    inked(c, "#f3ead6", 2.5);
  }
  if (!skull) {
    // head spikes
    for (let i = 0; i < 3; i++) {
      poly(c, [[-6 + i * 8, -24], [-10 + i * 8, -36], [0 + i * 8, -28]]);
      inked(c, look.spike, 2);
    }
    // big angry white eye
    ellipse(c, 18, -16, 9, 8);
    inked(c, "#ffffff", 2.5);
    c.fillStyle = INK;
    ellipse(c, 22, -15, 2.4, 2.6);
    c.fill();
    c.beginPath();
    c.moveTo(6, -28);
    c.lineTo(30, -20);
    c.lineWidth = 4;
    c.strokeStyle = INK;
    c.stroke();
  } else {
    // brute: pale skull face with dark sockets and a tiny glint
    ellipse(c, 20, -14, 11, 9);
    inked(c, "#2a2224", 2);
    c.fillStyle = "#ffffff";
    ellipse(c, 23, -15, 2.5, 2.5);
    c.fill();
    ellipse(c, 50, -10, 3, 2.5);
    inked(c, "#2a2224", 1.5);
    blob(c, [[-6, -24], [-14, -10], [-8, 2], [-2, -10]]);
    inked(c, look.body, 2.5);
  }
  c.restore();
  c.restore();
}

function shadeOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * 0.8));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// a headless body slumped on its side
export function drawCorpse(c, type, dir, burnt) {
  const look = DINO_LOOK[type];
  c.save();
  c.scale(dir * look.scale, look.scale);
  const col = burnt ? "#3a3030" : look.body;
  // a leg kicked up in the air, then the slumped body and tail
  c.save();
  c.translate(-6, -40);
  c.rotate(-0.5);
  blob(c, [[-8, 0], [8, 0], [10, -34], [2, -40], [-8, -32]]);
  inked(c, col, 3);
  blob(c, [[-6, -38], [14, -46], [18, -40], [-2, -32]]);
  inked(c, col, 2.5);
  c.restore();
  blob(c, [[-104, -10], [-60, -20], [-34, -48], [6, -62], [38, -50], [48, -26], [40, -4], [-40, -2], [-100, -4]]);
  inked(c, col, 3.5);
  if (!burnt) {
    c.strokeStyle = look.stripe;
    c.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-18 + i * 16, -52 + i * 2);
      c.quadraticCurveTo(-14 + i * 16, -36, -18 + i * 16, -14);
      c.stroke();
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = -24 + i * 14,
      y = -56 - Math.sin(i) * 4;
    poly(c, [[x - 6, y + 4], [x, y - 8], [x + 6, y + 4]]);
    inked(c, look.spike, 2);
  }
  ellipse(c, 44, -20, 10, 13);
  inked(c, "#9b1119", 2.5);
  ellipse(c, 46, -20, 5, 7);
  c.fillStyle = "#e9dcc6";
  c.fill();
  blob(c, [[-10, -8], [8, -10], [16, 2], [-12, 2]]);
  inked(c, col, 2.5);
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
    c.fill();
    c.beginPath();
    c.moveTo(-8, 0);
    c.quadraticCurveTo(-14, 4, -18, 1);
    c.lineWidth = 3;
    c.strokeStyle = "#b0141c";
    c.stroke();
  } else if (kind === "head") {
    const look = DINO_LOOK[type] || DINO_LOOK.raptor;
    blob(c, [[-18, -10], [8, -16], [26, -6], [24, 8], [-16, 8]]);
    inked(c, look.head || look.body, 3);
    ellipse(c, -16, 0, 7, 9);
    inked(c, "#9b1119", 2.5);
    c.beginPath();
    c.moveTo(4, -8);
    c.lineTo(10, -2);
    c.moveTo(10, -8);
    c.lineTo(4, -2);
    c.lineWidth = 2.5;
    c.strokeStyle = INK;
    c.stroke();
  } else {
    const r = (k) => ((Math.sin(seed * 13.7 + k * 3.1) + 1) / 2) * 4;
    blob(c, [[-10 - r(1), -4], [-2, -9 - r(2)], [10 + r(3), -5], [9, 6 + r(4)], [-6, 8]]);
    inked(c, "#c4323a", 2.5);
    ellipse(c, 0, -1, 4, 2.5);
    c.fillStyle = "#f0a3a3";
    c.fill();
    poly(c, [[3, 2], [12, 0], [12, 3], [3, 4]]);
    inked(c, "#f1ead6", 1.5);
  }
  c.restore();
}

export function drawPool(c, size, seed) {
  c.save();
  c.scale(size, size);
  const r = (k) => ((Math.sin(seed * 9.1 + k * 2.3) + 1) / 2) * 10;
  c.fillStyle = "#8f0f17";
  blob(c, [[-46 - r(1), 0], [-20, -6 - r(2) * 0.3], [10, -7], [40 + r(3), -2], [34, 5], [0, 7 + r(4) * 0.3], [-36, 5]]);
  c.fill();
  c.fillStyle = "#c4252e";
  ellipse(c, -6, -1, 16, 2.5);
  c.fill();
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
    c.fill();
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
