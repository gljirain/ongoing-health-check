"use client";

import { L, Light } from "@/lib/types";

export const LIGHT_META: Record<
  Light,
  { label: L; color: string; soft: string; text: string }
> = {
  green: {
    label: { zh: "状态良好", en: "On track" },
    color: "var(--color-green)",
    soft: "var(--color-green-soft)",
    text: "#236b48",
  },
  yellow: {
    label: { zh: "值得关注", en: "Worth a look" },
    color: "var(--color-amber)",
    soft: "var(--color-amber-soft)",
    text: "#8a6418",
  },
  red: {
    label: { zh: "尽快处理", en: "Address soon" },
    color: "var(--color-red)",
    soft: "var(--color-red-soft)",
    text: "#9b3f2e",
  },
  gray: {
    label: { zh: "暂不需要", en: "Not due" },
    color: "var(--color-gray)",
    soft: "var(--color-gray-soft)",
    text: "#6b716c",
  },
};

export function Dot({ light, size = 10, pulse = false }: { light: Light; size?: number; pulse?: boolean }) {
  const m = LIGHT_META[light];
  return (
    <span
      className={pulse && (light === "red" || light === "yellow") ? "pulse" : ""}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 99,
        background: m.color,
        boxShadow: `0 0 0 ${Math.max(2, size / 3)}px ${m.soft}`,
        flex: "none",
      }}
    />
  );
}

export function Pill({ light, children }: { light: Light; children: React.ReactNode }) {
  const m = LIGHT_META[light];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: m.soft, color: m.text }}
    >
      <Dot light={light} size={7} />
      {children}
    </span>
  );
}
