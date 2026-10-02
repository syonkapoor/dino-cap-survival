import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Coins,
  Play,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Check,
  Lock,
  Skull,
  Shield,
  Target,
  Clock,
  Flag,
  Egg,
  BookOpen,
} from "lucide-react";
import { Game, missionForDay } from "./game";
import { BIOMES, HEROES, MODES, WEAPONS, loadProfile } from "./data";
import { Hud, TouchControls } from "./Hud";
import { Shop } from "./Shop";
import { HeroPortrait, WeaponArt } from "./Art";
import "./style.css";
const prettyTime = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
const blankHud = {
  hp: 100,
  maxHp: 100,
  weapon: 1,
  inventory: [0, 1, 2, 3],
  kills: 0,
  wave: 1,
  waveKills: 0,
  waveTarget: 12,
  time: 0,
  distance: 0,
  eggs: 0,
  progress: 0,
  objective: "endless",
  target: 0,
  specialCool: 0,
};
function App() {
  const [profile, setProfile] = useState(loadProfile),
    [screen, setScreen] = useState("menu"),
    [edition, setEdition] = useState(() => profile.edition),
    [mode, setMode] = useState(() =>
      profile.edition === "classic" ? "blitz" : "missions",
    ),
    [biome, setBiome] = useState("jungle"),
    [hero, setHero] = useState(() => profile.hero),
    [mission, setMission] = useState(() => missionForDay(profile.day)),
    [hud, setHud] = useState(blankHud),
    [result, setResult] = useState(null),
    [muted, setMuted] = useState(() => {
      try {
        return localStorage.getItem("dino-cap-muted") === "true";
      } catch {
        return false;
      }
    }),
    [returnScreen, setReturnScreen] = useState("menu"),
    [equipOpen, setEquipOpen] = useState(false);
  const canvas = useRef(),
    stage = useRef(),
    game = useRef(),
    screenRef = useRef(screen),
    profileRef = useRef(profile);
  screenRef.current = screen;
  profileRef.current = profile;
  const update = (data) => {
    setHud(data);
    setProfile(data.profile);
  };
  const finish = (r) => {
    setResult(r);
    setProfile(r.profile);
    setScreen(r.success ? "complete" : "dead");
    setMission(missionForDay(r.profile.day));
  };
  const shopFromGame = () => {
    setReturnScreen("paused");
    setScreen("shop");
  };
  useEffect(() => {
    const g = new Game(
      canvas.current,
      profileRef.current,
      update,
      finish,
      shopFromGame,
    );
    g.muted = muted;
    game.current = g;
    const keydown = (e) => {
      const g = game.current;
      if (e.key === "Escape") {
        e.preventDefault();
        if (screenRef.current === "playing") {
          g.pause();
          setScreen("paused");
        } else if (screenRef.current === "paused") {
          g.resume(profileRef.current);
          setScreen("playing");
        } else if (
          screenRef.current === "shop" ||
          screenRef.current === "guide" ||
          screenRef.current === "heroes"
        ) {
          setScreen(g.time > 0 && g.status === "paused" ? "paused" : "menu");
        }
        return;
      }
      if (screenRef.current !== "playing") return;
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      g.keys[e.key] = true;
      g.keys[e.key.toLowerCase()] = true;
      if (e.repeat) return;
      if (["q", "e"].includes(e.key.toLowerCase()))
        g.cycle(e.key.toLowerCase() === "q" ? -1 : 1);
      if (/^[1-4]$/.test(e.key)) g.select(Number(e.key) - 1);
      if (e.key.toLowerCase() === "l") g.special();
    };
    const keyup = (e) => {
      game.current.keys[e.key] = false;
      game.current.keys[e.key.toLowerCase()] = false;
    };
    const blur = () => {
      game.current.releaseInputs();
      if (screenRef.current === "playing") {
        game.current.pause();
        setScreen("paused");
      }
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      game.current.destroy();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dino-cap-save", JSON.stringify(profile));
    } catch {
      /* Continue gameplay if browser storage is unavailable. */
    }
    if (game.current && game.current.status !== "playing")
      game.current.syncProfile(profile);
  }, [profile]);
  useEffect(() => {
    try {
      localStorage.setItem("dino-cap-muted", String(muted));
    } catch {}
    if (game.current) game.current.muted = muted;
  }, [muted]);
  useEffect(() => {
    if (game.current && screen === "menu") {
      game.current.status = "menu";
      game.current.configure({ edition, hero, biome, mode });
    }
  }, [edition, hero, biome, mode, screen]);
  const changeEdition = (value) => {
    if (screen !== "menu") return;
    setEdition(value);
    setMode(value === "classic" ? "blitz" : "missions");
    setBiome("jungle");
    setProfile((p) => ({ ...p, edition: value }));
  };
  const selectMode = (m) => {
    setMode(m.id);
    if (m.id === "city") setBiome("city");
    else if (m.id === "blitz") setBiome("jungle");
  };
  const start = () => {
    game.current.destroy();
    const g = new Game(
      canvas.current,
      profileRef.current,
      update,
      finish,
      shopFromGame,
    );
    game.current = g;
    g.muted = muted;
    const chosen =
      MODES[edition].find((m) => m.id === mode) || MODES[edition][0];
    const task =
      mode === "missions"
        ? mission
        : { objective: chosen.objective, target: chosen.target };
    g.configure({ edition, hero, biome, mode, ...task });
    g.start();
    setScreen("playing");
    setResult(null);
    setEquipOpen(false);
  };
  const pause = () => {
    game.current.pause();
    setScreen("paused");
    setEquipOpen(false);
  };
  const resume = () => {
    game.current.resume(profileRef.current);
    setScreen("playing");
  };
  const toMenu = () => {
    game.current.pause();
    game.current.status = "menu";
    game.current.releaseInputs();
    setScreen("menu");
    setEquipOpen(false);
  };
  const openPanel = (name) => {
    const prev = screen === "playing" ? "paused" : screen;
    if (screen === "playing") game.current.pause();
    setReturnScreen(prev);
    setScreen(name);
    setEquipOpen(false);
  };
  const back = () => {
    setScreen(returnScreen === "playing" ? "paused" : returnScreen);
  };
  const purchase = (cost, apply) =>
    setProfile((prev) => {
      if (prev.cash < cost) return prev;
      const p = structuredClone(prev);
      p.cash -= cost;
      apply(p);
      return p;
    });
  const selectedHero = HEROES.find((h) => h.id === hero) || HEROES[0];
  const selectedBiome = BIOMES.find((b) => b.id === biome);
  return (
    <div className="collection-app">
      <header className="collection-header">
        <a
          className="collection-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            toMenu();
          }}
        >
          <Skull size={22} />
          <span>
            DINO CAP<small>THE COLLECTION</small>
          </span>
        </a>
        <div className="edition-switch" aria-label="Game edition">
          <button
            className={edition === "classic" ? "selected" : ""}
            disabled={screen !== "menu"}
            onClick={() => changeEdition("classic")}
          >
            CLASSIC <small>2010</small>
          </button>
          <button
            className={edition === "sequel" ? "selected" : ""}
            disabled={screen !== "menu"}
            onClick={() => changeEdition("sequel")}
          >
            SEQUEL <small>2011</small>
          </button>
        </div>
        <div className="header-tools">
          <button
            title={muted ? "Enable sound" : "Mute sound"}
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <button
            title="Fullscreen"
            onClick={() =>
              document.fullscreenElement
                ? document.exitFullscreen()
                : stage.current.requestFullscreen()
            }
          >
            <Maximize size={18} />
          </button>
          <button
            title="Controls & field guide"
            onClick={() => openPanel("guide")}
          >
            <Settings size={19} />
          </button>
        </div>
      </header>
      <main className="arcade-shell">
        <section
          className={"game-stage " + edition + " screen-" + screen}
          ref={stage}
          aria-label="Dino Cap game"
        >
          <canvas
            className="game-canvas"
            ref={canvas}
            aria-label="Side-scrolling dinosaur combat arena"
            onPointerMove={(e) => {
              if (e.pointerType === "touch") return;
              const r = canvas.current.getBoundingClientRect();
              const g = game.current;
              g.touchAim = false;
              g.mouse.x = ((e.clientX - r.left) / r.width) * 1080;
              g.mouse.y = ((e.clientY - r.top) / r.height) * 608;
            }}
            onPointerDown={(e) => {
              if (screen === "playing") {
                e.preventDefault();
                const g = game.current;
                g.touchAim = e.pointerType === "touch";
                g.mouse.down = true;
                canvas.current.setPointerCapture(e.pointerId);
              }
            }}
            onPointerUp={() => (game.current.mouse.down = false)}
            onPointerCancel={() => (game.current.mouse.down = false)}
            onLostPointerCapture={() => (game.current.mouse.down = false)}
            onContextMenu={(e) => e.preventDefault()}
          />
          {screen === "menu" && (
            <div className="main-menu">
              <div className="menu-coins">
                <Coins /> {profile.cash.toLocaleString()}
                <span>LV.{profile.level}</span>
              </div>
              <div className="menu-title">
                <span className="tagline">LOCK ’N LOAD, BABY.</span>
                <h1>
                  DINO
                  <br />
                  <span>CAP</span>
                  {edition === "sequel" && <b>2</b>}
                </h1>
                <div className="title-ribbon">
                  {edition === "classic"
                    ? "THE ORIGINAL DINO WAR"
                    : "THE DINOS ARE BACK!"}
                </div>
              </div>
              <div className="mode-board">
                <div className="board-caption">
                  {edition === "classic"
                    ? "CHOOSE YOUR BATTLE"
                    : "DAY " + profile.day + " · CHOOSE YOUR BATTLE"}
                </div>
                {MODES[edition].map((m) => (
                  <button
                    key={m.id}
                    className={
                      "mode-option " + (mode === m.id ? "selected" : "")
                    }
                    onClick={() => selectMode(m)}
                  >
                    <span className="mode-icon">
                      {m.id === "city" ? (
                        <Target />
                      ) : m.id === "blitz" ? (
                        <Clock />
                      ) : m.id === "missions" ? (
                        <Flag />
                      ) : (
                        <Skull />
                      )}
                    </span>
                    <span>
                      <b>{m.name}</b>
                      <small>{m.detail}</small>
                    </span>
                    {mode === m.id ? (
                      <Check size={19} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                ))}
                {mode === "missions" && (
                  <div className="mission-selector">
                    <span>OBJECTIVE</span>
                    <div>
                      {[
                        {
                          objective: "kills",
                          target: 25,
                          title: "DINO EXTERMINATION",
                          icon: Target,
                          label: "25 KILLS",
                        },
                        {
                          objective: "survive",
                          target: 90,
                          title: "HOLD YOUR GROUND",
                          icon: Clock,
                          label: "90 SECONDS",
                        },
                        {
                          objective: "distance",
                          target: 1200,
                          title: "MAKE A RUN FOR IT",
                          icon: Flag,
                          label: "1200 METERS",
                        },
                        {
                          objective: "eggs",
                          target: 3,
                          title: "EGG SNATCHER",
                          icon: Egg,
                          label: "3 EGGS",
                        },
                      ].map((m) => (
                        <button
                          key={m.objective}
                          title={m.label}
                          className={
                            mission.objective === m.objective ? "selected" : ""
                          }
                          onClick={() => setMission(m)}
                        >
                          <m.icon size={16} />
                        </button>
                      ))}
                    </div>
                    <b>
                      {mission.objective === "kills"
                        ? `${mission.target} KILLS`
                        : mission.objective === "survive"
                          ? `${mission.target} SECONDS`
                          : mission.objective === "distance"
                            ? `${mission.target} METERS`
                            : `${mission.target} EGGS`}
                    </b>
                  </div>
                )}
                <div className="location-selector">
                  <button
                    aria-label="Previous landscape"
                    disabled={edition === "classic"}
                    onClick={() =>
                      setBiome(
                        BIOMES[
                          (BIOMES.findIndex((b) => b.id === biome) +
                            BIOMES.length -
                            1) %
                            BIOMES.length
                        ].id,
                      )
                    }
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <span>
                    <small>LOCATION</small>
                    {selectedBiome.name.toUpperCase()}
                  </span>
                  <button
                    aria-label="Next landscape"
                    disabled={edition === "classic"}
                    onClick={() =>
                      setBiome(
                        BIOMES[
                          (BIOMES.findIndex((b) => b.id === biome) + 1) %
                            BIOMES.length
                        ].id,
                      )
                    }
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
                <button className="arcade-button start-button" onClick={start}>
                  <Play fill="currentColor" size={21} /> START GAME
                </button>
              </div>
              <div className="menu-bottom">
                <button
                  className="wood-button"
                  onClick={() => openPanel("shop")}
                >
                  <Shield size={18} />
                  {edition === "classic" ? "AMMO COUNTRY" : "ARMORY"}
                </button>
                {edition === "sequel" && (
                  <button
                    className="wood-button"
                    onClick={() => openPanel("heroes")}
                  >
                    <Skull size={17} />
                    {selectedHero.name.toUpperCase()} <ChevronRight size={14} />
                  </button>
                )}
                <button
                  className="wood-button"
                  onClick={() => openPanel("guide")}
                >
                  <BookOpen size={17} /> HOW TO PLAY
                </button>
              </div>
              <div className="best-score">
                BEST RUN <b>{profile.best}</b> KILLS
              </div>
            </div>
          )}
          {["playing", "paused"].includes(screen) && (
            <Hud
              hud={hud}
              profile={profile}
              edition={edition}
              onPause={pause}
              onCycle={() => {
                if (screen === "playing") game.current.cycle(1);
              }}
            />
          )}
          {screen === "playing" && (
            <>
              <TouchControls game={game} edition={edition} />
              <div className="playing-label">
                <button
                  title="Choose equipped weapon"
                  onClick={() => {
                    game.current.pause();
                    setEquipOpen(true);
                    setScreen("paused");
                  }}
                >
                  {WEAPONS[hud.weapon]?.name} <span>Q / E</span>
                </button>
                {hud.nearShop && (
                  <button
                    className="shop-hint"
                    onClick={() => openPanel("shop")}
                  >
                    [ F ] AMMO COUNTRY
                  </button>
                )}
              </div>
            </>
          )}
          {screen === "paused" && (
            <div className="modal-shade">
              <div className="pause-panel">
                <h2>{equipOpen ? "LOADOUT" : "PAUSED"}</h2>
                {equipOpen ? (
                  <div className="loadout-options">
                    {hud.inventory.map((index) => (
                      <button
                        className={hud.weapon === index ? "selected" : ""}
                        key={index}
                        onClick={() => {
                          game.current.select(index);
                          setEquipOpen(false);
                          resume();
                        }}
                      >
                        <WeaponArt index={index} />
                        <span>{WEAPONS[index].name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p>THE DINOS CAN WAIT.</p>
                    <button className="arcade-button" onClick={resume}>
                      <Play fill="currentColor" size={17} /> RESUME
                    </button>
                    <button
                      className="wood-button"
                      onClick={() => openPanel("shop")}
                    >
                      ARMORY
                    </button>
                    <button
                      className="wood-button"
                      onClick={() => setEquipOpen(true)}
                    >
                      CHANGE WEAPON
                    </button>
                    <button className="wood-button" onClick={toMenu}>
                      MAIN MENU
                    </button>
                  </>
                )}
                {equipOpen && (
                  <button
                    className="wood-button"
                    onClick={() => setEquipOpen(false)}
                  >
                    BACK
                  </button>
                )}
              </div>
            </div>
          )}
          {screen === "shop" && (
            <div className="modal-shade">
              <Shop
                profile={profile}
                edition={edition}
                onPurchase={purchase}
                onBack={back}
              />
            </div>
          )}
          {screen === "heroes" && (
            <div className="modal-shade">
              <div className="game-panel hero-panel">
                <div className="panel-heading">
                  <button className="back-button" onClick={back}>
                    <ArrowLeft /> BACK
                  </button>
                  <h2>CHOOSE YOUR HERO</h2>
                  <div className="panel-cash">
                    <Coins />
                    {profile.cash.toLocaleString()}
                  </div>
                </div>
                <div className="hero-selection">
                  {HEROES.map((h) => (
                    <button
                      className={
                        "hero-select " + (h.id === hero ? "selected" : "")
                      }
                      key={h.id}
                      onClick={() => {
                        if (profile.heroes.includes(h.id)) {
                          setHero(h.id);
                          setProfile((p) => ({ ...p, hero: h.id }));
                          back();
                        } else {
                          setReturnScreen("heroes");
                          setScreen("shop");
                        }
                      }}
                    >
                      <HeroPortrait hero={h.id} weapon={h.weapon} />
                      <h3>{h.name}</h3>
                      <p>{h.description}</p>
                      <span>
                        {profile.heroes.includes(h.id) ? (
                          h.id === hero ? (
                            <>
                              <Check size={15} /> SELECTED
                            </>
                          ) : (
                            "SELECT HERO"
                          )
                        ) : (
                          <>
                            <Lock size={13} /> {h.price.toLocaleString()}
                          </>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="panel-note">
                  Unlock heroes and upgrade their health in the Armory.
                </p>
              </div>
            </div>
          )}
          {screen === "guide" && (
            <div className="modal-shade">
              <div className="game-panel guide-panel">
                <div className="panel-heading">
                  <button className="back-button" onClick={back}>
                    <ArrowLeft /> BACK
                  </button>
                  <h2>FIELD GUIDE</h2>
                  <BookOpen size={25} />
                </div>
                <div className="guide-content">
                  <div>
                    <h3>LOCK & LOAD</h3>
                    <p>
                      <kbd>A</kbd> <kbd>D</kbd> or arrows — move
                    </p>
                    <p>
                      <kbd>MOUSE</kbd> — aim & hold to shoot
                    </p>
                    <p>
                      <kbd>Q</kbd> <kbd>E</kbd> — cycle unlocked weapons
                    </p>
                    <p>
                      <kbd>J</kbd> — melee · <kbd>K</kbd> — shoot
                    </p>
                    <p>
                      <kbd>L</kbd> — special (3 energy, 3s cooldown)
                    </p>
                    <p>
                      <kbd>ESC</kbd> — pause · <kbd>F</kbd> — Ammo Country
                    </p>
                    <small>
                      The red arrows and colored buttons also work with touch.
                      Health packs restore 25 HP. Ammo crates refill your guns.
                    </small>
                  </div>
                  <div>
                    <h3>KNOW YOUR DINOS</h3>
                    <article>
                      <b>VELOCIRAPTOR</b>
                      <span>20 HP · 10 DMG</span>
                      <p>Small, fast, and ready to lunge. Keep moving.</p>
                    </article>
                    <article>
                      <b>LARGE BRUTE</b>
                      <span>150 HP · 35 DMG</span>
                      <p>Slow, tough, resistant to knockback.</p>
                    </article>
                    <article>
                      <b>BLUE MUTANT</b>
                      <span>50 HP · ACID SPIT</span>
                      <p>Ranged acid. Watch the green projectiles.</p>
                    </article>
                  </div>
                  <div>
                    <h3>TWO DINO WARS</h3>
                    <article>
                      <b>CLASSIC</b>
                      <p>
                        City Sweep: kill dinos and visit Ammo Country. Jungle
                        Blitz: survive endlessly and collect random weapons.
                      </p>
                    </article>
                    <article>
                      <b>SEQUEL</b>
                      <p>
                        Missions: kills, survival, distance, or egg stealing.
                        Arena: escalating endless waves.
                      </p>
                    </article>
                    <small>
                      Cash, level, EXP, weapons, ammo, heroes, and upgrades
                      persist between runs on this browser.
                    </small>
                  </div>
                </div>
                <button className="arcade-button guide-done" onClick={back}>
                  GOT IT!
                </button>
              </div>
            </div>
          )}
          {["dead", "complete"].includes(screen) && result && (
            <div className="modal-shade">
              <div
                className={"result-panel " + (result.success ? "success" : "")}
              >
                <div className="result-symbol">
                  {result.success ? <Flag size={45} /> : <Skull size={48} />}
                </div>
                <h2>{result.success ? "MISSION COMPLETE" : "YOU DIED"}</h2>
                <p>
                  {result.success
                    ? "THE DINOS NEVER STOOD A CHANCE."
                    : "THE DINOS WIN THIS ROUND."}
                </p>
                <div className="result-stats">
                  <div>
                    <b>{result.kills}</b>
                    <small>KILLS</small>
                  </div>
                  <div>
                    <b>{result.earned.toLocaleString()}</b>
                    <small>CASH EARNED</small>
                  </div>
                  <div>
                    <b>{prettyTime(result.time)}</b>
                    <small>SURVIVED</small>
                  </div>
                </div>
                {result.success && (
                  <div className="completion-bonus">
                    <Coins size={16} /> MISSION BONUS +{result.bonus}
                  </div>
                )}
                <button className="arcade-button" onClick={start}>
                  {result.success ? "NEXT MISSION" : "TRY AGAIN"}
                </button>
                <div className="result-actions">
                  <button
                    className="wood-button"
                    onClick={() => {
                      setReturnScreen(screen);
                      setScreen("shop");
                    }}
                  >
                    ARMORY
                  </button>
                  <button className="wood-button" onClick={toMenu}>
                    MAIN MENU
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        <div className="cabinet-footer">
          <span>
            <i />{" "}
            {edition === "classic"
              ? "DINO CAP · CLASSIC"
              : "DINO CAP 2 · SEQUEL"}{" "}
            <b>·</b>{" "}
            {screen === "playing"
              ? "SURVIVE. SHOOT. REPEAT."
              : "LOCK. LOAD. CAP SOME DINOS."}
          </span>
          <span>
            <Shield size={12} /> AUTO SAVE <b>·</b> KEYBOARD + TOUCH
          </span>
        </div>
      </main>
      <footer className="collection-footer">
        <span>A BROWSER RECREATION OF THE TRINITI INTERACTIVE CLASSICS</span>
        <button onClick={() => openPanel("guide")}>
          CONTROLS & FIELD GUIDE <ChevronRight size={12} />
        </button>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
