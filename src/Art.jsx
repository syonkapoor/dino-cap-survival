import React, { useEffect, useRef } from "react";
import { drawHero, drawWeapon } from "./render";
export function HeroPortrait({ hero, weapon = 1 }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current.getContext("2d");
    c.clearRect(0, 0, 160, 150);
    c.save();
    c.translate(80, 137);
    c.scale(1.3, 1.3);
    drawHero(c, 0, 0, hero, weapon, 1);
    c.restore();
  }, [hero, weapon]);
  return <canvas ref={ref} width="160" height="150" className="portrait" />;
}
export function WeaponArt({ index }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current.getContext("2d");
    c.clearRect(0, 0, 220, 110);
    c.save();
    c.translate(80, 80);
    c.rotate(-0.16);
    drawWeapon(c, index, 0, 0, 1.65);
    c.restore();
  }, [index]);
  return <canvas ref={ref} width="220" height="110" className="weapon-art" />;
}
export function ArrowIcon({ right = false }) {
  return (
    <svg viewBox="0 0 88 78" aria-hidden="true">
      <defs>
        <linearGradient id={right ? "arrow-r" : "arrow-l"} x2="0" y2="1">
          <stop stopColor="#ff563d" />
          <stop offset=".5" stopColor="#e41614" />
          <stop offset="1" stopColor="#940908" />
        </linearGradient>
      </defs>
      <path
        d={right ? "M8 7L79 39L8 71Z" : "M79 7L8 39L79 71Z"}
        fill={`url(#${right ? "arrow-r" : "arrow-l"})`}
        stroke="#091315"
        strokeWidth="8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
