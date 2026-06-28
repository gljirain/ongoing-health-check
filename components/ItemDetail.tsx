"use client";

import { useEffect, useState } from "react";
import {
  Atom,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  X,
  Plus,
  Trash2,
  BookOpen,
  Loader2,
  ClipboardList,
  Syringe,
  Radiation,
  Scale,
  Stethoscope,
  RefreshCw,
  Send,
} from "lucide-react";
import { DecisionGuide, EntryDTO, InsightMessageDTO, ItemStatus, PersonDTO, Provider } from "@/lib/types";
import { personalSedationNote } from "@/lib/decision";
import { aiErrorMessage, useLang } from "@/lib/i18n";
import { Dot, LIGHT_META, Pill } from "./ui";

function Section({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center gap-2">
        <span style={{ color: accent }}>{icon}</span>
        <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {title}
        </h4>
      </div>
      <p className="text-[14.5px] leading-relaxed text-[var(--color-ink)]">{children}</p>
    </div>
  );
}

const TONE: Record<"low" | "medium" | "high", { bar: string; soft: string; text: string }> = {
  low: { bar: "var(--color-green)", soft: "var(--color-green-soft)", text: "#236b48" },
  medium: { bar: "var(--color-amber)", soft: "var(--color-amber-soft)", text: "#8a6418" },
  high: { bar: "var(--color-red)", soft: "var(--color-red-soft)", text: "#9b3f2e" },
};

const BAND_TONE = { low: "low", moderate: "medium", elevated: "high" } as const;

function DecisionBlock({ decision, person }: { decision: DecisionGuide; person: PersonDTO }) {
  const { t, pick } = useLang();
  const note = personalSedationNote(person);
  const bandTone = TONE[BAND_TONE[note.band]];
  const maxWeight = Math.max(...decision.comparisons.map((c) => c.weight), 0.0001);

  return (
    <div className="mb-7 space-y-5">
      <div className="flex items-center gap-2">
        <Scale size={17} className="text-[var(--color-accent)]" />
        <h3 className="font-display text-[20px]">{t("makeDecision")}</h3>
      </div>

      <Section icon={<ClipboardList size={16} />} title={t("whatToCheckGap")} accent="var(--color-accent)">
        {pick(decision.whatToCheck)}
      </Section>
      <Section icon={<TrendingUp size={16} />} title={t("returnOnDoing")} accent="var(--color-green)">
        {pick(decision.roi)}
      </Section>

      {/* Profile-adjusted sedation read */}
      <div className="rounded-2xl p-4" style={{ background: bandTone.soft }}>
        <div className="mb-1 flex items-center gap-2">
          <Stethoscope size={15} style={{ color: bandTone.text }} />
          <h4 className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: bandTone.text }}>
            {t("sedationRead")}
          </h4>
        </div>
        <p className="text-[14px] font-medium" style={{ color: bandTone.text }}>
          {pick(note.headline)}
        </p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink)]">{pick(note.detail)}</p>
        {note.flags.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-[12.5px] text-[var(--color-muted)]">
            {note.flags.map((f) => (
              <li key={f.en}>{pick(f)}</li>
            ))}
          </ul>
        )}
      </div>

      <Section icon={<Syringe size={16} />} title={t("smartestWay")} accent="var(--color-accent)">
        {pick(decision.bestApproach)}
      </Section>

      {/* First-principles: radiation + anesthesia, side by side */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-line)] p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Radiation size={15} className="text-[var(--color-green)]" />
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t("radiation")}
            </h4>
          </div>
          <p className="text-[13.5px] leading-relaxed">{pick(decision.radiation)}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Atom size={15} className="text-[var(--color-accent)]" />
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t("anesthesia")}
            </h4>
          </div>
          <p className="text-[13.5px] leading-relaxed">{pick(decision.anesthesia)}</p>
        </div>
      </div>

      {/* "How much should each worry weigh" bars */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <h4 className="text-[13px] font-semibold">{t("worryWeigh")}</h4>
        <p className="mb-4 text-[12px] text-[var(--color-faint)]">{t("worryWeighHint")}</p>
        <div className="space-y-3">
          {decision.comparisons.map((c) => {
            const tone = TONE[c.tone];
            const pct = Math.max(2, Math.round((c.weight / maxWeight) * 100));
            return (
              <div key={c.label.en}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium">{pick(c.label)}</span>
                  {c.weight === 0 && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                      style={{ background: tone.soft, color: tone.text }}
                    >
                      {t("none")}
                    </span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-card)]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone.bar }} />
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-muted)]">{pick(c.detail)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom line */}
      <div className="rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-4">
        <h4 className="mb-1 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          {t("bottomLineForYou")}
        </h4>
        <p className="text-[14px] leading-relaxed text-[var(--color-ink)]">{pick(decision.bottomLine)}</p>
      </div>
    </div>
  );
}

export function ItemDetail({
  status,
  person,
  entries,
  providers,
  onClose,
  onChanged,
}: {
  status: ItemStatus;
  person: PersonDTO;
  entries: EntryDTO[];
  providers: Provider[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const { lang, t, pick } = useLang();
  const { item, light, reason } = status;
  const k = item.knowledge;
  const meta = LIGHT_META[light];

  const [provider, setProvider] = useState<Provider | "">(providers[0] ?? "");
  const [messages, setMessages] = useState<InsightMessageDTO[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiConsent, setAiConsent] = useState(false);

  const [showLog, setShowLog] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logStatus, setLogStatus] = useState<"green" | "yellow" | "red" | "">("");
  const [logValue, setLogValue] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const primaryName = lang === "zh" ? item.nameZh : item.name;
  const secondaryName = lang === "zh" ? item.name : item.nameZh;

  // Load the saved thread when the item opens (no key needed — just reads DB).
  useEffect(() => {
    fetch(`/api/insight?personId=${person.id}&itemKey=${item.key}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, [person.id, item.key]);

  async function runInsight(opts: { question?: string; regenerate?: boolean }) {
    if (!provider) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          personId: person.id,
          itemKey: item.key,
          question: opts.question || undefined,
          regenerate: opts.regenerate || undefined,
          acknowledgedExternalAI: aiConsent,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(aiErrorMessage(data.code, lang));
      setMessages(data.messages ?? []);
      setFollowUp("");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function saveLog() {
    setSaving(true);
    try {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: person.id,
          itemKey: item.key,
          performedAt: new Date(logDate).toISOString(),
          status: logStatus || null,
          valueText: logValue || null,
          notes: logNotes || null,
        }),
      });
      setShowLog(false);
      setLogValue("");
      setLogNotes("");
      setLogStatus("");
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#1f2421]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative h-full w-full max-w-[560px] overflow-y-auto bg-[var(--color-card)] shadow-2xl fade-up">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-card)]/95 px-7 py-5 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Dot light={light} size={11} />
                <span className="text-xs font-medium" style={{ color: meta.text }}>
                  {pick(meta.label)}
                </span>
              </div>
              <h2 className="font-display text-[26px] leading-tight text-[var(--color-ink)]">
                {primaryName}
              </h2>
              <p className="text-[15px] text-[var(--color-muted)]">{secondaryName}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-paper)]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div
            className="mt-4 rounded-xl px-4 py-3 text-[13.5px]"
            style={{ background: meta.soft, color: meta.text }}
          >
            {pick(reason)}
          </div>
        </div>

        <div className="px-7 py-6">
          <p className="mb-6 text-[15px] leading-relaxed text-[var(--color-ink)]">{pick(k.summary)}</p>

          {/* Your record — what the recommendation is actually based on */}
          <div className="mb-7 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {t("yourRecord")}
              </h4>
              <button
                onClick={() => setShowLog((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
              >
                <Plus size={14} /> {entries.length ? t("updateLog") : t("logLastCheck")}
              </button>
            </div>

            {entries[0] ? (
              <div className="mt-3 flex items-start gap-2.5">
                {entries[0].status && (
                  <Pill light={entries[0].status}>{pick(LIGHT_META[entries[0].status].label)}</Pill>
                )}
                <div className="min-w-0">
                  <span className="text-[13px] font-medium">
                    {new Date(entries[0].performedAt).toLocaleDateString(
                      lang === "zh" ? "zh-CN" : undefined,
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </span>
                  {entries[0].valueText && (
                    <p className="mt-0.5 text-[13.5px] text-[var(--color-ink)]">{entries[0].valueText}</p>
                  )}
                  {entries[0].notes && (
                    <p className="mt-0.5 text-[12.5px] italic text-[var(--color-muted)]">
                      “{entries[0].notes}”
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-[var(--color-muted)]">{t("noCheckYet")}</p>
            )}

            {showLog && (
              <div className="mt-4 space-y-3 border-t border-[var(--color-line)] pt-4 fade-up">
                <div className="flex gap-3">
                  <label className="flex-1 text-[12px] text-[var(--color-muted)]">
                    {t("dateOfCheck")}
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1.5 text-[13px]"
                    />
                  </label>
                  <label className="flex-1 text-[12px] text-[var(--color-muted)]">
                    {t("result")}
                    <select
                      value={logStatus}
                      onChange={(e) => setLogStatus(e.target.value as typeof logStatus)}
                      className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1.5 text-[13px]"
                    >
                      <option value="">{t("autoByInterval")}</option>
                      <option value="green">{t("greenNormal")}</option>
                      <option value="yellow">{t("yellowWatch")}</option>
                      <option value="red">{t("redAbnormal")}</option>
                    </select>
                  </label>
                </div>
                <input
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  placeholder={t("findingsPlaceholder")}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-[13px]"
                />
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder={t("commentPlaceholder")}
                  className="h-16 w-full resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-[13px]"
                />
                <button
                  onClick={saveLog}
                  disabled={saving}
                  className="w-full rounded-lg bg-[var(--color-ink)] py-2 text-[13.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? t("saving") : t("saveCheck")}
                </button>
              </div>
            )}
          </div>

          {item.decision ? (
            <DecisionBlock decision={item.decision} person={person} />
          ) : (
            <>
              <Section icon={<Atom size={16} />} title={t("firstPrinciples")} accent="var(--color-accent)">
                {pick(k.firstPrinciples)}
              </Section>
              <Section icon={<TrendingUp size={16} />} title={t("returnOnDoing")} accent="var(--color-green)">
                {pick(k.roi)}
              </Section>
              <Section icon={<ShieldAlert size={16} />} title={t("risksTradeoffs")} accent="var(--color-red)">
                {pick(k.risks)}
              </Section>
            </>
          )}

          {k.sources.length > 0 && (
            <div className="mb-7 flex flex-wrap items-center gap-2">
              <BookOpen size={13} className="text-[var(--color-faint)]" />
              {k.sources.map((s) => (
                <a
                  key={`${s.label}-${s.year}`}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-[var(--color-paper)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]"
                  title={[s.region, s.strength, s.note].filter(Boolean).join(" · ")}
                >
                  {s.label} · {s.year}
                </a>
              ))}
            </div>
          )}

          {/* AI deep-dive — persistent, continuous thread */}
          <div className="mb-7 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--color-accent)]" />
                <h4 className="text-[14px] font-semibold">{t("askAi")}</h4>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => runInsight({ regenerate: true })}
                  disabled={aiLoading || !aiConsent}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] disabled:opacity-50"
                >
                  <RefreshCw size={12} /> {t("regenerate")}
                </button>
              )}
            </div>

            {providers.length === 0 ? (
              <p className="text-[13px] text-[var(--color-muted)]">{t("aiNoKeys")}</p>
            ) : (
              <>
                {/* Saved conversation */}
                {messages.length > 0 && (
                  <div className="mb-3 space-y-3">
                    {messages.map((m) =>
                      m.role === "assistant" ? (
                        <div
                          key={m.id}
                          className="whitespace-pre-wrap rounded-xl bg-[var(--color-card)] p-4 text-[13.5px] leading-relaxed text-[var(--color-ink)]"
                        >
                          {m.content}
                        </div>
                      ) : (
                        <div key={m.id} className="flex justify-end">
                          <div className="max-w-[85%] rounded-xl bg-[var(--color-accent-soft)] px-3.5 py-2 text-[13.5px] text-[var(--color-ink)]">
                            <span className="mb-0.5 block text-[10.5px] font-medium text-[var(--color-accent)]">
                              {t("youLabel")}
                            </span>
                            {m.content}
                          </div>
                        </div>
                      ),
                    )}
                    <p className="text-[11px] text-[var(--color-faint)]">{t("savedThread")}</p>
                  </div>
                )}

                {/* Provider + consent (only needed before the first read) */}
                {messages.length === 0 && (
                  <label className="mb-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                    <input type="checkbox" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} className="mt-0.5" />
                    <span>{t("aiConsent")}</span>
                  </label>
                )}

                {messages.length === 0 ? (
                  <div className="flex items-center gap-2">
                    {providers.length > 1 && (
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as Provider)}
                        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-2 text-[13px]"
                      >
                        {providers.map((p) => (
                          <option key={p} value={p}>
                            {p === "anthropic" ? "Claude (Sonnet 4.6)" : "OpenAI"}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => runInsight({})}
                      disabled={aiLoading || !aiConsent}
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[13.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      {aiLoading ? t("thinking") : t("getInsight")}
                    </button>
                  </div>
                ) : (
                  /* Follow-up box (thread exists) */
                  <div className="flex items-end gap-2">
                    <textarea
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && followUp.trim() && !aiLoading) {
                          runInsight({ question: followUp.trim() });
                        }
                      }}
                      placeholder={t("followUpPlaceholder")}
                      className="h-16 flex-1 resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--color-accent)]"
                    />
                    <button
                      onClick={() => followUp.trim() && runInsight({ question: followUp.trim() })}
                      disabled={aiLoading || !followUp.trim()}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 text-[13.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                      {t("send")}
                    </button>
                  </div>
                )}
                {aiError && <p className="mt-3 text-[13px] text-[var(--color-red)]">{aiError}</p>}
              </>
            )}
          </div>

          {/* History */}
          <h4 className="text-[14px] font-semibold">{t("history")}</h4>

          <div className="mt-4 space-y-2">
            {entries.length === 0 && (
              <p className="text-[13px] text-[var(--color-faint)]">{t("noChecksLogged")}</p>
            )}
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {e.status && <Pill light={e.status}>{pick(LIGHT_META[e.status].label)}</Pill>}
                    <span className="text-[13px] font-medium">
                      {new Date(e.performedAt).toLocaleDateString(lang === "zh" ? "zh-CN" : undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {e.valueText && <p className="mt-1 text-[13px] text-[var(--color-ink)]">{e.valueText}</p>}
                  {e.notes && <p className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">{e.notes}</p>}
                </div>
                <button
                  onClick={() => deleteEntry(e.id)}
                  className="rounded-md p-1.5 text-[var(--color-faint)] transition hover:bg-[var(--color-red-soft)] hover:text-[var(--color-red)]"
                  aria-label="Delete entry"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[11.5px] leading-relaxed text-[var(--color-faint)]">{t("disclaimer")}</p>
        </div>
      </div>
    </div>
  );
}
