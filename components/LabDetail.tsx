"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Loader2, FlaskConical } from "lucide-react";
import { Provider } from "@/lib/types";
import { Light } from "@/lib/types";
import { LabSeries, PANEL_META } from "@/lib/labs";
import { useLang } from "@/lib/i18n";
import { Dot, LIGHT_META } from "./ui";
import { Sparkline, SparkPoint } from "./Sparkline";

function parseNum(s?: string | null): number | null {
  if (!s) return null;
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

export function LabDetail({
  series,
  providers,
  onClose,
}: {
  series: LabSeries;
  providers: Provider[];
  onClose: () => void;
}) {
  const { lang, t, pick } = useLang();
  const [explainer, setExplainer] = useState<{ zh: string; en: string; reviewed: boolean } | null>(null);
  const [needGenerate, setNeedGenerate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // On open: try the cache (no key needed). 409 → not cached, offer to generate.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: series.slug, label: series.label, panel: series.panel }),
        });
        if (res.status === 409) {
          setNeedGenerate(true);
        } else if (res.ok) {
          setExplainer(await res.json());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [series.slug, series.label, series.panel]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: series.slug,
          label: series.label,
          panel: series.panel,
          provider: providers[0],
          acknowledgedExternalAI: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      setExplainer(data);
      setNeedGenerate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-[#1f2421]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="card relative max-h-[88vh] w-full max-w-md overflow-y-auto p-6 soft-shadow fade-up">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11.5px] text-[var(--color-faint)]">
              <FlaskConical size={13} /> {pick(PANEL_META[series.panel])}
            </div>
            <h3 className="font-display text-[20px] leading-tight">{series.label}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-paper)]">
            <X size={18} />
          </button>
        </div>

        {/* Latest value */}
        <div className="rounded-xl p-3" style={{ background: LIGHT_META[series.flag].soft }}>
          <div className="flex items-baseline gap-2">
            <Dot light={series.flag} size={10} />
            <span className="text-[22px] font-semibold" style={{ color: LIGHT_META[series.flag].text }}>
              {series.latest.valueText}
            </span>
          </div>
          {series.refText && (
            <p className="mt-1 text-[12px] text-[var(--color-muted)]">
              {t("referenceRange")}: {series.refText}
            </p>
          )}
        </div>

        {/* Trend sparkline (oldest → newest) */}
        {(() => {
          const pts: SparkPoint[] = [...series.history]
            .reverse()
            .map((h) => ({ value: parseNum(h.valueText) as number, date: h.performedAt, flag: (h.status as Light) || "gray" }))
            .filter((p) => p.value != null && !Number.isNaN(p.value));
          return pts.length > 1 ? (
            <div className="mt-4 rounded-xl border border-[var(--color-line)] p-3">
              <Sparkline points={pts} />
            </div>
          ) : null;
        })()}

        {/* History / trend */}
        {series.history.length > 1 && (
          <div className="mt-4">
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t("history")} ({series.history.length} {t("measurements")})
            </h4>
            <div className="space-y-1.5">
              {series.history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-[13px]">
                  {h.status && <Dot light={h.status} size={7} />}
                  <span className="text-[var(--color-muted)]">
                    {new Date(h.performedAt).toLocaleDateString(lang === "zh" ? "zh-CN" : undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="ml-auto font-medium">{h.valueText}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layer-1 explainer */}
        <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-[var(--color-muted)]" />
          ) : explainer ? (
            <>
              <div className="mb-1.5 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--color-accent)]" />
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                  style={
                    explainer.reviewed
                      ? { background: "var(--color-green-soft)", color: "#236b48" }
                      : { background: "var(--color-amber-soft)", color: "#8a6418" }
                  }
                >
                  {explainer.reviewed ? t("aiReviewed") : t("aiUnreviewed")}
                </span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-[var(--color-ink)]">
                {lang === "zh" ? explainer.zh : explainer.en}
              </p>
            </>
          ) : needGenerate && providers.length > 0 ? (
            <button
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-60"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? t("generating") : t("explain")}
            </button>
          ) : (
            <p className="text-[12.5px] text-[var(--color-muted)]">{t("aiNoKeys")}</p>
          )}
          {error && <p className="mt-2 text-[12.5px] text-[var(--color-red)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
