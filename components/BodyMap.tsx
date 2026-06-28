"use client";

import { useState } from "react";
import { BODY_REGIONS } from "@/lib/catalog";
import { Light } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { LIGHT_META } from "./ui";

// Stylized symmetric front-view silhouette (left half, mirrored).
const HALF =
  "M100,16 Q80,16 77,34 Q79,50 90,57 Q73,60 64,74 Q60,82 60,120 Q59,148 61,173 Q66,173 70,168 Q73,140 74,108 Q75,99 79,104 Q81,140 77,173 Q73,202 82,256 Q86,322 90,410 Q90,419 99,419 L100,232 Q100,180 100,120 Z";

export function BodyMap({
  regionLights,
  selectedRegion,
  onSelect,
}: {
  regionLights: Record<string, Light>;
  selectedRegion: string | null;
  onSelect: (regionId: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const { lang } = useLang();
  const active = hover ?? selectedRegion;

  return (
    <svg viewBox="0 0 200 440" className="w-full h-full select-none" role="img" aria-label="Body map">
      {/* Body silhouette */}
      <g fill="#e9e6dc">
        <path d={HALF} />
        <g transform="translate(200,0) scale(-1,1)">
          <path d={HALF} />
        </g>
      </g>

      {/* faint centerline */}
      <line x1="100" y1="60" x2="100" y2="415" stroke="#ddd8cc" strokeWidth="0.75" />

      {/* Region markers */}
      {BODY_REGIONS.map((r) => {
        const light = regionLights[r.id] ?? "gray";
        const m = LIGHT_META[light];
        const isActive = active === r.id;
        const isSelected = selectedRegion === r.id;
        const radius = isActive ? 8.5 : 6.5;
        const attention = light === "red" || light === "yellow";
        return (
          <g
            key={r.id}
            transform={`translate(${r.x},${r.y})`}
            style={{ cursor: "pointer", transition: "transform 0.2s" }}
            onClick={() => onSelect(r.id)}
            onMouseEnter={() => setHover(r.id)}
            onMouseLeave={() => setHover(null)}
          >
            {/* connector line to the body for clarity on hover */}
            <circle r={radius + 5} fill={m.soft} opacity={isActive ? 0.9 : 0.55} />
            <circle
              r={radius}
              fill={m.color}
              className={attention && !isActive ? "pulse" : ""}
              style={{ transformOrigin: "center" }}
            />
            {isSelected && <circle r={radius + 8} fill="none" stroke={m.color} strokeWidth="1.4" opacity="0.7" />}
          </g>
        );
      })}

      {/* Hover label */}
      {active &&
        (() => {
          const r = BODY_REGIONS.find((x) => x.id === active)!;
          const flip = r.x > 130;
          const lx = flip ? r.x - 12 : r.x + 12;
          return (
            <g transform={`translate(${lx},${r.y})`} style={{ pointerEvents: "none" }}>
              <text
                x={0}
                y={-2}
                fontSize="9"
                fontWeight={600}
                fill="#1f2421"
                textAnchor={flip ? "end" : "start"}
              >
                {lang === "zh" ? r.nameZh : r.name}
              </text>
              <text x={0} y={8} fontSize="7.5" fill="#6b716c" textAnchor={flip ? "end" : "start"}>
                {lang === "zh" ? r.name : r.nameZh}
              </text>
            </g>
          );
        })()}
    </svg>
  );
}
