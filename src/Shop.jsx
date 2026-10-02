import React, { useState } from "react";
import {
  ArrowLeft,
  Coins,
  Check,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { WEAPONS, HEROES, AMMO } from "./data";
import { WeaponArt, HeroPortrait } from "./Art";
export function Shop({ profile, onPurchase, onBack, edition }) {
  const [tab, setTab] = useState("Weapons"),
    [category, setCategory] = useState("ALL"),
    [page, setPage] = useState(0),
    [notice, setNotice] = useState("");
  const buy = (cost, apply, message) => {
    if (profile.cash < cost) {
      setNotice("NOT ENOUGH CASH! Go cap some dinos.");
      return;
    }
    onPurchase(cost, apply);
    setNotice(message || "LOCKED AND LOADED! Purchase saved.");
  };
  const filtered = WEAPONS.map((w, i) => ({ ...w, index: i })).filter(
    (w) =>
      (edition === "sequel" || !w.super) &&
      (category === "ALL" ||
        (category === "MELEE" && w.family === "melee") ||
        (category === "GUNS" && !["melee"].includes(w.family) && !w.super) ||
        (category === "SUPER" && w.super)),
  );
  const pages = Math.ceil(filtered.length / 4);
  const displayed = filtered.slice(page * 4, page * 4 + 4);
  return (
    <div className="game-panel shop-panel">
      <div className="panel-heading">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft /> BACK
        </button>
        <h2>{edition === "classic" ? "AMMO COUNTRY" : "ARMORY"}</h2>
        <div className="panel-cash">
          <Coins /> {profile.cash.toLocaleString()}
        </div>
      </div>
      <div className="board-tabs">
        {[
          "Weapons",
          "Ammo",
          ...(edition === "sequel" ? ["Heroes", "Mercenaries"] : []),
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => {
              setTab(t);
              setPage(0);
              setNotice("");
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      {tab === "Weapons" && (
        <div className="weapon-filters">
          {[
            "ALL",
            "MELEE",
            "GUNS",
            ...(edition === "sequel" ? ["SUPER"] : []),
          ].map((f) => (
            <button
              key={f}
              className={category === f ? "selected" : ""}
              onClick={() => {
                setCategory(f);
                setPage(0);
                setNotice("");
              }}
            >
              {f}
            </button>
          ))}
          <span>25 CLASSIC {edition === "sequel" ? " + 4 SUPER" : ""}</span>
        </div>
      )}
      <div
        className={`shop-grid ${tab === "Ammo" || tab === "Heroes" ? "five" : tab === "Mercenaries" ? "duo" : ""}`}
      >
        {tab === "Weapons"
          ? displayed.map((w) => {
              const unlocked = profile.unlocked.includes(w.index),
                level = profile.upgrades[w.index],
                price = unlocked ? 250 * (level + 1) : w.price;
              return (
                <div className="item-card" key={w.id}>
                  <div className="item-top">
                    <span>
                      {w.super ? "SUPER WEAPON" : w.family.toUpperCase()}
                    </span>
                    <b>{unlocked ? `LV.${level}` : "LOCKED"}</b>
                  </div>
                  <WeaponArt index={w.index} />
                  <h3>{w.name}</h3>
                  <p>
                    {w.damage + level * 2} DMG <i />{" "}
                    {w.ammo ? w.ammo.toUpperCase() : "UNLIMITED"}
                  </p>
                  <small>
                    {unlocked
                      ? "+2 DAMAGE PER UPGRADE"
                      : "UNLOCK FOR EVERY RUN"}
                  </small>
                  <button
                    className="arcade-button mini"
                    onClick={() =>
                      buy(price, (p) => {
                        if (unlocked) p.upgrades[w.index]++;
                        else p.unlocked.push(w.index);
                      })
                    }
                  >
                    {unlocked ? "UPGRADE" : "BUY"} <Coins size={15} />
                    {price.toLocaleString()}
                  </button>
                </div>
              );
            })
          : tab === "Ammo"
            ? AMMO.map((a) => (
                <div className="item-card" key={a.key}>
                  <Package className="crate-icon" />
                  <h3>{a.name}</h3>
                  <p>{profile.ammo[a.key]} IN STOCK</p>
                  <small>+{a.amount} ROUNDS</small>
                  <button
                    className="arcade-button mini"
                    onClick={() =>
                      buy(a.cost, (p) => (p.ammo[a.key] += a.amount))
                    }
                  >
                    BUY <Coins size={15} />
                    {a.cost}
                  </button>
                </div>
              ))
            : tab === "Heroes"
              ? HEROES.map((h) => {
                  const owned = profile.heroes.includes(h.id),
                    level = profile.heroUpgrades[h.id] || 0,
                    price = owned ? 500 * (level + 1) : h.price;
                  return (
                    <div className="item-card hero-item" key={h.id}>
                      <HeroPortrait hero={h.id} weapon={h.weapon} />
                      <h3>{h.name}</h3>
                      <p>{h.description}</p>
                      <small>
                        {owned
                          ? `LV.${level} · ${100 + level * 10} MAX HP`
                          : "SELECTABLE CHARACTER"}
                      </small>
                      <button
                        className="arcade-button mini"
                        onClick={() =>
                          buy(price, (p) => {
                            if (owned) p.heroUpgrades[h.id] = level + 1;
                            else {
                              p.heroes.push(h.id);
                              p.unlocked = [
                                ...new Set([...p.unlocked, h.weapon]),
                              ];
                            }
                          })
                        }
                      >
                        {owned ? "UPGRADE +10 HP" : "UNLOCK"}{" "}
                        <Coins size={15} />
                        {price.toLocaleString()}
                      </button>
                    </div>
                  );
                })
              : HEROES.filter((h) => ["soldier", "knight"].includes(h.id)).map(
                  (h) => (
                    <div className="item-card hero-item" key={h.id}>
                      <HeroPortrait hero={h.id} weapon={h.weapon} />
                      <h3>{h.name}</h3>
                      <p>
                        {h.id === "soldier"
                          ? "AUTO-FIRING MARKSMAN"
                          : "MELEE SUPPORT"}
                      </p>
                      <small>FOLLOWS & FIGHTS BESIDE YOU</small>
                      <button
                        className="arcade-button mini"
                        disabled={profile.allies.includes(h.id)}
                        onClick={() => buy(h.price, (p) => p.allies.push(h.id))}
                      >
                        {profile.allies.includes(h.id) ? (
                          <>
                            <Check size={15} /> HIRED
                          </>
                        ) : (
                          <>
                            HIRE <Coins size={15} />
                            {h.price.toLocaleString()}
                          </>
                        )}
                      </button>
                    </div>
                  ),
                )}
      </div>
      {tab === "Weapons" && (
        <div className="pagination">
          <button
            aria-label="Previous weapons"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            aria-label="Next weapons"
            disabled={page === pages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
      <div
        className={"shop-notice " + (notice.startsWith("NOT") ? "error" : "")}
      >
        {notice || "CASH, WEAPONS & UPGRADES SAVE AUTOMATICALLY."}
      </div>
    </div>
  );
}
