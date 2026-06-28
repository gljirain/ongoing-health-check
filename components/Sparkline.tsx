"use client";

import { LIGHT_META } from "./ui";
import { Light } from "@/lib/types";

export interface SparkPoint {
  value: number;
  date: string;
  flag: Light;
}

/** Tiny trend line for a numeric lab series. Points are oldest→newest. */
export function Sparkline({ points, width = 320, height = 56 }: { points: SparkPoint[]; width?: number; height?: number }) {
  if (points.length < 2) return null;
  const pad = 8;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (points.length - 1);
  const xy = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (p.value - min) / span) * (height - pad * 2);
    return { x, y, p };
  });
  const d = xy.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <path d={d} fill="none" stroke="var(--color-faint)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={i === xy.length - 1 ? 3.2 : 2.2} fill={LIGHT_META[pt.p.flag].color} />
      ))}
      {/* latest value label */}
      <text x={last.x} y={last.y - 6} fontSize="9" textAnchor="end" fill="var(--color-muted)">
        {points[points.length - 1].value}
      </text>
    </svg>
  );
}
