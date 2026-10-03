// All sound is synthesised with Web Audio: no files ship with the game.
// Layout: every sound -> sfx / music / ambience bus -> compressor -> speakers.
// The compressor is what makes stacked gunshots and roars hit hard without
// clipping. Everything degrades to silence when Web Audio is missing.

const now = (c) => c.currentTime;

export class Sound {
  constructor() {
    this.ctx = null;
    this.fx = true;
    this.music = true;
    this.musicTimer = null;
    this.ambience = null;
    this.lastGrunt = 0;
    this.lastHeart = 0;
    this.shotCount = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      const c = (this.ctx = new AC());
      this.comp = c.createDynamicsCompressor();
      this.comp.threshold.value = -16;
      this.comp.knee.value = 8;
      this.comp.ratio.value = 6;
      this.comp.attack.value = 0.003;
      this.comp.release.value = 0.18;
      this.master = c.createGain();
      this.master.gain.value = 0.9;
      this.comp.connect(this.master);
      this.master.connect(c.destination);
      this.sfxBus = this.bus(1.0);
      this.musicBus = this.bus(0.32);
      this.ambBus = this.bus(0.35);
      // half a second of white noise, reused by every noisy sound
      this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // a soft-clip curve for grit
      const n = 1024,
        curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 3.2);
      }
      this.curve = curve;
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }
  bus(gain) {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    g.connect(this.comp);
    return g;
  }

  // ---------- building blocks
  env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  // noise -> filter -> (optional drive) -> envelope -> bus
  noise({ type = "bandpass", freq = 1000, to = null, q = 0.8, peak = 0.3, attack = 0.002, decay = 0.15, at = 0, drive = false, bus = this.sfxBus, rate = 1 }) {
    const c = this.ctx,
      t = now(c) + at;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = rate;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    f.Q.value = q;
    const g = c.createGain();
    this.env(g, t, peak, attack, decay);
    let node = src.connect(f);
    if (drive) {
      const ws = c.createWaveShaper();
      ws.curve = this.curve;
      node = node.connect(ws);
    }
    node.connect(g).connect(bus);
    src.start(t, Math.random() * 0.4);
    src.stop(t + attack + decay + 0.05);
  }
  tone({ type = "sine", freq = 440, to = null, peak = 0.2, attack = 0.002, decay = 0.2, at = 0, drive = false, bus = this.sfxBus, vibrato = 0, vibRate = 30, filter = null }) {
    const c = this.ctx,
      t = now(c) + at;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + attack + decay);
    if (vibrato) {
      const l = c.createOscillator(),
        lg = c.createGain();
      l.frequency.value = vibRate;
      lg.gain.value = vibrato;
      l.connect(lg).connect(o.frequency);
      l.start(t);
      l.stop(t + attack + decay + 0.05);
    }
    const g = c.createGain();
    this.env(g, t, peak, attack, decay);
    let node = o;
    if (filter) {
      const f = c.createBiquadFilter();
      f.type = filter.type || "lowpass";
      f.frequency.value = filter.freq;
      f.Q.value = filter.q || 0.7;
      node = node.connect(f);
    }
    if (drive) {
      const ws = c.createWaveShaper();
      ws.curve = this.curve;
      node = node.connect(ws);
    }
    node.connect(g).connect(bus);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  // ---------- the sound effects
  gunshot(family) {
    const r = Math.random();
    switch (family) {
      case "shotgun":
        this.noise({ type: "lowpass", freq: 3500, to: 300, peak: 0.9, decay: 0.4, drive: true });
        this.tone({ freq: 110, to: 32, peak: 0.9, decay: 0.32 });
        this.noise({ freq: 2600, q: 3, peak: 0.25, decay: 0.03, at: 0.32 }); // pump: chk
        this.noise({ freq: 2200, q: 3, peak: 0.3, decay: 0.04, at: 0.42 }); //       chk
        this.casing(0.6, 0.6);
        break;
      case "launcher":
        this.noise({ type: "bandpass", freq: 400, to: 2400, q: 1.2, peak: 0.5, attack: 0.02, decay: 0.35 });
        this.tone({ freq: 90, to: 50, peak: 0.4, decay: 0.2, drive: true });
        break;
      case "saw":
        this.tone({ type: "sawtooth", freq: 900, to: 1500, peak: 0.12, decay: 0.45, vibrato: 40, vibRate: 45, filter: { freq: 3000 } });
        this.noise({ freq: 5000, q: 2, peak: 0.12, decay: 0.12 });
        break;
      case "flame":
        this.noise({ type: "lowpass", freq: 700 + r * 200, peak: 0.3, attack: 0.01, decay: 0.12, drive: true });
        break;
      case "laser":
        this.tone({ type: "square", freq: 2400, to: 160, peak: 0.16, decay: 0.28, filter: { freq: 5000 } });
        this.tone({ freq: 1200, to: 80, peak: 0.2, decay: 0.3 });
        break;
      case "smg":
        this.noise({ type: "bandpass", freq: 2200 + r * 400, q: 0.9, peak: 0.55, decay: 0.07, drive: true });
        this.tone({ freq: 170, to: 60, peak: 0.35, decay: 0.06 });
        if (this.shotCount++ % 3 === 0) this.casing(0.25, 0.3);
        break;
      case "rifle":
        this.noise({ type: "highpass", freq: 900, peak: 0.6, decay: 0.05, drive: true });
        this.noise({ type: "lowpass", freq: 1400, to: 200, peak: 0.6, decay: 0.22 });
        this.tone({ freq: 140, to: 45, peak: 0.5, decay: 0.12 });
        if (this.shotCount++ % 2 === 0) this.casing(0.3, 0.4);
        break;
      default:
        // pistol: a crack and a short thump
        this.noise({ type: "bandpass", freq: 1800 + r * 500, q: 0.7, peak: 0.7, decay: 0.11, drive: true });
        this.noise({ type: "lowpass", freq: 900, to: 150, peak: 0.45, decay: 0.16 });
        this.tone({ freq: 160, to: 48, peak: 0.45, decay: 0.12 });
        this.casing(0.35, 0.45);
    }
  }
  // brass hitting the pavement a moment after the shot
  casing(at, vol) {
    const base = 3200 + Math.random() * 1600;
    this.tone({ freq: base, peak: 0.05 * vol * 2, decay: 0.05, at });
    this.tone({ freq: base * 1.32, peak: 0.035 * vol * 2, decay: 0.04, at: at + 0.06 + Math.random() * 0.04 });
    this.tone({ freq: base * 0.9, peak: 0.025 * vol * 2, decay: 0.03, at: at + 0.13 });
  }
  screech(type) {
    if (type === "brute") return this.roar(0.6);
    const f = type === "horned" ? 620 : 980;
    this.tone({ type: "sawtooth", freq: f, to: f * 1.5, peak: 0.22, attack: 0.03, decay: 0.12, vibrato: 50, vibRate: 34, drive: true, filter: { type: "bandpass", freq: 1600, q: 1.5 } });
    this.tone({ type: "sawtooth", freq: f * 1.5, to: f * 0.7, peak: 0.2, attack: 0.01, decay: 0.2, at: 0.13, vibrato: 60, vibRate: 30, drive: true, filter: { type: "bandpass", freq: 1400, q: 1.5 } });
  }
  roar(scale = 1) {
    this.tone({ type: "sawtooth", freq: 82, to: 58, peak: 0.35 * scale, attack: 0.08, decay: 1.1 * scale, vibrato: 7, vibRate: 17, drive: true, filter: { freq: 700 } });
    this.tone({ type: "sawtooth", freq: 164, to: 110, peak: 0.18 * scale, attack: 0.08, decay: 1.0 * scale, vibrato: 12, vibRate: 19, drive: true, filter: { freq: 1100 } });
    this.noise({ type: "lowpass", freq: 600, to: 250, peak: 0.25 * scale, attack: 0.1, decay: 1.1 * scale, drive: true });
  }
  bite(type) {
    // teeth: three fast crunches and a wet squelch
    for (let i = 0; i < 3; i++) this.noise({ freq: 1600 + Math.random() * 900, q: 2.5, peak: 0.7, decay: 0.04, at: i * 0.035, drive: true });
    this.noise({ type: "lowpass", freq: 800, to: 180, peak: 0.75, decay: 0.18, at: 0.04, drive: true });
    if (type === "brute") this.tone({ freq: 70, to: 40, peak: 0.4, decay: 0.15 });
    this.grunt();
  }
  grunt() {
    const c = this.ctx;
    if (now(c) - this.lastGrunt < 0.45) return;
    this.lastGrunt = now(c);
    // a boy's "uhh": a buzzy source through two vowel formants
    const f0 = 230 + Math.random() * 40;
    for (const [freq, q, peak] of [
      [700, 6, 0.4],
      [1150, 7, 0.25],
    ])
      this.tone({ type: "sawtooth", freq: f0, to: f0 * 0.8, peak, attack: 0.015, decay: 0.2, filter: { type: "bandpass", freq, q } });
  }
  gore(type) {
    const big = type === "brute" ? 1.4 : 1;
    this.noise({ type: "lowpass", freq: 1400, to: 160, peak: 0.6 * big, decay: 0.3, drive: true });
    this.tone({ freq: 240, to: 55, peak: 0.35, decay: 0.2 });
    this.noise({ freq: 3200, q: 4, peak: 0.3, decay: 0.03, at: 0.03 }); // bone
    this.noise({ type: "lowpass", freq: 500, peak: 0.25, decay: 0.12, at: 0.18 }); // splat on the ground
    // death squeal
    this.tone({ type: "sawtooth", freq: type === "brute" ? 260 : 720, to: 160, peak: 0.07, attack: 0.01, decay: 0.3, vibrato: 30, drive: true, filter: { type: "bandpass", freq: 1200, q: 1.2 } });
  }
  explosion() {
    this.noise({ type: "lowpass", freq: 900, to: 90, peak: 1, attack: 0.005, decay: 1.1, drive: true, rate: 0.6 });
    this.tone({ freq: 70, to: 24, peak: 0.9, decay: 0.9 });
    for (let i = 0; i < 6; i++) this.noise({ freq: 2500 + Math.random() * 2000, q: 3, peak: 0.12, decay: 0.03, at: 0.2 + Math.random() * 0.6 });
  }
  whoosh() {
    this.noise({ type: "bandpass", freq: 3200, to: 500, q: 1.4, peak: 0.35, attack: 0.03, decay: 0.14 });
    this.noise({ type: "lowpass", freq: 450, peak: 0.35, decay: 0.08, at: 0.1 }); // thwack
  }
  step() {
    this.noise({ type: "lowpass", freq: 260 + Math.random() * 120, peak: 0.16, decay: 0.06 });
    this.noise({ freq: 2400, q: 1, peak: 0.02, decay: 0.04 }); // grit under the shoe
  }
  register() {
    this.noise({ freq: 3000, q: 2, peak: 0.25, decay: 0.03 });
    for (const [f, d] of [
      [2093, 0.6],
      [2637, 0.5],
      [3136, 0.45],
    ])
      this.tone({ freq: f, peak: 0.08, decay: d, at: 0.06 });
  }
  doorBell() {
    for (const [f, at] of [
      [1318, 0],
      [1760, 0.14],
    ]) {
      this.tone({ freq: f, peak: 0.12, decay: 0.9, at });
      this.tone({ freq: f * 2.76, peak: 0.03, decay: 0.4, at });
    }
  }
  heartbeat() {
    const c = this.ctx;
    if (!c || now(c) - this.lastHeart < 0.8) return;
    this.lastHeart = now(c);
    this.tone({ freq: 60, to: 40, peak: 0.5, decay: 0.12 });
    this.tone({ freq: 55, to: 38, peak: 0.4, decay: 0.12, at: 0.2 });
  }

  play(e) {
    if (!this.fx || !this.ensure()) return;
    try {
      switch (e.type) {
        case "shot":
          return this.gunshot(e.family);
        case "melee":
          return this.whoosh();
        case "bite":
          return this.bite(e.dino);
        case "lunge":
          return Math.random() < 0.7 && this.screech(e.dino);
        case "roar":
          return this.roar(1);
        case "kill":
          return this.gore(e.dino);
        case "explode":
          return this.explosion();
        case "step":
          return this.step();
        case "cash":
        case "buy":
          return this.register();
        case "pickup":
          this.tone({ type: "square", freq: 520, to: 1040, peak: 0.06, decay: 0.12, filter: { freq: 3000 } });
          return this.noise({ freq: 2500, q: 2, peak: 0.12, decay: 0.05 });
        case "deny":
        case "empty":
          this.noise({ freq: 1800, q: 4, peak: 0.25, decay: 0.02 });
          return this.tone({ type: "square", freq: 110, peak: 0.07, decay: 0.15, filter: { freq: 800 } });
        case "swap":
          this.noise({ freq: 2800, q: 3, peak: 0.3, decay: 0.03 });
          return this.noise({ freq: 1900, q: 3, peak: 0.3, decay: 0.04, at: 0.09 });
        case "enterShop":
        case "exitShop":
          return this.doorBell();
        case "levelCard":
          this.tone({ freq: 55, to: 40, peak: 0.6, decay: 0.8, drive: true });
          return this.noise({ type: "highpass", freq: 3000, peak: 0.15, attack: 0.3, decay: 0.05 });
        case "levelClear":
          [196, 233, 294, 392].forEach((f, i) => this.tone({ type: "sawtooth", freq: f, peak: 0.12, decay: 0.3, at: i * 0.13, drive: true, filter: { freq: 1800 } }));
          return;
        case "dead":
          this.tone({ type: "sawtooth", freq: 110, to: 40, peak: 0.3, attack: 0.05, decay: 2.2, drive: true, filter: { freq: 500 } });
          return this.noise({ type: "lowpass", freq: 300, peak: 0.3, attack: 0.2, decay: 2 });
      }
    } catch {
      /* audio is best-effort */
    }
  }

  // ---------- ambience: city wind and distant sirens, or night-time jungle bugs
  startAmbience(mode) {
    if (!this.fx || !this.ensure()) return;
    this.stopAmbience();
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = mode === "city" ? 380 : 900;
    const out = c.createGain();
    out.connect(this.ambBus);
    const g = c.createGain();
    g.gain.value = mode === "city" ? 0.28 : 0.12;
    const lfo = c.createOscillator(),
      lg = c.createGain();
    lfo.frequency.value = 0.13;
    lg.gain.value = 0.12;
    lfo.connect(lg).connect(g.gain);
    src.connect(f).connect(g).connect(out);
    src.start();
    lfo.start();
    const timer = setInterval(() => {
      if (!this.fx) return;
      if (mode === "city" && Math.random() < 0.08) {
        // far-off siren
        for (let i = 0; i < 4; i++) this.tone({ type: "triangle", freq: 640, to: 900, peak: 0.03, attack: 0.5, decay: 0.5, at: i * 1.0, bus: out, filter: { freq: 1200 } });
      } else if (mode !== "city") {
        // crickets
        const base = 4200 + Math.random() * 800;
        for (let i = 0; i < 5; i++) this.tone({ freq: base, peak: 0.02, decay: 0.03, at: i * 0.06, bus: out });
      }
    }, 1000);
    this.ambience = { src, lfo, timer, out };
  }
  stopAmbience() {
    if (!this.ambience) return;
    try {
      this.ambience.src.stop();
      this.ambience.lfo.stop();
      this.ambience.out.disconnect();
    } catch {}
    clearInterval(this.ambience.timer);
    this.ambience = null;
  }

  // ---------- a dark boom-bap loop, scheduled on the audio clock
  startMusic() {
    if (!this.music || this.musicTimer || !this.ensure()) return;
    const c = this.ctx,
      spb = 60 / 88 / 4; // sixteenth notes at 88 bpm
    let step = 0,
      next = now(c) + 0.1;
    const bass = [41.2, 41.2, 49, 41.2, 36.7, 36.7, 43.65, 46.25]; // E1 E1 G1 E1 D1 D1 F1 F#1
    const kick = [0, 7, 10],
      snare = [4, 12];
    const schedule = () => {
      if (!this.music) return;
      while (next < now(c) + 0.25) {
        const s = step % 16,
          bar = Math.floor(step / 16) % 8,
          at = next - now(c);
        if (kick.includes(s)) this.tone({ freq: 130, to: 42, peak: 0.9, decay: 0.32, at, bus: this.musicBus });
        if (snare.includes(s)) {
          this.noise({ freq: 1900, q: 0.8, peak: 0.55, decay: 0.16, at, bus: this.musicBus });
          this.tone({ freq: 200, to: 160, peak: 0.25, decay: 0.08, at, bus: this.musicBus });
        }
        if (s % 2 === 0) this.noise({ type: "highpass", freq: 7500, peak: s % 4 === 2 ? 0.22 : 0.12, decay: 0.03, at, bus: this.musicBus });
        if (s === 0 || s === 6 || s === 8 || s === 14)
          this.tone({ type: "sawtooth", freq: bass[bar], peak: 0.55, decay: 0.35, at, bus: this.musicBus, filter: { freq: 260 } });
        if (s === 0 && bar % 2 === 0)
          for (const m of [4, 4.76, 6]) this.tone({ type: "square", freq: bass[bar] * m, peak: 0.05, attack: 0.02, decay: 0.6, at, bus: this.musicBus, filter: { freq: 900 } });
        next += spb;
        step++;
      }
    };
    this.musicTimer = setInterval(schedule, 50);
    schedule();
  }
  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
