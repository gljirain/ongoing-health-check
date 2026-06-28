"use client";

import { useState } from "react";
import { FileText, ImagePlus, Sparkles, Loader2, X, Check } from "lucide-react";
import { EntryDTO, LabPanel, ParseResult, ParsedCondition, ParsedFinding, ParsedLab, ParsedProcedure, PersonDTO, Provider } from "@/lib/types";
import { itemByKey } from "@/lib/catalog";
import { PANEL_META } from "@/lib/labs";
import { aiErrorMessage, useLang } from "@/lib/i18n";
import { Dot } from "./ui";

type FRow = ParsedFinding & { include: boolean; dup: boolean };
type LRow = ParsedLab & { include: boolean; dup: boolean; date: string };
type CRow = ParsedCondition & { include: boolean; dup: boolean; date: string };
type PRow = ParsedProcedure & { include: boolean; dup: boolean; date: string };

const dayKey = (d: string) => new Date(d).toISOString().slice(0, 10);

export function ImportReportModal({
  person,
  providers,
  onClose,
  onImported,
}: {
  person: PersonDTO;
  providers: Provider[];
  onClose: () => void;
  onImported: () => void;
}) {
  const { lang, t, pick } = useLang();
  const [provider, setProvider] = useState<Provider>(providers[0] ?? "anthropic");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState(false);
  const [rows, setRows] = useState<FRow[]>([]);
  const [labRows, setLabRows] = useState<LRow[]>([]);
  const [condRows, setCondRows] = useState<CRow[]>([]);
  const [procRows, setProcRows] = useState<PRow[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const [preparing, setPreparing] = useState(false);

  function readAsDataUrl(f: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(f);
    });
  }

  // Render each PDF page to a JPEG data URL (client-side, via pdf.js) so PDFs
  // flow through the same vision pipeline as photos — works for scanned ones too.
  async function pdfToImages(file: File): Promise<string[]> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const out: string[] = [];
    // Cap the longest edge so the canvas never blows past the browser's max size
    // (an oversized canvas yields a blank/invalid image that providers reject) and
    // images stay light + fast. ~2000px is plenty for the model to read text.
    const MAX_EDGE = 2000;
    for (let i = 1; i <= Math.min(pdf.numPages, 12); i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, MAX_EDGE / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d")!;
      // White background — JPEG has no alpha, so transparent areas would render
      // black (that's the dark page you saw). Paint white first.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const url = canvas.toDataURL("image/jpeg", 0.8);
      if (url.startsWith("data:image/jpeg") && url.length > 1000) out.push(url); // skip blank renders
    }
    if (out.length === 0) throw new Error("pdf produced no readable pages");
    return out;
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setPreparing(true);
    setError("");
    try {
      const collected: string[] = [];
      for (const f of Array.from(files)) {
        if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
          collected.push(...(await pdfToImages(f)));
        } else if (f.type.startsWith("image/")) {
          collected.push(await readAsDataUrl(f));
        }
      }
      setImages((cur) => [...cur, ...collected].slice(0, 12));
    } catch {
      setError(lang === "zh" ? "无法读取该 PDF，请改用截图。" : "Couldn't read that PDF — try a screenshot.");
    } finally {
      setPreparing(false);
    }
  }

  async function parse() {
    setParsing(true);
    setError("");
    try {
      const [res, data] = await Promise.all([
        fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            text: text || undefined,
            images: images.length ? images : undefined,
            acknowledgedExternalAI: consent,
            today,
          }),
        }),
        fetch("/api/data").then((r) => r.json()),
      ]);
      const out = await res.json();
      if (!res.ok) {
        // Full detail to the devtools console (Electron: View → Toggle Developer
        // Tools) so the real cause is visible beyond the friendly UI message.
        console.error("[import] parse failed:", res.status, out);
        throw new Error(aiErrorMessage(out.code, lang));
      }
      const r = out as ParseResult;

      // Build a dedup set from this person's existing entries.
      const mine: EntryDTO[] = (data.entries || []).filter((e: EntryDTO) => e.personId === person.id);
      const seen = new Set(mine.map((e) => `${e.itemKey}|${dayKey(e.performedAt)}|${e.valueText ?? ""}`));

      const fr: FRow[] = r.findings.map((f) => {
        const date = f.date ?? r.reportDate ?? today;
        const dup = seen.has(`${f.itemKey}|${dayKey(date)}|${f.valueText}`);
        return { ...f, date, dup, include: !dup };
      });
      const lr: LRow[] = r.labs.map((l) => {
        const date = r.reportDate ?? today;
        const valueText = l.unit ? `${l.value} ${l.unit}` : l.value;
        const dup = seen.has(`lab.${l.slug}|${dayKey(date)}|${valueText}`);
        return { ...l, date, dup, include: !dup };
      });
      const cr: CRow[] = (r.conditions ?? []).map((c) => {
        const date = c.date ?? r.reportDate ?? today;
        const dup = seen.has(`condition.${c.slug}|${dayKey(date)}|${c.label}`);
        return { ...c, date, dup, include: !dup };
      });
      const pr: PRow[] = (r.procedures ?? []).map((p) => {
        const date = p.date ?? r.reportDate ?? today;
        const dup = seen.has(`procedure.${p.slug}|${dayKey(date)}|${p.label}`);
        return { ...p, date, dup, include: !dup };
      });
      setRows(fr);
      setLabRows(lr);
      setCondRows(cr);
      setProcRows(pr);
      setParsed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setParsing(false);
    }
  }

  async function doImport() {
    const entries = [
      ...rows
        .filter((r) => r.include)
        .map((r) => ({
          itemKey: r.itemKey,
          performedAt: new Date(r.date ?? today).toISOString(),
          status: r.status,
          valueText: r.valueText || null,
          notes: r.comment || null,
          source: "imported",
        })),
      ...labRows
        .filter((r) => r.include)
        .map((r) => ({
          itemKey: `lab.${r.slug}`,
          performedAt: new Date(r.date).toISOString(),
          status: r.flag,
          valueText: r.unit ? `${r.value} ${r.unit}` : r.value,
          label: r.label,
          unit: r.unit,
          refText: r.refText,
          panel: r.panel,
          source: "imported",
        })),
      ...condRows
        .filter((r) => r.include)
        .map((r) => ({
          itemKey: `condition.${r.slug}`,
          performedAt: new Date(r.date).toISOString(),
          status: r.status,
          valueText: r.label,
          label: r.label,
          notes: r.note || null,
          source: "imported",
        })),
      ...procRows
        .filter((r) => r.include)
        .map((r) => ({
          itemKey: `procedure.${r.slug}`,
          performedAt: new Date(r.date).toISOString(),
          valueText: r.label,
          label: r.label,
          notes: [r.place, r.note].filter(Boolean).join(" · ") || null,
          source: "imported",
        })),
    ];
    if (entries.length === 0) return;
    setImporting(true);
    try {
      await fetch("/api/entries/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id, entries }),
      });
      onImported();
      onClose();
    } finally {
      setImporting(false);
    }
  }

  const itemName = (key: string) => {
    const it = itemByKey(key);
    return it ? (lang === "zh" ? it.nameZh : it.name) : key;
  };
  const selectedCount =
    rows.filter((r) => r.include).length +
    labRows.filter((r) => r.include).length +
    condRows.filter((r) => r.include).length +
    procRows.filter((r) => r.include).length;

  // Group lab rows by panel for display.
  const labGroups = (() => {
    const m = new Map<LabPanel, { row: LRow; idx: number }[]>();
    labRows.forEach((row, idx) => {
      const p = (row.panel as LabPanel) || "other";
      const a = m.get(p) ?? [];
      a.push({ row, idx });
      m.set(p, a);
    });
    return Array.from(m.entries());
  })();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-[#1f2421]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="card relative max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 soft-shadow fade-up">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[var(--color-accent)]" />
            <h3 className="font-display text-[21px]">{t("importTitle")}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-paper)]">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{t("importHint")}</p>

        {!parsed && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("pasteHere")}
              className="h-28 w-full resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13px]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]">
                {preparing ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                {preparing ? t("preparing") : t("addImages")}
                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  multiple
                  className="hidden"
                  disabled={preparing}
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
              {images.length > 0 && (
                <span className="text-[12.5px] text-[var(--color-muted)]">
                  {images.length} {t("imagesAttached")}
                </span>
              )}
              {images.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-12 w-12 rounded-md border border-[var(--color-line)] object-cover" />
                  <button
                    onClick={() => setImages((cur) => cur.filter((_, idx) => idx !== i))}
                    className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--color-ink)] text-white"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>

            <label className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-[var(--color-muted)]">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>{t("aiConsent")}</span>
            </label>

            {providers.length === 0 && (
              <p className="mt-3 rounded-lg bg-[var(--color-amber-soft)] px-3 py-2 text-[12.5px] text-[#8a6418]">
                {aiErrorMessage("no_key", lang)}
              </p>
            )}
            {error && <p className="mt-3 text-[13px] text-[var(--color-red)]">{error}</p>}

            <div className="mt-4 flex items-center gap-2">
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
                onClick={parse}
                disabled={parsing || !consent || providers.length === 0 || (!text.trim() && images.length === 0)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[13.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {parsing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {parsing ? t("parsing") : t("parse")}
              </button>
            </div>
          </>
        )}

        {parsed && (
          <>
            {rows.length === 0 && labRows.length === 0 && condRows.length === 0 && procRows.length === 0 ? (
              <p className="rounded-lg bg-[var(--color-paper)] p-4 text-[13.5px] text-[var(--color-muted)]">{t("nothingFound")}</p>
            ) : (
              <>
                <p className="mb-3 text-[12.5px] font-medium text-[var(--color-muted)]">{t("reviewBeforeImport")}</p>

                {/* Tracked findings */}
                {rows.length > 0 && (
                  <>
                    <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                      {t("trackedFindings")}
                    </h4>
                    <div className="space-y-2">
                      {rows.map((r, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border p-3 ${r.include ? "border-[var(--color-accent)]/40 bg-[var(--color-paper)]" : "border-[var(--color-line)] opacity-55"}`}
                        >
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={r.include} onChange={(e) => setRows((c) => c.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))} />
                            <span className="text-[14px] font-medium">{itemName(r.itemKey)}</span>
                            {r.dup && <span className="rounded-md bg-[var(--color-gray-soft)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">{t("alreadyLogged")}</span>}
                            <div className="ml-auto flex items-center gap-1.5">
                              <input type="date" value={r.date ?? today} onChange={(e) => setRows((c) => c.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} className="rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-1.5 py-1 text-[12px]" />
                              {r.status && <Dot light={r.status} size={9} />}
                            </div>
                          </div>
                          <input value={r.valueText} onChange={(e) => setRows((c) => c.map((x, j) => (j === i ? { ...x, valueText: e.target.value } : x)))} className="mt-2 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1.5 text-[12.5px]" />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Generic labs (Layer 0 — all captured) */}
                {labRows.length > 0 && (
                  <>
                    <h4 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                      {t("labValues")} ({labRows.length})
                    </h4>
                    <div className="space-y-3">
                      {labGroups.map(([panel, items]) => (
                        <div key={panel}>
                          <p className="mb-1 text-[11.5px] font-medium text-[var(--color-muted)]">{pick(PANEL_META[panel])}</p>
                          <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
                            {items.map(({ row, idx }) => (
                              <label
                                key={idx}
                                className={`flex items-center gap-2 border-b border-[var(--color-line)] px-3 py-2 text-[12.5px] last:border-b-0 ${row.include ? "" : "opacity-50"}`}
                              >
                                <input type="checkbox" checked={row.include} onChange={(e) => setLabRows((c) => c.map((x, j) => (j === idx ? { ...x, include: e.target.checked } : x)))} />
                                {row.flag ? <Dot light={row.flag} size={8} /> : <span className="inline-block h-2 w-2" />}
                                <span className="min-w-0 flex-1 truncate">{row.label}</span>
                                <span className="shrink-0 font-medium">{row.value}{row.unit ? ` ${row.unit}` : ""}</span>
                                {row.refText && <span className="hidden shrink-0 text-[11px] text-[var(--color-faint)] sm:inline">({row.refText})</span>}
                                {row.dup && <span className="shrink-0 rounded bg-[var(--color-gray-soft)] px-1 text-[9.5px] text-[var(--color-muted)]">{t("alreadyLogged")}</span>}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Conditions / diagnoses (Layer 0) */}
                {condRows.length > 0 && (
                  <>
                    <h4 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                      {t("conditionsLabel")}
                    </h4>
                    <div className="space-y-2">
                      {condRows.map((r, i) => (
                        <div key={i} className={`rounded-xl border p-3 ${r.include ? "border-[var(--color-accent)]/40 bg-[var(--color-paper)]" : "border-[var(--color-line)] opacity-55"}`}>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={r.include} onChange={(e) => setCondRows((c) => c.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))} />
                            <input value={r.label} onChange={(e) => setCondRows((c) => c.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="min-w-0 flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1 text-[13.5px] font-medium" />
                            {r.dup && <span className="rounded-md bg-[var(--color-gray-soft)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">{t("alreadyLogged")}</span>}
                            <input type="date" value={r.date} onChange={(e) => setCondRows((c) => c.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} className="rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-1.5 py-1 text-[12px]" />
                          </div>
                          {r.note && <p className="mt-1.5 text-[12px] text-[var(--color-muted)]">{r.note}</p>}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Procedures / surgeries (Layer 0) */}
                {procRows.length > 0 && (
                  <>
                    <h4 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">
                      {t("proceduresLabel")}
                    </h4>
                    <div className="space-y-2">
                      {procRows.map((r, i) => (
                        <div key={i} className={`rounded-xl border p-3 ${r.include ? "border-[var(--color-accent)]/40 bg-[var(--color-paper)]" : "border-[var(--color-line)] opacity-55"}`}>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={r.include} onChange={(e) => setProcRows((c) => c.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))} />
                            <input value={r.label} onChange={(e) => setProcRows((c) => c.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="min-w-0 flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1 text-[13.5px] font-medium" />
                            {r.dup && <span className="rounded-md bg-[var(--color-gray-soft)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">{t("alreadyLogged")}</span>}
                            <input type="date" value={r.date} onChange={(e) => setProcRows((c) => c.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} className="rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-1.5 py-1 text-[12px]" />
                          </div>
                          {(r.place || r.note) && (
                            <p className="mt-1.5 text-[12px] text-[var(--color-muted)]">{[r.place, r.note].filter(Boolean).join(" · ")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--color-line)] py-2 text-[14px] text-[var(--color-muted)]">
                {t("cancel")}
              </button>
              <button
                onClick={doImport}
                disabled={importing || selectedCount === 0}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2 text-[14px] font-medium text-white disabled:opacity-50"
              >
                {importing ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {importing ? t("importing") : `${t("importN")} (${selectedCount})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
