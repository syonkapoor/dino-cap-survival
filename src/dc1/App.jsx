import React, { useCallback, useEffect, useRef, useState } from "react";
import { List, Trophy, HelpCircle, Settings as Gear, X } from "lucide-react";
import { World } from "./engine.js";
import { Renderer } from "./render.js";
import { Sound } from "./audio.js";
import { adsAvailable, initAds, showRewarded, maybeInterstitial } from "./ads.js";
import { baseProfile, loadProfile, normalizeProfile, saveProfile, WEAPONS, MAPS, BLITZ_MAPS, CHARACTERS, SKINS, OUTFITS, SHOES, BOWS } from "./data.js";
import "./dc1.css";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const KEYS = {
  ArrowLeft: "left",
  a: "left",
  ArrowRight: "right",
  d: "right",
  k: "fire",
  " ": "fire",
  x: "fire",
  j: "melee",
  z: "melee",
  q: "swap",
  e: "swap",
  Tab: "swap",
  c: "swap",
  w: "act",
  ArrowUp: "act",
  f: "act",
};

export const ACHIEVEMENTS = [
  { id: "first", name: "FIRST BLOOD", text: "Cap your first dino", done: (p) => p.best.totalKills >= 1 },
  { id: "sweeper", name: "STREET SWEEPER", text: "Reach Street Sweep level 5", done: (p) => p.best.cityLevel >= 5 },
  { id: "grinder", name: "STREET KING", text: "Reach Street Sweep level 10", done: (p) => p.best.cityLevel >= 10 },
  { id: "survivor", name: "SURVIVOR", text: "Last 2 minutes in Survival", done: (p) => p.best.blitzTime >= 120 },
  { id: "butcher", name: "BUTCHER", text: "100 kills in one Survival run", done: (p) => p.best.blitzKills >= 100 },
  { id: "exterminator", name: "EXTERMINATOR", text: "500 dinos capped in total", done: (p) => p.best.totalKills >= 500 },
  { id: "armed", name: "ARMED TO THE TEETH", text: "Own 10 weapons", done: (p) => Object.keys(p.owned).length >= 10 },
  { id: "heavy", name: "HEAVY METAL", text: "Buy the rocket launcher", done: (p) => !!p.owned.rocket },
];

function Skyline() {
  // the title/loading backdrop: dusk sky, broken city, crooked streetlights
  return (
    <svg className="dc-skyline" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path
        d="M0 300V190h60v-40h50v60h40v-90h70v70h30v-30h60v50h40v-110h20v-20h40v130h60v-60h80v80h40v-140h70v100h50v-50h60v70h50v-90h40v-40h20v40h40v130h70v-60h60v30h40v-80h70v100h40V300z"
        fill="#1d1e26"
      />
      <path d="M760 110v-70M700 46h170M860 46v40" stroke="#1d1e26" strokeWidth="6" fill="none" />
      <g stroke="#111" strokeWidth="9" fill="none" strokeLinecap="round">
        <path d="M130 300V120q0-30 40-36" />
        <path d="M1040 300V100q0-34-44-40" />
      </g>
      <ellipse cx="176" cy="84" rx="14" ry="6" fill="#fdf6cf" />
      <ellipse cx="992" cy="60" rx="14" ry="6" fill="#fdf6cf" />
      <rect x="300" y="210" width="12" height="90" fill="#111" />
      <rect x="290" y="160" width="32" height="56" rx="5" fill="#111" />
      <circle cx="306" cy="174" r="6" fill="#c33" />
      <circle cx="306" cy="190" r="6" fill="#ec3" />
      <circle cx="306" cy="206" r="6" fill="#3c5" />
    </svg>
  );
}

function Logo() {
  return (
    <h1 className="dc-logo" aria-label="Raptor Street">
      <span>RAPTOR</span>
      <svg viewBox="0 -14 124 104" className="dc-skull" aria-hidden="true">
        <path d="M6 44 Q10 14 46 10 Q90 6 112 26 Q120 40 106 48 L98 50 L102 60 L90 58 L86 68 L74 62 L68 72 L58 64 L48 70 L42 60 Q18 62 6 44Z" fill="#4a78c9" stroke="#141218" strokeWidth="5" strokeLinejoin="round" />
        <path d="M36 26 L60 22 L66 34 L44 38Z" fill="#fff" stroke="#141218" strokeWidth="4" strokeLinejoin="round" />
        <path d="M30 18 L70 26" stroke="#141218" strokeWidth="6" strokeLinecap="round" />
        <path d="M24 12 L14 -6 L36 8Z" fill="#f6f3ea" stroke="#141218" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span>STREET</span>
    </h1>
  );
}

// a live thumbnail of a battleground, painted by the game's own renderer
function MapCard({ id, onPick, last }) {
  const cv = useRef(null);
  useEffect(() => {
    const el = cv.current;
    const r = new Renderer(el);
    // keep the picture's aspect at the widest view so it fills the card
    const w = el.parentElement.clientWidth || 300,
      h = Math.round((w * 540) / 1300);
    r.resize(w, h, window.devicePixelRatio || 1);
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    r.drawMapPreview(id);
  }, [id]);
  return (
    <button className={`dc-map ${last ? "last" : ""}`} onClick={() => onPick(id)}>
      <canvas ref={cv} aria-hidden="true" />
      <b>{MAPS[id].name}</b>
      <span>{MAPS[id].blurb}</span>
    </button>
  );
}

function Swatches({ label, colors, value, onChange }) {
  return (
    <div className="dc-opt">
      <span>{label}</span>
      <div className="dc-swatches">
        {colors.map((col, i) => (
          <button key={i} className={i === value ? "on" : ""} style={{ background: col }} aria-label={`${label} ${i + 1}`} aria-pressed={i === value} onClick={() => onChange(i)} />
        ))}
      </div>
    </div>
  );
}
function Choices({ label, items, value, onChange }) {
  return (
    <div className="dc-opt">
      <span>{label}</span>
      <div className="dc-choices">
        {items.map((name, i) => (
          <button key={name} className={i === value ? "on" : ""} aria-pressed={i === value} onClick={() => onChange(i)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

// the character creator: a breathing preview and every option beside it
function Creator({ look, onChange, onDone }) {
  const cv = useRef(null),
    lookRef = useRef(look);
  lookRef.current = look;
  useEffect(() => {
    const el = cv.current;
    const r = new Renderer(el);
    const fit = () => {
      const W = r.resize(el.parentElement.clientWidth, el.parentElement.clientHeight, window.devicePixelRatio || 1);
      el.style.width = `${Math.round(W * (el.parentElement.clientHeight / 540))}px`;
      el.style.height = `${el.parentElement.clientHeight}px`;
    };
    fit();
    let raf;
    const t0 = performance.now();
    const loop = (now) => {
      r.drawCharacterPreview(lookRef.current, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, []);
  const set = (k, v) => onChange({ ...look, [k]: v });
  const girl = look.char === "girl";
  return (
    <section className="dc-creator" role="dialog" aria-label="Character">
      <div className="dc-creator-preview">
        <canvas ref={cv} aria-label="Character preview" />
      </div>
      <div className="dc-creator-opts">
        <h2>CHARACTER</h2>
        <Choices label="WHO" items={Object.values(CHARACTERS).map((c) => c.name)} value={girl ? 1 : 0} onChange={(i) => onChange({ ...look, char: i ? "girl" : "kid", hair: 0 })} />
        <Choices label="HAIR" items={CHARACTERS[look.char].hairs} value={look.hair} onChange={(i) => set("hair", i)} />
        <Swatches label="SKIN" colors={SKINS} value={look.skin} onChange={(i) => set("skin", i)} />
        <Swatches label={girl ? "DRESS" : "JERSEY"} colors={OUTFITS.map((o) => o.main)} value={look.outfit} onChange={(i) => set("outfit", i)} />
        {girl ? (
          <Swatches label="BOW" colors={BOWS} value={look.bow} onChange={(i) => set("bow", i)} />
        ) : (
          <div className="dc-opt">
            <span>NUMBER</span>
            <div className="dc-number">
              <button aria-label="Number down" onClick={() => set("number", (look.number + 99) % 100)}>
                −
              </button>
              <b>{look.number}</b>
              <button aria-label="Number up" onClick={() => set("number", (look.number + 1) % 100)}>
                +
              </button>
            </div>
          </div>
        )}
        <Swatches label="SHOES" colors={SHOES} value={look.shoes} onChange={(i) => set("shoes", i)} />
        <button className="dc-creator-done" onClick={onDone}>
          DONE
        </button>
      </div>
    </section>
  );
}

function Panel({ title, onClose, children }) {
  return (
    <div className="dc-panel" role="dialog" aria-label={title}>
      <div className="dc-panel-head">
        <h2>{title}</h2>
        <button className="dc-x" onClick={onClose} aria-label="Close">
          <X size={26} strokeWidth={3} />
        </button>
      </div>
      <div className="dc-panel-body">{children}</div>
    </div>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <button className="dc-toggle" onClick={() => onChange(!on)} aria-pressed={on}>
      <span>{label}</span>
      <b className={on ? "on" : "off"}>{on ? "ON" : "OFF"}</b>
    </button>
  );
}

// Hold-to-act touch control. Pointer capture keeps a finger that slides off
// the button from leaving the input stuck on.
function Pad({ name, className, label, input, onTap, children }) {
  const set = (v) => (e) => {
    e.preventDefault();
    if (v) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      onTap?.(name);
    }
    if (input.current) input.current[name] = v;
  };
  return (
    <button
      className={`dc-pad ${className}`}
      aria-label={label}
      onPointerDown={set(true)}
      onPointerUp={set(false)}
      onPointerCancel={set(false)}
      onLostPointerCapture={set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [panel, setPanel] = useState(null);
  const [profile, setProfile] = useState(loadProfile);
  const [result, setResult] = useState(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [offer, setOffer] = useState(null); // "revive" | "clear" while an ad offer is on screen
  const [adBusy, setAdBusy] = useState(false);
  const live = useRef(profile); // the object the engine mutates
  const canvas = useRef(null),
    stage = useRef(null),
    green = useRef(null),
    world = useRef(null),
    renderer = useRef(null),
    sound = useRef(null),
    input = useRef(null),
    screenRef = useRef(screen);
  screenRef.current = screen;

  const persist = useCallback(() => {
    saveProfile(live.current);
    setProfile(normalizeProfile(JSON.parse(JSON.stringify(live.current))));
  }, []);

  // loading: wait for the comic font (with a timeout) and show the backdrop a beat
  useEffect(() => {
    const font = document.fonts?.load ? document.fonts.load('40px "Bangers"').catch(() => {}) : Promise.resolve();
    const min = new Promise((r) => setTimeout(r, 1100));
    const cap = new Promise((r) => setTimeout(r, 3000));
    Promise.race([Promise.all([font, min]), cap]).then(() => setScreen((s) => (s === "loading" ? "title" : s)));
  }, []);

  useEffect(() => {
    sound.current = new Sound();
    renderer.current = new Renderer(canvas.current);
    const fit = () => {
      const el = stage.current;
      if (!el) return;
      const w = el.clientWidth,
        h = el.clientHeight;
      const W = renderer.current.resize(w, h, window.devicePixelRatio || 1);
      const k = h / 540;
      canvas.current.style.width = `${Math.round(W * k)}px`;
      canvas.current.style.height = `${h}px`;
      if (world.current) world.current.viewW = W;
      setPortrait(h > w && matchMedia("(pointer: coarse)").matches);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage.current);
    let last = performance.now(),
      raf;
    let deadTimer = null;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = world.current;
      if (w && screenRef.current === "playing") {
        w.step(dt);
        for (const e of w.drainEvents()) {
          sound.current.play(e);
          if (e.type === "save") persist();
          if (e.type === "dead" && !deadTimer)
            deadTimer = setTimeout(() => {
              deadTimer = null;
              setResult(e);
              if (e.canRevive && adsAvailable()) {
                setOffer("revive");
                return;
              }
              w.endRun();
              persist();
              setScreen("dead");
              sound.current.stopMusic();
              sound.current.stopAmbience();
            }, 1400);
          if (e.type === "levelClear" && w.holdOnClear) setTimeout(() => setOffer("clear"), 900);
        }
        if (w.player.hp > 0 && w.player.hp / w.player.maxHp < 0.35 && w.scene === "street") sound.current.heartbeat();
        if (green.current) {
          const near = !!w.nearShopDoor || w.atShopExit;
          green.current.dataset.pulse = near ? "1" : "0";
          green.current.setAttribute("aria-label", near ? (w.scene === "shop" ? "Leave the shop" : "Enter the Gun Barn") : "Swap weapon");
        }
      }
      if (w && ["playing", "paused", "dead"].includes(screenRef.current)) renderer.current.draw(w, screenRef.current === "playing" ? dt : 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // ?debug exposes the live world for automated play-testing screenshots
    if (new URLSearchParams(location.search).has("debug")) window.__dc = { world: () => world.current, renderer: renderer.current, sound: sound.current };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearTimeout(deadTimer);
      sound.current.stopMusic();
      sound.current.stopAmbience();
    };
  }, [persist]);

  // one session per launch; ads stay out of a player's first session
  useEffect(() => {
    live.current.sessions = (live.current.sessions || 0) + 1;
    persist();
    initAds();
  }, [persist]);

  // browsers (iOS especially) only allow audio to start inside a user gesture
  useEffect(() => {
    const unlock = () => sound.current?.ensure();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // keyboard
  useEffect(() => {
    const down = (e) => {
      if (e.key === "Escape" || e.key === "p") {
        if (screenRef.current === "playing") pause();
        else if (screenRef.current === "paused") resume();
        return;
      }
      if (screenRef.current !== "playing" || !input.current) return;
      const k = KEYS[e.key] || KEYS[e.key.toLowerCase()];
      if (k) {
        e.preventDefault();
        input.current[k] = true;
        if (!e.repeat) world.current?.tap(k);
      }
    };
    const up = (e) => {
      const k = KEYS[e.key] || KEYS[e.key?.toLowerCase()];
      if (k && input.current) input.current[k] = false;
    };
    const blur = () => {
      if (input.current) for (const k in input.current) input.current[k] = false;
      if (screenRef.current === "playing") pause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  });

  useEffect(() => {
    if (!sound.current) return;
    sound.current.fx = profile.fx;
    sound.current.music = profile.music;
    if (!profile.music || screen !== "playing") sound.current.stopMusic();
    else sound.current.startMusic();
    if (!profile.fx || screen !== "playing") sound.current.stopAmbience();
    else if (world.current && !sound.current.ambience) sound.current.startAmbience(world.current.map === "city" ? "city" : "jungle");
  }, [profile.fx, profile.music, screen]);

  const begin = (mode, map) => {
    sound.current.ensure();
    if (map) live.current.map = map;
    const w = new World({ mode, profile: live.current, seed: (Math.random() * 2 ** 31) | 0, viewW: renderer.current.W, map: map || live.current.map });
    // with ads, LEVEL CLEAR waits for the player and death offers a revive first
    w.holdOnClear = true;
    w.deferEnd = adsAvailable();
    setOffer(null);
    world.current = w;
    input.current = w.input;
    renderer.current.cam = 0;
    setPanel(null);
    setConfirmNew(false);
    setScreen("playing");
    sound.current.stopAmbience();
    if (live.current.fx) sound.current.startAmbience(w.map === "city" ? "city" : "jungle");
    if (live.current.music) sound.current.startMusic();
  };
  const newCity = () => {
    const p = live.current;
    const hasProgress = p.level > 1 || p.cash > 0 || Object.keys(p.owned).length > 2;
    if (hasProgress && !confirmNew) return setConfirmNew(true);
    // a fresh city keeps records, trophies and settings
    live.current = { ...baseProfile(), best: p.best, runs: p.runs, fx: p.fx, music: p.music };
    persist();
    begin("city");
  };
  const pause = () => {
    if (input.current) for (const k in input.current) input.current[k] = false;
    setScreen("paused");
    sound.current?.stopMusic();
  };
  const resume = () => {
    setScreen("playing");
  };
  const quit = () => {
    persist();
    world.current = null;
    input.current = null;
    sound.current.stopMusic();
    sound.current.stopAmbience();
    setScreen("title");
  };
  const giveUp = () => {
    const w = world.current;
    setOffer(null);
    w.endRun();
    persist();
    setScreen("dead");
    sound.current.stopMusic();
    sound.current.stopAmbience();
  };
  const watchToRevive = async () => {
    setAdBusy(true);
    sound.current.stopMusic();
    const ok = await showRewarded();
    setAdBusy(false);
    if (ok && world.current.revive()) {
      setOffer(null);
      if (live.current.music) sound.current.startMusic();
    } else giveUp();
  };
  const nextLevel = async () => {
    setOffer(null);
    await maybeInterstitial(live.current.sessions);
    world.current?.nextLevel();
  };
  const watchToDouble = async () => {
    setAdBusy(true);
    const ok = await showRewarded();
    setAdBusy(false);
    if (ok) world.current.doubleLevelCash();
    persist();
    nextLevel();
  };
  const setLook = (look) => {
    live.current.look = look;
    persist();
  };
  const setSetting = (k, v) => {
    live.current[k] = v;
    persist();
  };
  const resetAll = () => {
    if (!confirmReset) return setConfirmReset(true);
    live.current = baseProfile();
    persist();
    setConfirmReset(false);
  };

  const tap = (k) => world.current?.tap(k);
  const canResume = profile.level > 1 || profile.cash > 0 || Object.keys(profile.owned).length > 2;
  const inGame = ["playing", "paused", "dead"].includes(screen);

  return (
    <main className={`dc-root ${inGame ? "in-game" : ""}`}>
      <div className="dc-stage" ref={stage}>
        <canvas ref={canvas} className="dc-canvas" aria-label="Raptor Street game" />
      </div>

      {(screen === "loading" || screen === "title") && (
        <section className="dc-title">
          <Skyline />
          {screen === "loading" ? (
            <p className="dc-loading">LOADING...</p>
          ) : (
            <>
              <Logo />
              <nav className="dc-menu" aria-label="Main menu">
                <button onClick={() => setScreen("maps")}>SURVIVAL</button>
                <button onClick={newCity}>STREET SWEEP</button>
                <button onClick={() => begin("city")} disabled={!canResume}>
                  RESUME
                </button>
                <button className="dc-menu-small" onClick={() => setScreen("character")}>
                  CHARACTER
                </button>
                {confirmNew && (
                  <div className="dc-confirm" role="alert">
                    <span>START OVER FROM LEVEL 1? CASH AND GUNS RESET.</span>
                    <button onClick={newCity}>YES</button>
                    <button onClick={() => setConfirmNew(false)}>NO</button>
                  </div>
                )}
              </nav>
              {canResume && (
                <p className="dc-save">
                  STREET SWEEP · LEVEL {profile.level} · ${profile.cash}
                </p>
              )}
              <div className="dc-icons dc-icons-left">
                <button aria-label="Records" onClick={() => setPanel("records")}>
                  <List size={28} strokeWidth={3} />
                </button>
                <button aria-label="Trophies" onClick={() => setPanel("trophies")}>
                  <Trophy size={28} strokeWidth={3} />
                </button>
              </div>
              <div className="dc-icons dc-icons-right">
                <button aria-label="How to play" onClick={() => setPanel("help")}>
                  <HelpCircle size={28} strokeWidth={3} />
                </button>
                <button aria-label="Settings" onClick={() => setPanel("settings")}>
                  <Gear size={28} strokeWidth={3} />
                </button>
              </div>
              {panel === "records" && (
                <Panel title="RECORDS" onClose={() => setPanel(null)}>
                  <dl className="dc-stats">
                    <dt>STREET SWEEP BEST LEVEL</dt>
                    <dd>{profile.best.cityLevel}</dd>
                    <dt>SURVIVAL MOST KILLS</dt>
                    <dd>{profile.best.blitzKills}</dd>
                    <dt>SURVIVAL LONGEST</dt>
                    <dd>{fmt(profile.best.blitzTime)}</dd>
                    <dt>DINOS CAPPED, ALL TIME</dt>
                    <dd>{profile.best.totalKills}</dd>
                  </dl>
                  {profile.runs.length > 0 && (
                    <table className="dc-runs">
                      <thead>
                        <tr>
                          <th>MODE</th>
                          <th>LEVEL</th>
                          <th>TIME</th>
                          <th>KILLS</th>
                          <th>MONEY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.runs.map((r, i) => (
                          <tr key={i}>
                            <td>{r.mode === "blitz" ? "SURVIVAL" : "STREET"}</td>
                            <td>{r.mode === "blitz" ? "—" : r.level}</td>
                            <td>{fmt(r.time)}</td>
                            <td>{r.kills}</td>
                            <td>${r.earned}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Panel>
              )}
              {panel === "trophies" && (
                <Panel title="TROPHIES" onClose={() => setPanel(null)}>
                  <ul className="dc-trophies">
                    {ACHIEVEMENTS.map((a) => (
                      <li key={a.id} className={a.done(profile) ? "done" : ""}>
                        <Trophy size={24} strokeWidth={3} />
                        <div>
                          <b>{a.name}</b>
                          <span>{a.text}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
              {panel === "help" && (
                <Panel title="HOW TO PLAY" onClose={() => setPanel(null)}>
                  <div className="dc-help">
                    <p>Prehistoric lizards are tearing the city apart. Everyone got eaten, so now it's just you, the dinos, and the grumpy clerk at the Gun Barn.</p>
                    <ul>
                      <li>
                        <b>◀ ▶</b> walk. You shoot the way you're facing. <kbd>A</kbd> <kbd>D</kbd> or arrows.
                      </li>
                      <li>
                        <b className="o">ORANGE</b> fire. <kbd>K</kbd> or <kbd>Space</kbd>.
                      </li>
                      <li>
                        <b className="b">BLUE</b> swing your club. It shakes off every dino biting you. <kbd>J</kbd>
                      </li>
                      <li>
                        <b className="g">GREEN</b> swap guns, or walk into the Gun Barn at its door. <kbd>Q</kbd> / <kbd>W</kbd>
                      </li>
                    </ul>
                    <p>
                      <b>STREET SWEEP:</b> clear each level, loot the lit doorways for cash and ammo, and spend it at the Gun Barn. Stand under a gun: orange buys or upgrades it, blue buys ammo. Walk out the left side to leave.
                    </p>
                    <p>
                      <b>SURVIVAL:</b> pick a map. Weapons, ammo and medicine fall from the sky. Hold out as long as you can.
                    </p>
                    <p className="dc-credit">Raptor Street by Synergi Insights.</p>
                  </div>
                </Panel>
              )}
              {panel === "settings" && (
                <Panel title="SETTINGS" onClose={() => (setPanel(null), setConfirmReset(false))}>
                  <Toggle label="FX" on={profile.fx} onChange={(v) => setSetting("fx", v)} />
                  <Toggle label="MUSIC" on={profile.music} onChange={(v) => setSetting("music", v)} />
                  <Toggle label="GORE" on={profile.gore} onChange={(v) => setSetting("gore", v)} />
                  <button className="dc-toggle danger" onClick={resetAll}>
                    <span>{confirmReset ? "ERASE EVERYTHING? PRESS AGAIN" : "RESET ALL PROGRESS"}</span>
                  </button>
                </Panel>
              )}
            </>
          )}
        </section>
      )}

      {screen === "maps" && (
        <section className="dc-title dc-maps" role="dialog" aria-label="Choose a map">
          <Skyline />
          <h2>CHOOSE YOUR BATTLEGROUND</h2>
          <div className="dc-map-grid">
            {BLITZ_MAPS.map((id) => (
              <MapCard key={id} id={id} last={profile.map === id} onPick={(m) => begin("blitz", m)} />
            ))}
          </div>
          <button className="dc-back-link" onClick={() => setScreen("title")}>
            BACK
          </button>
        </section>
      )}

      {screen === "character" && <Creator look={profile.look} onChange={setLook} onDone={() => setScreen("title")} />}

      {screen === "playing" && (
        <div className="dc-controls">
          <button className="dc-pause" aria-label="Pause" onClick={pause} />
          <Pad name="left" className="dc-left" label="Walk left" input={input} onTap={tap}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M88 10 L12 50 L88 90Z" />
            </svg>
          </Pad>
          <Pad name="right" className="dc-right" label="Walk right" input={input} onTap={tap}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M12 10 L88 50 L12 90Z" />
            </svg>
          </Pad>
          <Pad name="melee" className="dc-blue" label="Melee" input={input} onTap={tap} />
          <Pad name="fire" className="dc-orange" label="Fire" input={input} onTap={tap} />
          <span ref={green} className="dc-green-wrap" data-pulse="0" aria-label="Swap weapon">
            <Pad name="green" className="dc-green" label="Swap weapon or enter" input={input} onTap={tap}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <path d="M30 40 A22 22 0 0 1 70 40 M70 60 A22 22 0 0 1 30 60" />
                <path d="M62 30 L72 40 L60 46 M38 70 L28 60 L40 54" />
              </svg>
            </Pad>
          </span>
        </div>
      )}

      {screen === "playing" && offer === "revive" && (
        <section className="dc-offer" role="dialog" aria-label="Revive">
          <h2>KEEP GOING?</h2>
          <button className="dc-offer-yes" disabled={adBusy} onClick={watchToRevive}>
            {adBusy ? "LOADING…" : "▶ WATCH AD TO REVIVE"}
          </button>
          <button className="dc-offer-no" disabled={adBusy} onClick={giveUp}>
            NO THANKS
          </button>
        </section>
      )}
      {screen === "playing" && offer === "clear" && (
        <section className="dc-offer dc-offer-clear" role="dialog" aria-label="Level clear">
          <p>
            THIS LEVEL: <b>${world.current?.levelEarned ?? 0}</b>
          </p>
          {adsAvailable() && (
            <button className="dc-offer-yes" disabled={adBusy} onClick={watchToDouble}>
              {adBusy ? "LOADING…" : "▶ WATCH AD FOR 2× CASH"}
            </button>
          )}
          <button className="dc-offer-no" disabled={adBusy} onClick={nextLevel}>
            NEXT LEVEL ▶
          </button>
        </section>
      )}

      {screen === "paused" && (
        <section className="dc-paused" role="dialog" aria-label="Paused">
          <h2>PAUSED</h2>
          <Toggle label="FX" on={profile.fx} onChange={(v) => setSetting("fx", v)} />
          <Toggle label="MUSIC" on={profile.music} onChange={(v) => setSetting("music", v)} />
          <Toggle label="GORE" on={profile.gore} onChange={(v) => setSetting("gore", v)} />
          <div className="dc-paused-row">
            <button onClick={quit}>MENU</button>
            <button className="dc-back" onClick={resume}>
              BACK
            </button>
          </div>
        </section>
      )}

      {screen === "dead" && result && (
        <section className="dc-dead" role="dialog" aria-label="You died">
          <h2 className="dc-died">YOU DIED</h2>
          <dl className="dc-stats">
            <dt>SURVIVAL TIME :</dt>
            <dd>{fmt(result.time)}</dd>
            {result.mode === "city" && (
              <>
                <dt>LEVEL :</dt>
                <dd>{result.level}</dd>
              </>
            )}
            <dt>DINOS KILLED :</dt>
            <dd>{result.kills}</dd>
            <dt>MONEY EARNED :</dt>
            <dd>{result.earned}</dd>
          </dl>
          <button className="dc-done" onClick={quit}>
            DONE
          </button>
        </section>
      )}

      {portrait && inGame && (
        <button className="dc-rotate" onClick={() => setPortrait(false)}>
          TURN YOUR PHONE SIDEWAYS
          <small>tap to play anyway</small>
        </button>
      )}
    </main>
  );
}

// exported for tests
export const _internals = { KEYS, WEAPONS };
