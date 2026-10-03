// Synthesised sound and a small looping track. No audio files ship with the
// game. Everything degrades to silence if Web Audio is unavailable.
export class Sound {
  constructor() {
    this.ctx = null;
    this.fx = true;
    this.music = true;
    this.musicTimer = null;
    this.step = 0;
  }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }
  tone(freq, dur, type = "square", vol = 0.12, slide = 0, when = 0) {
    const c = this.ensure();
    if (!c) return;
    const t = c.currentTime + when,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  noise(dur, vol = 0.2, hp = 800, when = 0) {
    const c = this.ensure();
    if (!c) return;
    const t = c.currentTime + when,
      s = c.createBufferSource(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = this.noiseBuf;
    f.type = "highpass";
    f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start(t);
    s.stop(t + dur);
  }
  play(e) {
    if (!this.fx) return;
    try {
      switch (e.type) {
        case "shot":
          if (e.family === "shotgun") (this.noise(0.25, 0.35, 300), this.tone(90, 0.2, "square", 0.12, 0.4));
          else if (e.family === "flame") this.noise(0.09, 0.08, 200);
          else if (e.family === "laser") this.tone(1400, 0.22, "sawtooth", 0.07, 0.25);
          else if (e.family === "launcher") (this.noise(0.3, 0.2, 150), this.tone(160, 0.3, "sawtooth", 0.08, 0.3));
          else if (e.family === "saw") this.tone(700, 0.25, "sawtooth", 0.06, 1.6);
          else (this.noise(0.08, e.family === "pistol" ? 0.3 : 0.18, 1200), this.tone(220, 0.07, "square", 0.06, 0.3));
          break;
        case "melee":
          this.noise(0.12, 0.12, 2400);
          break;
        case "bite":
          this.noise(0.07, 0.22, 500);
          this.tone(e.type === "brute" ? 70 : 120, 0.09, "square", 0.08, 0.6);
          break;
        case "lunge":
          this.tone(e.type === "brute" ? 140 : 320, 0.18, "sawtooth", 0.05, 0.5);
          break;
        case "roar":
          this.tone(90, 0.7, "sawtooth", 0.1, 0.5);
          this.noise(0.6, 0.06, 200);
          break;
        case "kill":
          this.noise(0.2, 0.25, 300);
          this.tone(260, 0.16, "triangle", 0.06, 0.4);
          break;
        case "explode":
          this.noise(0.7, 0.5, 60);
          this.tone(60, 0.6, "sine", 0.3, 0.4);
          break;
        case "cash":
        case "buy":
          this.tone(988, 0.08, "square", 0.06);
          this.tone(1319, 0.2, "square", 0.06, 1, 0.08);
          break;
        case "pickup":
          this.tone(660, 0.1, "triangle", 0.1, 1.5);
          break;
        case "deny":
        case "empty":
          this.tone(140, 0.15, "square", 0.08);
          break;
        case "swap":
          this.noise(0.05, 0.15, 3000);
          this.noise(0.05, 0.15, 3000, 0.08);
          break;
        case "enterShop":
        case "exitShop":
          this.tone(1500, 0.3, "sine", 0.06, 0.98);
          this.tone(1900, 0.4, "sine", 0.05, 0.98, 0.12);
          break;
        case "levelCard":
          this.tone(330, 0.12, "square", 0.08);
          this.tone(440, 0.25, "square", 0.08, 1, 0.13);
          break;
        case "levelClear":
          [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, "square", 0.08, 1, i * 0.12));
          break;
        case "dead":
          [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, "sawtooth", 0.08, 0.98, i * 0.22));
          break;
      }
    } catch {
      /* audio is best-effort */
    }
  }
  startMusic() {
    if (!this.music || this.musicTimer) return;
    if (!this.ensure()) return;
    // a driving minor riff: bass, a stab and a hat on every eighth
    const bass = [55, 55, 65.4, 55, 73.4, 55, 65.4, 49];
    const tick = () => {
      if (!this.music) return;
      const i = this.step++ % 32;
      const note = bass[Math.floor(i / 4) % 8];
      if (i % 2 === 0) this.tone(note, 0.18, "sawtooth", 0.05, 0.98);
      if (i % 8 === 4) this.tone(note * 4, 0.1, "square", 0.025);
      this.noise(0.03, i % 4 === 2 ? 0.05 : 0.02, 6000);
    };
    this.musicTimer = setInterval(tick, 150);
  }
  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
