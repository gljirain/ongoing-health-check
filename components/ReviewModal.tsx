"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, X, RefreshCw, Check, Plus } from "lucide-react";
import { PersonDTO, Provider, ReviewResult, ReviewSuggestion } from "@/lib/types";
import { aiErrorMessage, useLang } from "@/lib/i18n";

const TONE: Record<string, string> = {
  good: "var(--color-green)",
  watch: "var(--color-amber)",
  gap: "var(--color-accent)",
};

export function ReviewModal({
  person,
  providers,
  onClose,
  onApplied,
}: {
  person: PersonDTO;
  providers: Provider[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const { lang, t } = useLang();
  const [provider, setProvider] = useState<Provider>(providers[0] ?? "anthropic");
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [appliedIdx, setAppliedIdx] = useState<Set<number>>(new Set());

  // Load any saved review on open (no key needed).
  useEffect(() => {
    fetch(`/api/review?personId=${person.id}`)
      .then((r) => r.json())
      .then((d) => setReview(d.review ?? null))
      .catch(() => {});
  }, [person.id]);

  async function run() {
    if (!provider) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, personId: person.id, acknowledgedExternalAI: consent, lang }),
      });
      const out = await res.json();
      if (!res.ok) {
        console.error("[review] failed:", res.status, out);
        throw new Error(aiErrorMessage(out.code, lang));
      }
      setReview(out.review);
      setAppliedIdx(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function apply(s: ReviewSuggestion, idx: number) {
    if (!s.entry) return;
    const e = s.entry;
    await fetch("/api/entries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: person.id,
        entries: [
          {
            itemKey: e.itemKey,
            performedAt: new Date(e.date ?? new Date().toISOString()).toISOString(),
            status: e.status,
            valueText: e.valueText || null,
            label: e.itemKey.startsWith("lab.") || e.itemKey.startsWith("condition.") || e.itemKey.startsWith("procedure.") ? e.valueText : null,
            notes: [e.note, lang === "zh" ? "AI 推断 · 已确认" : "AI-inferred · confirmed"].filter(Boolean).join(" · "),
            source: "inferred",
          },
        ],
      }),
    });
    setAppliedIdx((cur) => new Set(cur).add(idx));
    onApplied();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-[#1f2421]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="card relative max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 soft-shadow fade-up">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--color-accent)]" />
            <h3 className="font-display text-[21px]">{t("comprehensiveReview")}</h3>
          </div>
          <div className="flex items-center gap-1">
            {review && (
              <button
                onClick={run}
                disabled={loading || !consent}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] disabled:opacity-50"
              >
                <RefreshCw size={12} /> {t("regenerate")}
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-paper)]">
              <X size={18} />
            </button>
          </div>
        </div>
        <p className="mb-4 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{t("reviewSubtitle")}</p>

        {providers.length === 0 ? (
          <p className="rounded-lg bg-[var(--color-amber-soft)] px-3 py-2 text-[12.5px] text-[#8a6418]">{t("aiNoKeys")}</p>
        ) : !review ? (
          <>
            <label className="mb-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>{t("aiConsent")}</span>
            </label>
            <div className="flex items-center gap-2">
              {providers.length > 1 && (
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-2 text-[13px]"
                >
                  {providers.map((p) => (
                    <option key={p} value={p}>
                      {p === "anthropic" ? "Claude (Sonnet 4.6)" : "OpenAI"}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={run}
                disabled={loading || !consent}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[13.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {loading ? t("thinking") : t("runReview")}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {/* Overview */}
            {review.overview && (
              <div className="rounded-xl bg-[var(--color-paper)] p-4 text-[13.5px] leading-relaxed text-[var(--color-ink)]">
                {review.overview}
              </div>
            )}

            {/* Highlights */}
            {review.highlights.length > 0 && (
              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">{t("reviewHighlightsLabel")}</p>
                <div className="space-y-2">
                  {review.highlights.map((h, i) => (
                    <div key={i} className="flex gap-2.5 rounded-xl border border-[var(--color-line)] p-3">
                      <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: TONE[h.tone] }} />
                      <div>
                        <p className="text-[13.5px] font-medium">{h.title}</p>
                        {h.detail && <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{h.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {review.suggestions.length > 0 && (
              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">{t("reviewSuggestionsLabel")}</p>
                <div className="space-y-2">
                  {review.suggestions.map((s, i) => (
                    <div key={i} className="rounded-xl border border-[var(--color-line)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13.5px] font-medium">{s.title}</p>
                          {s.rationale && <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{s.rationale}</p>}
                        </div>
                        {s.kind === "log_entry" && s.entry && (
                          <button
                            onClick={() => apply(s, i)}
                            disabled={appliedIdx.has(i)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--color-accent)] px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            {appliedIdx.has(i) ? <Check size={13} /> : <Plus size={13} />}
                            {appliedIdx.has(i) ? t("applied") : t("applySuggestion")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-[var(--color-faint)]">{t("reviewDisclaimer")}</p>
          </div>
        )}

        {error && <p className="mt-3 text-[13px] text-[var(--color-red)]">{error}</p>}
      </div>
    </div>
  );
}
