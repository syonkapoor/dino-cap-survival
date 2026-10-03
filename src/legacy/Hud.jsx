import React from "react";
import { Pause, Skull, Coins, Swords, Crosshair, Zap } from "lucide-react";
import { WEAPONS } from "./data";
import { ArrowIcon } from "./Art";
const time = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
export function Hud({ hud, profile, edition, onPause, onCycle }) {
  const w = WEAPONS[hud.weapon] || WEAPONS[1];
  const progress = Math.min(hud.target, Math.floor(hud.progress));
  return (
    <div className="arcade-hud">
      <div className="health-cluster">
        <button
          className="ammo-icon"
          onClick={onCycle}
          title="Switch weapon (Q / E)"
        >
          <svg viewBox="0 0 60 68" aria-hidden="true">
            <g transform="rotate(30 30 34)" stroke="#3c3221" strokeWidth="3">
              <path d="M21 47V23Q21 8 30 5Q39 8 39 23V47Z" fill="#f2c749" />
              <path d="M21 23H39V48H21Z" fill="#ddb143" />
              <path d="M19 47H41V56H19Z" fill="#ebc879" />
              <path
                d="M25 23V44"
                fill="none"
                stroke="#ffe5a0"
                strokeWidth="3"
              />
            </g>
          </svg>
        </button>
        <div className="health-details">
          <div
            className="health-track"
            title={`${Math.ceil(hud.hp)} / ${hud.maxHp} HP`}
          >
            <i style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }} />
            <small>
              {Math.ceil(hud.hp)} / {hud.maxHp}
            </small>
            <div className="exp-strip">
              <b
                style={{
                  width: `${(profile.exp / (profile.level * 100)) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="cash-ammo">
            <button className="ammo-count" onClick={onCycle} title={w.name}>
              ×{w.ammo ? profile.ammo[w.ammo] : "∞"}
            </button>
            <span className="cash-count">
              <Coins /> {profile.cash.toLocaleString()}
            </span>
          </div>
          <div className="weapon-name">
            {w.name} <span>LV.{profile.level}</span>
          </div>
        </div>
      </div>
      <div className="objective-cluster">
        {hud.objective === "survive" ? (
          <>
            <span className="clock-face">◷</span>
            <b>{time(Math.max(0, hud.target - hud.time))}</b>
          </>
        ) : hud.objective === "distance" ? (
          <>
            <span className="progress-course">
              <i
                style={{
                  left: `${Math.min(100, (hud.distance / hud.target) * 100)}%`,
                }}
              >
                ●
              </i>
              <span>⚑</span>
            </span>
            <b>{Math.round(hud.distance)}m</b>
          </>
        ) : hud.objective === "eggs" ? (
          <>
            <span className="egg-icon">◒</span>
            <b>
              {hud.eggs}/{hud.target}
            </b>
          </>
        ) : hud.objective === "kills" ? (
          <>
            <Skull className="kill-icon" />
            <b>
              {progress}/{hud.target}
            </b>
          </>
        ) : (
          <>
            <Skull className="kill-icon" />
            <b>{hud.kills}</b>
            <span className="timer">{time(hud.time)}</span>
          </>
        )}
        <small>
          {hud.objective === "endless"
            ? `WAVE ${hud.wave}`
            : edition === "classic"
              ? "CITY SWEEP"
              : `DAY ${profile.day}`}
        </small>
      </div>
      <button className="pause-button" onClick={onPause} title="Pause (Esc)">
        <Pause fill="currentColor" />
      </button>
    </div>
  );
}
export function TouchControls({ game, edition }) {
  const hold = (e, key, value) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const g = game.current;
    if (g.status !== "playing") return;
    g.touchAim = true;
    if (key === "fire") g.mouse.down = value;
    else if (key === "melee") g.meleeHeld = value;
    else {
      g.keys[key] = value;
      if (value) g.facing = key === "a" ? -1 : 1;
    }
  };
  const release = (e, key) => {
    e.preventDefault();
    if (key === "fire") game.current.mouse.down = false;
    else if (key === "melee") game.current.meleeHeld = false;
    else game.current.keys[key] = false;
  };
  const bind = (key) => ({
    onPointerDown: (e) => hold(e, key, true),
    onPointerUp: (e) => release(e, key),
    onPointerCancel: (e) => release(e, key),
    onLostPointerCapture: (e) => release(e, key),
  });
  return (
    <div className="touch-controls">
      <div className="movement-pad">
        <button aria-label="Move left" {...bind("a")}>
          <ArrowIcon />
        </button>
        <button aria-label="Move right" {...bind("d")}>
          <ArrowIcon right />
        </button>
      </div>
      <div className="actions-pad">
        {edition === "sequel" && (
          <button
            className="action-orb green"
            title="Special attack (L) · 3 energy"
            aria-label="Special attack"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              game.current.touchAim = true;
              game.current.special();
            }}
          >
            <Zap size={24} />
            <small>L</small>
          </button>
        )}
        <button
          className="action-orb blue"
          aria-label="Melee attack"
          title="Melee attack (J)"
          {...bind("melee")}
        >
          <Swords size={23} />
          <small>J</small>
        </button>
        <button
          className="action-orb orange-orb"
          aria-label="Shoot"
          title="Shoot (K / Space)"
          {...bind("fire")}
        >
          <Crosshair size={27} />
          <small>K</small>
        </button>
      </div>
    </div>
  );
}
