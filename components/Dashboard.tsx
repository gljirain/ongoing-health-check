"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Pencil,
  Activity,
  ChevronRight,
  Languages,
  Settings,
  FileText,
  FlaskConical,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { BODY_REGIONS } from "@/lib/catalog";
import { EntryDTO, ItemStatus, L, Light, PersonDTO, Provider, RiskFactors } from "@/lib/types";
import { ageYears, aggregateLight, computeAllStatuses } from "@/lib/status";
import { buildLabPanels, LabSeries, PANEL_META } from "@/lib/labs";
import { buildHistory } from "@/lib/history";
import { LangProvider, effortLabel, payoffLabel, useLang } from "@/lib/i18n";
import { BodyMap } from "./BodyMap";
import { ItemDetail } from "./ItemDetail";
import { SettingsModal } from "./SettingsModal";
import { ImportReportModal } from "./ImportReportModal";
import { ReviewModal } from "./ReviewModal";
import { LabDetail } from "./LabDetail";
import { Dot } from "./ui";

export function Dashboard() {
  return (
    <LangProvider>
      <DashboardInner />
    </LangProvider>
  );
}

function DashboardInner() {
  const { lang, setLang, t, pick } = useLang();
  const [people, setPeople] = useState<PersonDTO[]>([]);
  const [entries, setEntries] = useState<EntryDTO[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [personId, setPersonId] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [openLab, setOpenLab] = useState<LabSeries | null>(null);

  async function load() {
    const [d, p] = await Promise.all([
      fetch("/api/data").then((r) => r.json()),
      fetch("/api/providers").then((r) => r.json()),
    ]);
    setPeople(d.people);
    setEntries(d.entries);
    setProviders(p.providers);
    setPersonId((cur) => cur || d.people[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      const [d, p] = await Promise.all([
        fetch("/api/data").then((r) => r.json()),
        fetch("/api/providers").then((r) => r.json()),
      ]);
      if (cancelled) return;
      setPeople(d.people);
      setEntries(d.entries);
      setProviders(p.providers);
      setPersonId((cur) => cur || d.people[0]?.id || "");
      setLoading(false);
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  const person = people.find((p) => p.id === personId);
  const personEntries = useMemo(
    () => entries.filter((e) => e.personId === personId),
    [entries, personId],
  );
  const statuses = useMemo(
    () => (person ? computeAllStatuses(person, personEntries) : []),
    [person, personEntries],
  );

  const regionLights = useMemo(() => {
    const map: Record<string, Light> = {};
    for (const r of BODY_REGIONS) {
      const inRegion = statuses.filter((s) => s.item.regionId === r.id);
      map[r.id] = inRegion.length ? aggregateLight(inRegion) : "gray";
    }
    return map;
  }, [statuses]);

  const counts = useMemo(() => {
    const c: Record<Light, number> = { green: 0, yellow: 0, red: 0, gray: 0 };
    statuses.forEach((s) => (c[s.light] += 1));
    return c;
  }, [statuses]);

  const priorities = useMemo(
    () => statuses.filter((s) => s.priority > 0).sort((a, b) => b.priority - a.priority),
    [statuses],
  );

  const byRegion = useMemo(() => {
    const groups: { region: (typeof BODY_REGIONS)[number]; items: ItemStatus[] }[] = [];
    for (const r of BODY_REGIONS) {
      const items = statuses.filter((s) => s.item.regionId === r.id);
      if (items.length) groups.push({ region: r, items });
    }
    return groups;
  }, [statuses]);

  const labPanels = useMemo(() => buildLabPanels(personEntries), [personEntries]);
  const history = useMemo(() => buildHistory(personEntries), [personEntries]);

  const openStatus = statuses.find((s) => s.item.key === openItem);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-[var(--color-muted)]">
        <Activity className="mr-2 animate-pulse" /> {t("loading")}
      </div>
    );
  }

  return (
    <div className="grain min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-accent)] text-white">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="font-display text-[19px] leading-none">{t("appTitle")}</h1>
              <p className="text-[11.5px] text-[var(--color-muted)]">{t("tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {people.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPersonId(p.id);
                  setSelectedRegion(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  p.id === personId
                    ? "bg-[var(--color-ink)] text-white"
                    : "border border-[var(--color-line)] text-[var(--color-muted)] hover:bg-[var(--color-card)]"
                }`}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => setAdding(true)}
              className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-[var(--color-faint)] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label={t("addPerson")}
            >
              <Plus size={16} />
            </button>
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label="Switch language"
            >
              <Languages size={14} />
              {lang === "zh" ? "EN" : "中文"}
            </button>
            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-line)] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label={t("settings")}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-7">
        {person && (
          <>
            {/* Profile line */}
            <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="font-display text-[28px] leading-tight">{person.name}</h2>
              <span className="text-[15px] text-[var(--color-muted)]">
                {person.sex === "male" ? "♂" : "♀"} · {ageYears(person.birthDate)} {t("yrs")}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
              >
                <Pencil size={12} /> {t("edit")}
              </button>
              <button
                onClick={() => setImporting(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
              >
                <FileText size={12} /> {t("importReport")}
              </button>
              <button
                onClick={() => setReviewing(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
              >
                <Sparkles size={12} /> {t("comprehensiveReview")}
              </button>
              <div className="ml-auto flex items-center gap-3 text-[12.5px] text-[var(--color-muted)]">
                <span className="flex items-center gap-1.5">
                  <Dot light="green" size={8} /> {counts.green} {t("onTrack")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Dot light="yellow" size={8} /> {counts.yellow} {t("watch")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Dot light="red" size={8} /> {counts.red} {t("address")}
                </span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
              {/* Body map */}
              <div className="card soft-shadow flex flex-col p-5">
                <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {t("bodyMap")}
                </p>
                <p className="mb-3 text-[12.5px] text-[var(--color-faint)]">{t("bodyMapHint")}</p>
                <div className="mx-auto h-[420px] w-full max-w-[280px]">
                  <BodyMap
                    regionLights={regionLights}
                    selectedRegion={selectedRegion}
                    onSelect={(r) => {
                      setSelectedRegion(r);
                      document
                        .getElementById(`region-${r}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Low-hanging fruit */}
                <div className="card soft-shadow p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <ArrowUpRight size={17} className="text-[var(--color-accent)]" />
                    <h3 className="font-display text-[19px]">{t("highestRoi")}</h3>
                  </div>
                  <p className="mb-4 text-[13px] text-[var(--color-muted)]">{t("highestRoiHint")}</p>
                  {priorities.length === 0 ? (
                    <p className="text-[14px] text-[var(--color-green)]">{t("nothingPressing")}</p>
                  ) : (
                    <ol className="space-y-2">
                      {priorities.slice(0, 6).map((s, i) => (
                        <li key={s.item.key}>
                          <button
                            onClick={() => setOpenItem(s.item.key)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-left transition hover:border-[var(--color-accent)]"
                          >
                            <span className="font-display text-[16px] text-[var(--color-faint)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <Dot light={s.light} size={10} pulse />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {lang === "zh" ? s.item.nameZh : s.item.name}
                                </span>
                                <span className="text-[12px] text-[var(--color-faint)]">
                                  {lang === "zh" ? s.item.name : s.item.nameZh}
                                </span>
                              </div>
                              <p className="truncate text-[12.5px] text-[var(--color-muted)]">
                                {lang === "zh" ? s.reason.zh : s.reason.en}
                              </p>
                            </div>
                            <div className="hidden shrink-0 items-center gap-1 sm:flex">
                              {s.item.effort && (
                                <span className="rounded-md bg-[var(--color-card)] px-2 py-0.5 text-[10.5px] text-[var(--color-muted)]">
                                  {effortLabel(s.item.effort, lang)}
                                </span>
                              )}
                              {s.item.payoff && (
                                <span className="rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10.5px] text-[var(--color-accent)]">
                                  {payoffLabel(s.item.payoff, lang)}
                                </span>
                              )}
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-[var(--color-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]"
                            />
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* Regions */}
                <div className="space-y-3">
                  {byRegion.map(({ region, items }) => {
                    const light = regionLights[region.id];
                    const isSel = selectedRegion === region.id;
                    return (
                      <div
                        id={`region-${region.id}`}
                        key={region.id}
                        className={`card p-4 transition ${isSel ? "soft-shadow ring-2 ring-[var(--color-accent)]/30" : ""}`}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <Dot light={light} size={10} />
                          <h4 className="font-medium">{lang === "zh" ? region.nameZh : region.name}</h4>
                          <span className="text-[12px] text-[var(--color-faint)]">
                            {lang === "zh" ? region.name : region.nameZh}
                          </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {items.map((s) => (
                            <button
                              key={s.item.key}
                              onClick={() => setOpenItem(s.item.key)}
                              className="flex items-center gap-2.5 rounded-lg border border-[var(--color-line)] px-3 py-2.5 text-left transition hover:bg-[var(--color-paper)]"
                            >
                              <Dot light={s.light} size={9} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[13.5px] font-medium">
                                  {lang === "zh" ? s.item.nameZh : s.item.name}
                                </div>
                                <div className="truncate text-[11.5px] text-[var(--color-muted)]">
                                  {lang === "zh" ? s.reason.zh : s.reason.en}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lab results (Layer 0 — every captured value, grouped by panel) */}
                {labPanels.length > 0 && (
                  <div className="card soft-shadow p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <FlaskConical size={16} className="text-[var(--color-accent)]" />
                      <h3 className="font-display text-[19px]">{t("labResults")}</h3>
                    </div>
                    <p className="mb-4 text-[12.5px] text-[var(--color-muted)]">{t("labResultsHint")}</p>
                    <div className="space-y-3">
                      {labPanels.map((g) => (
                        <div key={g.panel} className="rounded-xl border border-[var(--color-line)] p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Dot light={g.flag} size={9} />
                            <h4 className="text-[13px] font-medium">{pick(PANEL_META[g.panel])}</h4>
                            <span className="text-[11.5px] text-[var(--color-faint)]">{g.series.length}</span>
                          </div>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {g.series.map((s) => (
                              <button
                                key={s.itemKey}
                                onClick={() => setOpenLab(s)}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition hover:bg-[var(--color-paper)]"
                              >
                                <Dot light={s.flag} size={7} />
                                <span className="min-w-0 flex-1 truncate text-[var(--color-muted)]">{s.label}</span>
                                <span className="shrink-0 font-medium">{s.latest.valueText}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical history (Layer 0 — conditions & procedures) */}
                {(history.conditions.length > 0 || history.procedures.length > 0) && (
                  <div className="card soft-shadow p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Stethoscope size={16} className="text-[var(--color-accent)]" />
                      <h3 className="font-display text-[19px]">{t("medicalHistory")}</h3>
                    </div>
                    <div className="space-y-4">
                      {history.procedures.length > 0 && (
                        <div>
                          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">{t("proceduresLabel")}</p>
                          <div className="space-y-2">
                            {history.procedures.map((e) => (
                              <div key={e.id} className="rounded-xl border border-[var(--color-line)] p-3">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[13.5px] font-medium">{e.label}</span>
                                  <span className="shrink-0 text-[11.5px] text-[var(--color-faint)]">{e.date.slice(0, 10)}</span>
                                </div>
                                {e.note && <p className="mt-1 text-[12px] text-[var(--color-muted)]">{e.note}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {history.conditions.length > 0 && (
                        <div>
                          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-faint)]">{t("conditionsLabel")}</p>
                          <div className="space-y-2">
                            {history.conditions.map((e) => (
                              <div key={e.id} className="rounded-xl border border-[var(--color-line)] p-3">
                                <div className="flex items-baseline justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {e.status && <Dot light={e.status as Light} size={8} />}
                                    <span className="text-[13.5px] font-medium">{e.label}</span>
                                  </div>
                                  <span className="shrink-0 text-[11.5px] text-[var(--color-faint)]">{e.date.slice(0, 10)}</span>
                                </div>
                                {e.note && <p className="mt-1 text-[12px] text-[var(--color-muted)]">{e.note}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {openStatus && person && (
        <ItemDetail
          status={openStatus}
          person={person}
          entries={personEntries
            .filter((e) => e.itemKey === openStatus.item.key)
            .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt))}
          providers={providers}
          onClose={() => setOpenItem(null)}
          onChanged={load}
        />
      )}

      {editing && person && (
        <ProfileModal
          person={person}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
      {adding && (
        <ProfileModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSaved={load} />}
      {openLab && <LabDetail series={openLab} providers={providers} onClose={() => setOpenLab(null)} />}
      {importing && person && (
        <ImportReportModal
          person={person}
          providers={providers}
          onClose={() => setImporting(false)}
          onImported={load}
        />
      )}
      {reviewing && person && (
        <ReviewModal person={person} providers={providers} onClose={() => setReviewing(false)} onApplied={load} />
      )}
    </div>
  );
}

// ── Add / edit person ──────────────────────────────────────────────────────
const RF_LABELS: Record<string, L> = {
  riskFactors: { zh: "风险因素", en: "Risk factors" },
  smoking: { zh: "吸烟", en: "Smoking" },
  never: { zh: "从不", en: "Never" },
  former: { zh: "已戒", en: "Former" },
  current: { zh: "目前吸烟", en: "Current" },
  packYears: { zh: "包·年", en: "Pack-years" },
  yearsQuit: { zh: "戒烟年数", en: "Years quit" },
  colorectalCancer: { zh: "家族结直肠癌史", en: "Family colorectal cancer" },
  breastCancer: { zh: "家族乳腺癌史", en: "Family breast cancer" },
  gastricCancer: { zh: "家族胃癌史", en: "Family gastric cancer" },
  prostateCancer: { zh: "家族前列腺癌史", en: "Family prostate cancer" },
  sleepApnea: { zh: "睡眠呼吸暂停", en: "Sleep apnea" },
  heartLungDisease: { zh: "心肺疾病", en: "Heart/lung disease" },
  anesthesiaReaction: { zh: "既往麻醉不良反应", en: "Prior anesthesia reaction" },
};

function ProfileModal({
  person,
  onClose,
  onSaved,
}: {
  person?: PersonDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang, t, pick } = useLang();
  const [name, setName] = useState(person?.name ?? "");
  const [sex, setSex] = useState<"male" | "female">(person?.sex ?? "male");
  const [dob, setDob] = useState(person ? person.birthDate.slice(0, 10) : "1990-01-01");
  const [smokingStatus, setSmokingStatus] = useState<"never" | "former" | "current">(
    person?.riskFactors?.smoking?.status ?? "never",
  );
  const [packYears, setPackYears] = useState(String(person?.riskFactors?.smoking?.packYears ?? 0));
  const [quitYearsAgo, setQuitYearsAgo] = useState(
    String(person?.riskFactors?.smoking?.quitYearsAgo ?? ""),
  );
  const [familyHistory, setFamilyHistory] = useState({
    colorectalCancer: person?.riskFactors?.familyHistory?.colorectalCancer ?? false,
    breastCancer: person?.riskFactors?.familyHistory?.breastCancer ?? false,
    gastricCancer: person?.riskFactors?.familyHistory?.gastricCancer ?? false,
    prostateCancer: person?.riskFactors?.familyHistory?.prostateCancer ?? false,
  });
  const [conditions, setConditions] = useState({
    sleepApnea: person?.riskFactors?.conditions?.sleepApnea ?? false,
    heartLungDisease: person?.riskFactors?.conditions?.heartLungDisease ?? false,
    anesthesiaReaction: person?.riskFactors?.conditions?.anesthesiaReaction ?? false,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const riskFactors: RiskFactors = {
        smoking: {
          status: smokingStatus,
          packYears: Number.parseFloat(packYears) || 0,
          quitYearsAgo: smokingStatus === "former" ? Number.parseFloat(quitYearsAgo) || 0 : null,
        },
        familyHistory,
        conditions,
      };
      if (person) {
        await fetch(`/api/people/${person.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, sex, birthDate: new Date(dob).toISOString(), riskFactors }),
        });
      } else {
        await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, sex, birthDate: new Date(dob).toISOString(), riskFactors }),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-[#1f2421]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="card relative max-h-[92vh] w-full max-w-lg overflow-y-auto p-6 soft-shadow fade-up">
        <h3 className="font-display text-[21px]">{person ? t("editProfile") : t("addPerson")}</h3>
        <p className="mb-4 text-[13px] text-[var(--color-muted)]">{t("profileHint")}</p>
        <div className="space-y-3">
          <label className="block text-[12px] text-[var(--color-muted)]">
            {t("name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px]"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex-1 text-[12px] text-[var(--color-muted)]">
              {t("sex")}
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as "male" | "female")}
                className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px]"
              >
                <option value="male">{t("male")}</option>
                <option value="female">{t("female")}</option>
              </select>
            </label>
            <label className="flex-1 text-[12px] text-[var(--color-muted)]">
              {t("dob")}
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px]"
              />
            </label>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
            <p className="mb-2 text-[12px] font-medium text-[var(--color-muted)]">
              {pick(RF_LABELS.riskFactors)}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-[12px] text-[var(--color-muted)]">
                {pick(RF_LABELS.smoking)}
                <select
                  value={smokingStatus}
                  onChange={(e) => setSmokingStatus(e.target.value as typeof smokingStatus)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1.5 text-[13px]"
                >
                  <option value="never">{pick(RF_LABELS.never)}</option>
                  <option value="former">{pick(RF_LABELS.former)}</option>
                  <option value="current">{pick(RF_LABELS.current)}</option>
                </select>
              </label>
              <label className="text-[12px] text-[var(--color-muted)]">
                {pick(RF_LABELS.packYears)}
                <input
                  inputMode="decimal"
                  value={packYears}
                  onChange={(e) => setPackYears(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1.5 text-[13px]"
                />
              </label>
              <label className="text-[12px] text-[var(--color-muted)]">
                {pick(RF_LABELS.yearsQuit)}
                <input
                  inputMode="decimal"
                  disabled={smokingStatus !== "former"}
                  value={quitYearsAgo}
                  onChange={(e) => setQuitYearsAgo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1.5 text-[13px] disabled:opacity-45"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-2 text-[12.5px] text-[var(--color-muted)] sm:grid-cols-2">
              {(["colorectalCancer", "breastCancer", "gastricCancer", "prostateCancer"] as const).map(
                (key) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={familyHistory[key]}
                      onChange={(e) =>
                        setFamilyHistory((cur) => ({ ...cur, [key]: e.target.checked }))
                      }
                    />
                    {pick(RF_LABELS[key])}
                  </label>
                ),
              )}
              {(["sleepApnea", "heartLungDisease", "anesthesiaReaction"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={conditions[key]}
                    onChange={(e) => setConditions((cur) => ({ ...cur, [key]: e.target.checked }))}
                  />
                  {pick(RF_LABELS[key])}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--color-line)] py-2 text-[14px] text-[var(--color-muted)]"
          >
            {t("cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving || !name}
            className="flex-1 rounded-lg bg-[var(--color-accent)] py-2 text-[14px] font-medium text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
