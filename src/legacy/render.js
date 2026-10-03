import { BIOMES, WEAPONS } from "./data.js";
export const VIEW = { width: 1080, height: 608, ground: 430 };
const INK = "#0b181b";
function random(seed) {
  let n = seed;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
function shape(c, points, fill, stroke = INK, width = 3) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
function ellipse(c, x, y, rx, ry, fill, stroke = INK, width = 3, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
function rect(c, x, y, w, h, fill, stroke = INK, width = 3, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
function line(c, points, color = INK, width = 3) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}
export function drawWeapon(c, index, x = 0, y = 0, size = 1) {
  const w = WEAPONS[index] || WEAPONS[1];
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  const metal = w.color;
  if (w.family === "melee") {
    if (w.id === "sword") {
      c.shadowBlur = 12;
      c.shadowColor = "#8dff73";
      rect(c, 0, -65, 8, 68, "#b2ff86", INK, 2, 4);
      c.shadowBlur = 0;
      rect(c, -3, 2, 13, 17, "#858c93", INK, 3, 2);
    } else if (w.id === "crate") {
      rect(c, -23, -54, 60, 48, "#bc7548", INK, 4, 3);
      rect(c, -20, -50, 8, 40, "#b7b2a0");
      rect(c, 24, -50, 8, 40, "#b7b2a0");
      line(
        c,
        [
          [-10, -37],
          [19, -37],
        ],
        "#693e2a",
        3,
      );
      c.fillStyle = "#2c1e1b";
      c.font = "900 12px sans-serif";
      c.fillText("TNT", -10, -19);
    } else if (w.id === "axe") {
      rect(c, -2, -60, 7, 80, "#966340");
      shape(
        c,
        [
          [2, -55],
          [30, -55],
          [34, -38],
          [5, -35],
        ],
        "#adb9be",
      );
      shape(
        c,
        [
          [2, -55],
          [-16, -54],
          [-18, -41],
          [2, -37],
        ],
        "#d85449",
      );
    } else if (w.id === "chainsaw") {
      rect(c, -8, -30, 34, 26, "#d6b545", INK, 3, 4);
      rect(c, 22, -27, 45, 18, "#c9d0c3", INK, 3, 8);
      line(
        c,
        [
          [29, -18],
          [55, -18],
        ],
        "#687b7a",
        3,
      );
    } else if (w.id === "crowbar") {
      line(
        c,
        [
          [0, 16],
          [0, -44],
          [12, -54],
        ],
        INK,
        9,
      );
      line(
        c,
        [
          [0, 16],
          [0, -44],
          [12, -54],
        ],
        metal,
        5,
      );
    } else {
      rect(c, -2, -28, 9, 46, "#9b6543", INK, 3, 2);
      rect(c, -10, -60, 25, 39, "#816149", INK, 3, 5);
      for (let i = 0; i < 3; i++) {
        shape(
          c,
          [
            [-10, -54 + i * 12],
            [-20, -58 + i * 12],
            [-10, -45 + i * 12],
          ],
          "#d6d5c5",
        );
        shape(
          c,
          [
            [15, -54 + i * 12],
            [24, -58 + i * 12],
            [15, -45 + i * 12],
          ],
          "#d6d5c5",
        );
      }
    }
  } else if (w.family === "saw") {
    ellipse(c, 20, -14, 19, 19, "#aebbc0");
    for (let i = 0; i < 8; i++) {
      c.save();
      c.translate(20, -14);
      c.rotate((i * Math.PI) / 4);
      shape(
        c,
        [
          [13, -4],
          [25, 0],
          [13, 5],
        ],
        "#b6c3c7",
      );
      c.restore();
    }
    ellipse(c, 20, -14, 5, 5, "#455c61");
  } else if (w.family === "force") {
    ellipse(c, 20, -16, 17, 17, "#72bee8aa", "#b4f3ff", 2);
    ellipse(c, 20, -16, 8, 8, "#d1f5ff", null);
  } else {
    const long = [
      "shotgun",
      "rifle",
      "smg",
      "launcher",
      "flame",
      "laser",
    ].includes(w.family);
    const len = w.family === "launcher" ? 76 : long ? 65 : 36;
    rect(c, -12, -25, long ? 22 : 18, 13, "#7d5a42");
    rect(c, 3, -25, len, 14, metal, INK, 3, 2);
    rect(c, 6, -13, 12, 21, "#5b655f");
    rect(c, len + 2, -22, 11, 8, "#4a6168", INK, 3);
    line(
      c,
      [
        [10, -22],
        [len - 4, -22],
      ],
      "#d7e0cd",
      2,
    );
    if (long) {
      rect(c, 35, -12, 9, 18, "#8f978c", INK, 2);
      rect(c, 23, -8, 9, 5, INK, null);
      for (let i = 0; i < 4; i++)
        line(
          c,
          [
            [44 + i * 4, -23],
            [44 + i * 4, -14],
          ],
          "#4b605e",
          1.5,
        );
    }
    if (w.family === "flame") rect(c, -10, -24, 17, 29, "#e0a345", INK, 3, 4);
    if (w.family === "laser") {
      rect(c, 26, -29, 22, 5, "#8feae2");
      line(
        c,
        [
          [25, -14],
          [55, -14],
        ],
        "#80e8e4",
        3,
      );
    }
  }
  c.restore();
}
export function drawHero(
  c,
  x,
  y,
  hero = "kid",
  weapon = 1,
  facing = 1,
  time = 0,
  moving = false,
  attack = 0,
  flash = 0,
) {
  c.save();
  c.translate(x, y);
  c.scale(facing || 1, 1);
  c.lineJoin = "round";
  c.lineCap = "round";
  const step = moving ? Math.sin(time * 15) * 6 : Math.sin(time * 3) * 0.6;
  const isGirl = hero === "girl",
    isNinja = hero === "ninja",
    isKnight = hero === "knight",
    isSoldier = hero === "soldier";
  const skin =
    flash > 0
      ? "#f86562"
      : isGirl
        ? "#f5cebb"
        : isSoldier
          ? "#d6ad8c"
          : isNinja
            ? "#c49379"
            : isKnight
              ? "#deb197"
              : "#835d49";
  ellipse(c, 0, 0, 29, 5, "#11251f55", null);
  if (isGirl) {
    shape(
      c,
      [
        [-21, -73],
        [-29, -10],
        [-3, -18],
        [22, -17],
        [21, -69],
      ],
      "#1c1d25",
    );
  }
  if (isKnight)
    shape(
      c,
      [
        [-25, -66],
        [-34, -8],
        [24, -7],
        [17, -61],
      ],
      "#8c775a",
    );
  const cloth = isGirl
    ? "#eee9d7"
    : isNinja
      ? "#403544"
      : isKnight
        ? "#c6b798"
        : isSoldier
          ? "#a4a48b"
          : "#d2d5cb";
  shape(
    c,
    [
      [-16, -21],
      [-17 + step, -6],
      [-6 + step, -5],
      [-3, -22],
    ],
    isGirl ? "#efe9d7" : "#67716a",
  );
  shape(
    c,
    [
      [3, -22],
      [5 - step, -7],
      [17 - step, -5],
      [18, -23],
    ],
    isGirl ? "#efe9d7" : "#626b68",
  );
  rect(c, -20 + step, -7, 19, 8, isGirl ? "#835744" : "#3f4140", INK, 3, 2);
  rect(c, 2 - step, -7, 20, 8, isGirl ? "#835744" : "#3f4140", INK, 3, 2);
  shape(
    c,
    [
      [-14, -46],
      [14, -46],
      [22, -20],
      [-19, -20],
    ],
    cloth,
  );
  if (isGirl) {
    shape(
      c,
      [
        [-11, -31],
        [16, -31],
        [23, -17],
        [-22, -17],
      ],
      "#edebd9",
    );
    line(
      c,
      [
        [-5, -45],
        [2, -34],
        [12, -44],
      ],
      "#b3b498",
      2,
    );
  } else {
    line(
      c,
      [
        [-10, -40],
        [9, -24],
      ],
      isNinja
        ? "#be4a47"
        : isKnight
          ? "#796246"
          : isSoldier
            ? "#686d56"
            : "#d14235",
      5,
    );
    rect(c, -16, -27, 33, 6, isNinja ? "#b55141" : "#917251", INK, 2);
    rect(c, -5, -27, 8, 6, "#d5bd80", INK, 1.5);
  }
  ellipse(c, -20, -54, 7, 10, skin);
  ellipse(c, 0, -63, 28, 29, skin, INK, 3.5);
  ellipse(c, 23, -53, 6, 7, skin);
  line(
    c,
    [
      [25, -53],
      [22, -51],
    ],
    "#744c40",
    1.5,
  );
  if (isSoldier) {
    c.beginPath();
    c.moveTo(-30, -65);
    c.quadraticCurveTo(-32, -98, 0, -96);
    c.quadraticCurveTo(31, -93, 31, -66);
    c.closePath();
    c.fillStyle = "#b4af93";
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 3.5;
    c.stroke();
    shape(
      c,
      [
        [-31, -66],
        [-9, -76],
        [31, -70],
        [34, -63],
        [-28, -58],
      ],
      "#a89e84",
    );
    rect(c, -18, -77, 35, 10, "#6a7672", INK, 3, 3);
    line(
      c,
      [
        [-10, -75],
        [-3, -70],
        [5, -75],
        [10, -70],
      ],
      "#d2d4bc",
      2,
    );
  } else if (isNinja) {
    c.beginPath();
    c.arc(0, -67, 29, Math.PI, Math.PI * 2);
    c.lineTo(27, -59);
    c.lineTo(-27, -59);
    c.closePath();
    c.fillStyle = "#413846";
    c.fill();
    c.stroke();
    shape(
      c,
      [
        [-28, -49],
        [25, -49],
        [18, -34],
        [-16, -35],
      ],
      "#332d39",
    );
    shape(
      c,
      [
        [-27, -64],
        [23, -65],
        [25, -59],
        [-27, -58],
      ],
      "#7d5455",
    );
    shape(
      c,
      [
        [-26, -60],
        [-46, -50],
        [-37, -46],
        [-22, -55],
      ],
      "#684952",
    );
  } else if (isKnight) {
    c.beginPath();
    c.arc(0, -66, 29, Math.PI, Math.PI * 2);
    c.lineTo(27, -50);
    c.lineTo(18, -70);
    c.lineTo(-20, -70);
    c.lineTo(-29, -48);
    c.closePath();
    c.fillStyle = "#594534";
    c.fill();
    c.stroke();
  } else {
    c.beginPath();
    c.moveTo(-27, -56);
    c.lineTo(-28, -76);
    c.bezierCurveTo(-24, -100, 23, -100, 27, -77);
    c.lineTo(26, -59);
    c.lineTo(17, -76);
    c.lineTo(5, -72);
    c.lineTo(-7, -77);
    c.lineTo(-18, -65);
    c.lineTo(-18, -52);
    c.closePath();
    c.fillStyle = "#171a21";
    c.fill();
    c.strokeStyle = INK;
    c.stroke();
    if (isGirl) {
      line(
        c,
        [
          [-23, -77],
          [20, -81],
        ],
        "#eeeedd",
        4,
      );
      shape(
        c,
        [
          [-22, -82],
          [-45, -104],
          [-43, -86],
          [-27, -79],
        ],
        "#f3f1df",
      );
      shape(
        c,
        [
          [-23, -84],
          [-14, -111],
          [-7, -99],
          [-18, -81],
        ],
        "#f3f1df",
      );
      line(
        c,
        [
          [-39, -96],
          [-24, -83],
          [-14, -101],
        ],
        "#a7aca0",
        1.5,
      );
    }
  }
  // Oversized expressive eyes are the defining chibi silhouette.
  ellipse(c, -6, -57, 7, 9, "#f6f4dc", INK, 2);
  ellipse(c, 15, -58, 7, 9, "#f6f4dc", INK, 2);
  ellipse(c, -3, -57, 3.5, 6, "#101a20", null);
  ellipse(c, 18, -58, 3.5, 6, "#101a20", null);
  ellipse(c, -2, -60, 1.3, 2, "#fff", null);
  ellipse(c, 19, -61, 1.3, 2, "#fff", null);
  line(
    c,
    [
      [-13, -68],
      [1, -65],
    ],
    INK,
    2.8,
  );
  line(
    c,
    [
      [9, -66],
      [23, -70],
    ],
    INK,
    2.8,
  );
  if (!isNinja) {
    line(
      c,
      [
        [6, -42],
        [15, -44],
      ],
      "#422d29",
      2,
    );
    ellipse(c, 3, -49, 2, 1.5, "#765344", null);
    if (isGirl) {
      ellipse(c, -14, -47, 4, 2, "#e79791", null);
      ellipse(c, 22, -48, 3, 2, "#e79791", null);
    }
  }
  ellipse(c, -15, -37, 6, 8, skin);
  c.save();
  c.translate(14, -31);
  if (WEAPONS[weapon]?.family === "melee")
    c.rotate(attack > 0 ? -0.9 + attack * 5 : -0.18);
  else c.rotate(attack > 0 ? -0.08 : 0);
  drawWeapon(c, weapon, 5, -1, 0.75);
  ellipse(c, 9, -11, 6, 5, skin);
  c.restore();
  c.restore();
}
export function drawDino(
  c,
  x,
  y,
  type = 0,
  facing = 1,
  t = 0,
  flash = 0,
  armored = false,
  attacking = false,
) {
  c.save();
  c.translate(x, y);
  const scale = type === 1 ? 1.5 : type === 2 ? 1 : 0.84;
  c.scale(scale * (facing || 1), scale);
  c.lineJoin = "round";
  const skin = flash > 0 ? "#f74637" : ["#d0aa7b", "#9ba965", "#648da7"][type];
  const dark = flash > 0 ? "#c82b25" : ["#986e51", "#667948", "#395d78"][type];
  ellipse(c, -3, 0, 51, 6, "#14232266", null);
  const step = Math.sin(t * 10 + x) * 4;
  // Tail, powerful rear legs, and hunched body.
  shape(
    c,
    [
      [-25, -29],
      [-65, -27],
      [-106, -48],
      [-79, -42],
      [-53, -44],
      [-28, -56],
    ],
    skin,
    INK,
    3.5,
  );
  for (let i = 0; i < 2; i++) {
    const dx = i * 26;
    shape(
      c,
      [
        [-25 + dx, -30],
        [-36 + dx, -16],
        [-29 + dx + step * (i ? 1 : -1), -4],
        [-9 + dx + step * (i ? 1 : -1), -2],
        [-9 + dx, -11],
        [-17 + dx, -17],
        [-7 + dx, -33],
      ],
      dark,
    );
    for (let j = 0; j < 3; j++)
      shape(
        c,
        [
          [-16 + dx + j * 5 + step * (i ? 1 : -1), -6],
          [-9 + dx + j * 5 + step * (i ? 1 : -1), -2],
          [-15 + dx + j * 5 + step * (i ? 1 : -1), 1],
        ],
        "#e6ded0",
        INK,
        1.5,
      );
  }
  c.beginPath();
  c.moveTo(-36, -37);
  c.bezierCurveTo(-41, -76, -11, -99, 21, -89);
  c.bezierCurveTo(53, -86, 40, -51, 22, -33);
  c.quadraticCurveTo(-7, -22, -36, -37);
  c.fillStyle = skin;
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 3.5;
  c.stroke();
  ellipse(c, 7, -49, 17, 21, type === 2 ? "#b4b1a3" : "#ddc4a0", INK, 2, 0.4);
  // Angular predatory head and an open, tooth-filled jaw.
  shape(
    c,
    [
      [0, -81],
      [13, -109],
      [40, -115],
      [49, -106],
      [70, -101],
      [79, -87],
      [73, -72],
      [34, -66],
      [20, -71],
    ],
    skin,
    INK,
    3.5,
  );
  shape(
    c,
    [
      [27, -68],
      [73, -74],
      [62, -49],
      [37, -49],
      [21, -60],
    ],
    "#6d2936",
    INK,
    3.5,
  );
  shape(
    c,
    [
      [24, -53],
      [63, -49],
      [69, -55],
      [76, -58],
      [68, -41],
      [37, -40],
      [19, -52],
    ],
    skin,
    INK,
    3.5,
  );
  for (let i = 0; i < 6; i++) {
    shape(
      c,
      [
        [31 + i * 7, -69 - i * 0.6],
        [35 + i * 7, -56 - i * 0.6],
        [38 + i * 7, -70 - i * 0.6],
      ],
      "#f4edda",
      INK,
      1.2,
    );
    if (i < 4)
      shape(
        c,
        [
          [35 + i * 8, -43],
          [38 + i * 8, -52],
          [42 + i * 8, -43],
        ],
        "#f4edda",
        INK,
        1.2,
      );
  }
  ellipse(c, 37, -94, 10, 11, "#e9e9cb", INK, 2);
  ellipse(c, 42, -96, 3.5, 7, "#0b171c", null);
  shape(
    c,
    [
      [21, -111],
      [47, -109],
      [45, -99],
      [25, -103],
    ],
    dark,
    INK,
    2,
  );
  ellipse(c, 67, -94, 2, 2, INK, null);
  for (let i = 0; i < 6; i++) {
    const sx = -34 + i * 10,
      sy = -63 - Math.sin((i / 5) * Math.PI) * 28;
    shape(
      c,
      [
        [sx - 3, sy],
        [sx - 7, sy - 15],
        [sx + 7, sy - 3],
      ],
      type === 2 ? "#bac5c7" : "#93674a",
      INK,
      2,
    );
  }
  for (let i = 0; i < 6; i++) {
    const sx = -26 + i * 9,
      sy = -56 - Math.sin(i) * 9;
    shape(
      c,
      [
        [sx, sy],
        [sx + 3, sy - 10],
        [sx + 6, sy + 3],
      ],
      dark,
      null,
    );
  }
  shape(
    c,
    [
      [17, -63],
      [34, -56],
      [38, -41],
      [30, -40],
      [25, -51],
      [14, -53],
    ],
    skin,
  );
  for (let i = 0; i < 3; i++)
    shape(
      c,
      [
        [29 + i * 4, -43],
        [32 + i * 4, -33],
        [35 + i * 4, -43],
      ],
      "#e9e3d1",
      INK,
      1.2,
    );
  if (armored) {
    for (let i = 0; i < 4; i++) {
      c.save();
      c.translate(-26 + i * 17, -70 - Math.sin(i) * 13);
      c.rotate(-0.25 + i * 0.12);
      rect(c, -7, -9, 15, 20, "#94a6ae", INK, 3, 2);
      line(
        c,
        [
          [-4, -4],
          [5, -4],
        ],
        "#d2dde0",
        2,
      );
      ellipse(c, 0, 7, 1.6, 1.6, "#32434c", null);
      c.restore();
    }
    shape(
      c,
      [
        [12, -116],
        [42, -123],
        [55, -105],
        [40, -103],
        [24, -87],
        [7, -96],
      ],
      "#b3c1c5",
      INK,
      3,
    );
    shape(
      c,
      [
        [31, -115],
        [43, -108],
        [36, -101],
      ],
      "#293c46",
    );
    rect(c, 18, -54, 26, 12, "#be6b57", INK, 2, 3);
  }
  if (attacking) {
    line(
      c,
      [
        [71, -78],
        [83, -75],
      ],
      "#e8e1ad",
      3,
    );
  }
  c.restore();
}
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d");
    this.cache = {};
    this.biome = "jungle";
    this.prepare("jungle");
  }
  prepare(id) {
    this.biome = id;
    if (this.cache[id]) return;
    const layers = [];
    for (let depth = 0; depth < 3; depth++) {
      const layer = document.createElement("canvas");
      layer.width = 1600;
      layer.height = 608;
      this.paintLayer(layer.getContext("2d"), id, depth);
      layers.push(layer);
    }
    this.cache[id] = layers;
  }
  paintLayer(c, id, depth) {
    const rng = random(320 + depth * 163 + id.length * 91);
    const forest = ["jungle", "blossom", "snow"].includes(id);
    if (id === "city") {
      const cols = ["#434d60", "#46546a", "#526278"];
      for (let x = -50; x < 1700; x += 70 + rng() * 90) {
        let w = 60 + rng() * 85,
          h = 110 + rng() * 230;
        c.fillStyle = cols[depth];
        c.fillRect(x, 420 - h, w, h);
        shape(
          c,
          [
            [x, 420 - h],
            [x + 10, 410 - h],
            [x + w * 0.5, 410 - h],
            [x + w * 0.5, 420 - h],
          ],
          cols[depth],
          null,
        );
        if (depth > 0) {
          for (let y = 430 - h; y < 405; y += 18)
            for (let dx = 8; dx < w - 8; dx += 15) {
              c.fillStyle = rng() > 0.8 ? "#a7b2ab" : "#28384b";
              c.fillRect(x + dx, y, 5, 8);
            }
        }
      }
      return;
    }
    if (id === "waste" || id === "cave") {
      for (let x = -70; x < 1750; x += 120) {
        const top = (id === "cave" ? 30 : 130) + rng() * 160;
        shape(
          c,
          [
            [x, 420],
            [x + 15, top + 80],
            [x + 50, top],
            [x + 85, top + 40],
            [x + 135, top + 15],
            [x + 190, 420],
          ],
          ["#3e3443", "#524044", "#5e4634"][depth],
          depth === 2 ? "#332821" : null,
          3,
        );
        if (id === "cave") {
          shape(
            c,
            [
              [x, -10],
              [x + 45, 190 + rng() * 100],
              [x + 65, 90],
              [x + 95, 150],
              [x + 135, -10],
            ],
            ["#36291e", "#4c3825", "#5e4128"][depth],
            depth === 2 ? "#30251c" : null,
            3,
          );
          line(
            c,
            [
              [x + 50, 180],
              [x + 42, 55],
              [x + 65, 15],
            ],
            "#98714940",
            3,
          );
        }
      }
      return;
    }
    const trunks =
      id === "snow"
        ? ["#7b939b", "#63858c", "#365d65"]
        : id === "blossom"
          ? ["#6a9b7d", "#557e56", "#777c45"]
          : ["#477b77", "#315f5c", "#244d45"];
    for (let i = 0; i < 15; i++) {
      const x = i * 118 + rng() * 70,
        w = 18 + depth * 9,
        h = 420;
      const bent = (rng() - 0.5) * 80;
      c.beginPath();
      c.moveTo(x - 18, 430);
      c.bezierCurveTo(x + 30, 300, x - 20, 180, x + bent, -20);
      c.lineTo(x + w + bent, -20);
      c.bezierCurveTo(x + w - 15, 150, x + w + 30, 310, x + w + 28, 430);
      c.closePath();
      c.fillStyle = trunks[depth];
      c.fill();
      if (depth > 0) {
        c.lineWidth = depth === 2 ? 3 : 1;
        c.strokeStyle = id === "jungle" ? "#163c36" : "#304a39";
        c.stroke();
        line(
          c,
          [
            [x + 12, 410],
            [x + 19, 280],
            [x + 7, 150],
            [x + bent + 9, 0],
          ],
          id === "snow" ? "#acced040" : "#6fa08155",
          4,
        );
        for (let j = 0; j < 4; j++) {
          const yy = 80 + j * 65;
          c.beginPath();
          c.moveTo(x + w * 0.5, yy);
          c.quadraticCurveTo(
            x + (j % 2 ? 100 : -100),
            yy - 10,
            x + (j % 2 ? 180 : -180),
            yy - 75,
          );
          c.strokeStyle = trunks[depth];
          c.lineWidth = 15 - j * 2;
          c.stroke();
          if (depth === 2) {
            c.lineWidth = 3;
            c.strokeStyle = "#163b32";
            c.stroke();
          }
        }
      }
      if (id === "jungle") {
        for (let j = 0; j < 4; j++)
          ellipse(
            c,
            x + (j - 2) * 42,
            5 + j * 23,
            91,
            35,
            ["#23594b", "#1b483d", "#183c33"][depth],
            null,
            0,
            j * 0.6,
          );
      }
      if (id === "blossom") {
        const colors = ["#8ebc85", "#c797a0", "#e1a5b8"];
        for (let j = 0; j < 7; j++)
          shape(
            c,
            [
              [x + (j % 3) * 33 - 50, 45 + (j % 2) * 40],
              [x + (j % 3) * 33 - 70, 15 + (j % 2) * 40],
              [x + (j % 3) * 33 - 39, -3 + (j % 2) * 40],
              [x + (j % 3) * 33 - 6, 8 + (j % 2) * 40],
              [x + (j % 3) * 33 + 11, 45 + (j % 2) * 40],
            ],
            colors[depth],
            depth === 2 ? "#9e727d" : null,
            2,
          );
      }
      if (id === "snow") {
        for (let j = 0; j < 5; j++) {
          shape(
            c,
            [
              [x - 55 + j * 5, 90 + j * 48],
              [x + 10, 15 + j * 48],
              [x + 85 - j * 5, 90 + j * 48],
            ],
            "#446d69",
            INK,
            1,
          );
          shape(
            c,
            [
              [x - 55 + j * 5, 90 + j * 48],
              [x + 10, 15 + j * 48],
              [x + 57 - j * 5, 65 + j * 48],
              [x + 7, 52 + j * 48],
            ],
            "#d2e5df",
            null,
          );
        }
      }
    }
    if (id === "jungle" && depth === 2) {
      for (let i = 0; i < 14; i++) {
        const x = i * 120;
        c.strokeStyle = "#102c2a";
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(x, 0);
        c.bezierCurveTo(x - 40, 80, x + 45, 150, x + 12, 280);
        c.stroke();
        for (let j = 0; j < 5; j++)
          this.leaf(
            c,
            x + Math.sin(j) * 15,
            90 + j * 33,
            18,
            0.7 * (j % 2 ? 1 : -1),
            "#335f45",
          );
      }
      for (let i = 0; i < 3; i++) {
        const x = i * 420 + 220;
        line(
          c,
          [
            [x, 420],
            [x - 15, 350],
            [x + 12, 311],
          ],
          "#164637",
          5,
        );
        ellipse(c, x + 13, 305, 15, 25, "#a84981", INK, 3, -0.2);
        for (let j = 0; j < 6; j++)
          ellipse(
            c,
            x + 8 + (j % 2) * 9,
            289 + Math.floor(j / 2) * 13,
            3.2,
            3,
            "#642d68",
            INK,
            1,
          );
        this.leaf(c, x, 382, 56, -1, "#276d58");
        this.leaf(c, x, 384, 65, 0.9, "#31795c");
      }
    }
  }
  leaf(c, x, y, size, angle, fill, outline = true) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    shape(
      c,
      [
        [0, 0],
        [-size * 0.12, -size * 0.3],
        [-size * 0.29, -size * 0.42],
        [-size * 0.17, -size * 0.53],
        [-size * 0.23, -size * 0.7],
        [-size * 0.07, -size * 0.72],
        [0, -size],
        [size * 0.18, -size * 0.73],
        [size * 0.12, -size * 0.62],
        [size * 0.27, -size * 0.48],
        [size * 0.16, -size * 0.38],
        [size * 0.18, -size * 0.2],
      ],
      fill,
      outline ? INK : null,
      2,
    );
    line(
      c,
      [
        [0, 0],
        [0, -size * 0.89],
      ],
      "#74a08460",
      1.3,
    );
    c.restore();
  }
  background(camera, t) {
    const c = this.c;
    const biome = BIOMES.find((b) => b.id === this.biome);
    const g = c.createLinearGradient(0, 0, 0, 608);
    g.addColorStop(0, biome.sky[0]);
    g.addColorStop(1, biome.sky[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, 1080, 608);
    for (let i = 0; i < 3; i++) {
      const offset = (camera * [0.1, 0.25, 0.48][i]) % 1600;
      const layer = this.cache[this.biome][i];
      c.drawImage(layer, -offset, 0);
      c.drawImage(layer, 1600 - offset, 0);
    }
    if (this.biome === "city") {
      const offset = (camera * 0.7) % 900;
      for (let x = -offset - 100; x < 1300; x += 420) {
        line(
          c,
          [
            [x, 431],
            [x, 222],
          ],
          "#202f3c",
          6,
        );
        ellipse(c, x, 216, 10, 15, "#e4ead5", "#233540", 3);
        c.shadowColor = "#e5eecb";
        c.shadowBlur = 16;
        ellipse(c, x, 216, 6, 9, "#f1f5db", null);
        c.shadowBlur = 0;
      }
    }
    if (this.biome === "blossom") {
      const x = 820 - ((camera * 0.5) % 1600);
      rect(c, x, 269, 275, 152, "#d4d3b0");
      shape(
        c,
        [
          [x - 25, 275],
          [x + 18, 212],
          [x + 75, 229],
          [x + 136, 215],
          [x + 225, 230],
          [x + 273, 215],
          [x + 305, 275],
        ],
        "#77704c",
      );
      for (let j = 0; j < 5; j++)
        rect(c, x + j * 58, 279, 7, 140, "#6a6343", INK, 2);
      rect(c, x + 25, 310, 58, 62, "#ebe3c9");
      line(
        c,
        [
          [x + 25, 341],
          [x + 83, 341],
        ],
        "#625e45",
        3,
      );
      rect(c, x + 122, 332, 60, 89, "#536452");
    }
    // Dark jagged shrubs behind the walkway.
    if (["jungle", "blossom", "snow"].includes(this.biome)) {
      for (let i = -1; i < 35; i++) {
        const x = i * 36 - ((camera * 0.62) % 36);
        const col =
          this.biome === "snow"
            ? "#4c7976"
            : this.biome === "blossom"
              ? "#416a46"
              : "#205751";
        this.leaf(c, x, 433, 51 + (i % 4) * 10, -0.8, col);
        this.leaf(c, x + 6, 430, 58, 0.65, col);
      }
    }
    c.fillStyle = biome.ground;
    c.fillRect(0, VIEW.ground, 1080, 178);
    line(
      c,
      [
        [0, VIEW.ground],
        [1080, VIEW.ground],
      ],
      "#172a22",
      3,
    );
    c.fillStyle = this.biome === "city" ? "#697a80" : "#496d4055";
    c.fillRect(0, VIEW.ground + 28, 1080, 30);
    for (let i = 0; i < 75; i++) {
      const x = i * 37 - ((camera * 0.9) % 37);
      const y = 434 + ((i * 13) % 51);
      if (this.biome === "city") {
        if (i % 5 === 0) rect(c, x, y, 28, 3, "#d7d2b4", null);
        if (i % 17 === 0)
          shape(
            c,
            [
              [x, y],
              [x + 20, y - 7],
              [x + 30, y + 13],
              [x + 9, y + 20],
            ],
            "#cccbc1",
            INK,
            1,
          );
      } else if (i % 3 === 0)
        ellipse(
          c,
          x,
          y,
          13,
          5,
          this.biome === "snow" ? "#eef5ec" : "#a2b37c",
          "#5c715b",
          1.5,
        );
      else
        line(
          c,
          [
            [x, y],
            [x - 3, y - 7],
            [x + 1, y - 4],
            [x + 3, y - 9],
          ],
          "#38583e",
          1.5,
        );
    }
  }
  foreground(camera, t) {
    const c = this.c;
    if (this.biome === "city") {
      c.fillStyle = "#7b817e";
      c.fillRect(0, 522, 1080, 86);
      line(
        c,
        [
          [0, 527],
          [1080, 527],
        ],
        "#424e53",
        3,
      );
      for (let i = 0; i < 7; i++)
        rect(c, i * 210 - ((camera * 0.8) % 210), 567, 90, 5, "#c6c7b6", null);
      return;
    }
    if (this.biome === "cave" || this.biome === "waste") {
      for (let i = -1; i < 15; i++) {
        let x = i * 100 - ((camera * 0.78) % 100);
        shape(
          c,
          [
            [x, 608],
            [x + 4, 553 - (i % 3) * 12],
            [x + 32, 544],
            [x + 68, 564],
            [x + 110, 608],
          ],
          this.biome === "cave" ? "#34251e" : "#323330",
          INK,
          3,
        );
      }
      return;
    }
    for (let i = -2; i < 23; i++) {
      const x = i * 58 - ((camera * 0.78) % 58);
      const col =
        this.biome === "snow"
          ? "#315e60"
          : this.biome === "blossom"
            ? "#213f35"
            : "#153c36";
      this.leaf(c, x, 630, 100 + (i % 4) * 25, -0.65, col);
      this.leaf(c, x + 10, 645, 115, 0.8, col);
      this.leaf(
        c,
        x + 15,
        640,
        110,
        0.1,
        this.biome === "snow" ? "#88aaa4" : "#244d42",
      );
    }
    if (this.biome === "waste" || this.biome === "cave") return;
    for (let i = 0; i < 14; i++) {
      const x = (i * 197 + Math.sin(t + i) * 10) % 1080,
        y = 120 + ((i * 51) % 230);
      c.globalAlpha = 0.3 + Math.sin(t + i) * 0.18;
      ellipse(c, x, y, 1.5, 1.5, "#eef2b1", null);
    }
    c.globalAlpha = 1;
  }
  draw(g, t) {
    const c = this.c,
      r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2),
      width = Math.round(r.width * dpr),
      height = Math.round(r.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    c.setTransform(width / 1080, 0, 0, height / 608, 0, 0);
    this.prepare(g.biome);
    this.background(g.camera, t);
    for (const corpse of g.corpses) {
      const x = corpse.x - g.camera;
      ellipse(c, x, 430, 25 + corpse.type * 8, 3, "#af2829", INK, 1.5);
      shape(
        c,
        [
          [x - 12, 429],
          [x - 15, 424],
          [x - 8, 423],
          [x - 3, 427],
          [x + 10, 424],
          [x + 14, 429],
        ],
        "#e8debb",
        INK,
        1,
      );
    }
    if (g.mode === "city") {
      // A world-space store stays aligned with its interactable doorway.
      const x = 1050 - g.camera;
      rect(c, x - 135, 304, 270, 126, "#727a6b", INK, 4);
      shape(
        c,
        [
          [x - 150, 306],
          [x, 274],
          [x + 150, 306],
        ],
        "#495b53",
        INK,
        4,
      );
      rect(c, x - 124, 295, 248, 35, "#995639", INK, 4, 2);
      c.fillStyle = "#f2e1a8";
      c.font = "900 26px Barlow Condensed, sans-serif";
      c.textAlign = "center";
      c.fillText("AMMO COUNTRY", x, 322);
      rect(c, x - 26, 352, 52, 78, "#2e4348", INK, 3);
      rect(c, x - 105, 350, 51, 50, "#aeb6a4", INK, 3);
      rect(c, x + 54, 350, 51, 50, "#aeb6a4", INK, 3);
      line(
        c,
        [
          [x - 80, 351],
          [x - 80, 399],
        ],
        "#465c54",
        3,
      );
      line(
        c,
        [
          [x + 79, 351],
          [x + 79, 399],
        ],
        "#465c54",
        3,
      );
      ellipse(c, x + 15, 399, 3, 3, "#e4cc7b", INK, 1);
      c.fillStyle = "#eae5bb";
      c.font = "900 11px Barlow, sans-serif";
      c.fillText("[ F ] ENTER", x, 347);
      c.textAlign = "left";
    }
    const preview = g.status === "menu";
    if (preview) {
      drawDino(c, 740, 430, 0, -1, t);
      drawDino(c, 927, 430, 2, -1, t);
      drawDino(c, 1090, 430, 1, -1, t);
      drawHero(c, 546, 430, g.hero, g.weapon, 1, t);
    } else {
      for (const d of g.drops) {
        const x = d.x - g.camera,
          y = 411 + Math.sin(t * 4 + d.x) * 4;
        c.save();
        c.shadowColor = d.type === "health" ? "#e8ffc2" : "#fff38f";
        c.shadowBlur = 15;
        ellipse(c, x, 433, 25, 4, "#efffc060", null);
        if (d.type === "health") {
          rect(c, x - 12, y - 21, 24, 25, "#e9e4c8", INK, 3, 3);
          rect(c, x - 8, y - 17, 16, 17, "#e3a331", INK, 1);
          rect(c, x - 3, y - 15, 6, 15, "#f8f3d5", null);
          rect(c, x - 7, y - 11, 14, 6, "#f8f3d5", null);
        } else if (d.type === "weapon") {
          drawWeapon(c, d.weapon, x - 18, y - 4, 0.8);
        } else {
          rect(c, x - 17, y - 21, 34, 24, "#b38c5d", INK, 3, 2);
          line(
            c,
            [
              [x - 13, y - 15],
              [x + 13, y - 15],
              [x - 13, y - 7],
              [x + 13, y - 7],
            ],
            "#674d32",
            2,
          );
          rect(c, x - 3, y - 23, 6, 28, "#c7b685", INK, 2);
        }
        c.restore();
      }
      if (g.objective === "eggs") {
        for (const egg of g.eggs) {
          if (!egg.collected) {
            const x = egg.x - g.camera;
            ellipse(c, x, 429, 25, 5, "#625335", INK, 2);
            ellipse(c, x, 415, 12, 16, "#e2dec1", INK, 2);
            ellipse(c, x - 3, 413, 4, 3, "#99a282", null);
            ellipse(c, x + 4, 422, 3, 2, "#99a282", null);
          }
        }
      }
      for (const e of g.enemies) {
        drawDino(
          c,
          e.x - g.camera,
          430,
          e.type,
          Math.sign(g.x - e.x),
          t,
          e.flash,
          e.armored,
          e.attack > 0.0,
        );
        if (e.hp < e.max) {
          rect(
            c,
            e.x - g.camera - 27,
            e.type === 1 ? 250 : 313,
            54,
            5,
            "#281e22",
            INK,
            1,
          );
          rect(
            c,
            e.x - g.camera - 26,
            e.type === 1 ? 251 : 314,
            52 * Math.max(0, e.hp / e.max),
            3,
            "#ef6a38",
            null,
          );
        }
      }
      g.allyUnits.forEach((a) =>
        drawHero(
          c,
          a.x - g.camera,
          430,
          a.id,
          a.id === "knight" ? 25 : 3,
          a.facing || g.facing,
          t,
          Math.abs(a.x - g.x) > 80,
          a.attack || 0,
        ),
      );
      c.globalAlpha = g.inv > 0 && Math.floor(t * 16) % 2 ? 0.4 : 1;
      drawHero(
        c,
        g.x - g.camera,
        430,
        g.hero,
        g.attack > 0 && g.swingWeapon !== null ? g.swingWeapon : g.weapon,
        g.facing,
        t,
        g.moving,
        g.attack,
        g.inv,
      );
      c.globalAlpha = 1;
      if (g.attack > 0.08 && g.swingWeapon !== null) {
        c.save();
        c.translate(g.x - g.camera, 375);
        c.scale(g.facing, 1);
        c.strokeStyle = "#edf0cce0";
        c.lineWidth = 5;
        c.beginPath();
        c.arc(0, 0, WEAPONS[g.swingWeapon].range * 0.8, -1.5, 0.9);
        c.stroke();
        c.restore();
      }
      if (g.muzzle > 0) {
        const x = g.x - g.camera + g.facing * 59;
        shape(
          c,
          [
            [x, 380],
            [x + g.facing * 13, 371],
            [x + g.facing * 10, 379],
            [x + g.facing * 35, 380],
            [x + g.facing * 10, 385],
            [x + g.facing * 14, 392],
          ],
          "#ffc237",
          "#fff2b0",
          2,
        );
      }
      for (const b of g.bullets) {
        const x = b.x - g.camera;
        c.save();
        if (b.acid) {
          ellipse(c, x, b.y, 8, 6, "#b8de5c", INK, 2);
          ellipse(c, x - 2, b.y - 2, 3, 2, "#e2fdb3", null);
        } else if (b.family === "launcher") {
          rect(c, x - 9, b.y - 4, 19, 8, "#be9e70", INK, 2);
          shape(
            c,
            [
              [x - 9, b.y - 3],
              [x - 25 * Math.sign(b.vx), b.y],
              [x - 9, b.y + 4],
            ],
            "#ffa328",
            null,
          );
        } else if (b.family === "saw") {
          c.translate(x, b.y);
          c.rotate(t * 25);
          for (let i = 0; i < 4; i++) {
            c.rotate(Math.PI / 2);
            shape(
              c,
              [
                [0, 0],
                [-4, -5],
                [0, -14],
                [4, -4],
              ],
              "#d6dcda",
              INK,
              1,
            );
          }
          ellipse(c, 0, 0, 3, 3, "#78868a", INK, 1);
        } else if (b.family === "laser" || b.family === "force") {
          c.shadowColor = "#8bf0d6";
          c.shadowBlur = 12;
          line(
            c,
            [
              [x - 15 * Math.sign(b.vx), b.y],
              [x + 8 * Math.sign(b.vx), b.y],
            ],
            "#b6ffdc",
            5,
          );
        } else if (b.family === "flame") {
          c.globalAlpha = Math.min(1, b.life * 2);
          ellipse(c, x, b.y, 18, 11, "#ef6e2acc", null);
          ellipse(c, x + 3, b.y, 10, 7, "#ffcb56", null);
        } else
          line(
            c,
            [
              [x - 10 * Math.sign(b.vx), b.y],
              [x, b.y],
            ],
            "#ffe3a0",
            3,
          );
        c.restore();
      }
      for (const p of g.particles) {
        c.globalAlpha = Math.min(1, p.life * 2);
        if (p.text) {
          c.font = "900 italic 20px Barlow Condensed, sans-serif";
          c.strokeStyle = INK;
          c.lineWidth = 3;
          c.strokeText(p.text, p.x - g.camera, p.y);
          c.fillStyle = p.color;
          c.fillText(p.text, p.x - g.camera, p.y);
        } else
          ellipse(
            c,
            p.x - g.camera,
            p.y,
            p.size,
            p.size * 0.7,
            p.color,
            INK,
            1,
          );
        c.globalAlpha = 1;
      }
    }
    this.foreground(g.camera, t);
    if (["waste", "cave"].includes(g.biome)) {
      c.strokeStyle = "#c9d6d040";
      c.lineWidth = 1.5;
      for (let i = 0; i < 70; i++) {
        const x = ((i * 39 + t * 190) % 1200) - 60,
          y = (i * 73 + t * 420) % 650;
        line(
          c,
          [
            [x, y],
            [x - 12, y + 44],
          ],
          "#c9d6d045",
          1,
        );
      }
    }
    if (g.status === "playing" && !g.touchAim) {
      const { x, y } = g.mouse;
      c.strokeStyle = "#fff7cc";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(x, y, 9, 0, Math.PI * 2);
      c.moveTo(x - 15, y);
      c.lineTo(x - 6, y);
      c.moveTo(x + 6, y);
      c.lineTo(x + 15, y);
      c.moveTo(x, y - 15);
      c.lineTo(x, y - 6);
      c.moveTo(x, y + 6);
      c.lineTo(x, y + 15);
      c.stroke();
    }
    if (g.events.length && g.status === "playing") {
      const e = g.events[0];
      c.save();
      c.globalAlpha = Math.min(1, e.life);
      c.textAlign = "center";
      c.font = "900 italic 44px Barlow Condensed, sans-serif";
      c.lineWidth = 7;
      c.strokeStyle = INK;
      c.strokeText(e.text, 540, 208);
      c.fillStyle = "#ffdf53";
      c.fillText(e.text, 540, 208);
      c.restore();
    }
  }
}
