import { EntryDTO, L, LabPanel, Light } from "./types";

/** Bilingual panel labels + display order for the Lab results section. */
export const PANEL_META: Record<LabPanel, L> = {
  lipid: { zh: "血脂", en: "Lipids" },
  glucose: { zh: "血糖", en: "Glucose" },
  liver: { zh: "肝功能", en: "Liver" },
  kidney: { zh: "肾功能", en: "Kidney" },
  electrolyte: { zh: "电解质", en: "Electrolytes" },
  blood_count: { zh: "血常规", en: "Blood count" },
  coagulation: { zh: "凝血功能", en: "Coagulation" },
  thyroid: { zh: "甲状腺", en: "Thyroid" },
  tumor_marker: { zh: "肿瘤标志物", en: "Tumor markers" },
  vitamin: { zh: "维生素 / 矿物质", en: "Vitamins / minerals" },
  inflammation: { zh: "炎症指标", en: "Inflammation" },
  infection: { zh: "感染筛查", en: "Infection screen" },
  urine: { zh: "尿液", en: "Urinalysis" },
  hormone: { zh: "激素", en: "Hormones" },
  other: { zh: "其他指标", en: "Other" },
};

const PANEL_ORDER: LabPanel[] = [
  "lipid",
  "glucose",
  "liver",
  "kidney",
  "thyroid",
  "tumor_marker",
  "vitamin",
  "blood_count",
  "coagulation",
  "electrolyte",
  "inflammation",
  "infection",
  "hormone",
  "urine",
  "other",
];

export interface LabSeries {
  slug: string; // without the "lab." prefix
  itemKey: string; // full "lab.<slug>"
  label: string;
  unit: string | null;
  refText: string | null;
  panel: LabPanel;
  latest: EntryDTO;
  flag: Light;
  history: EntryDTO[]; // newest first
}

export interface LabPanelGroup {
  panel: LabPanel;
  series: LabSeries[];
  /** Worst flag in the panel — for the panel header dot. */
  flag: Light;
}

const sev: Record<Light, number> = { red: 3, yellow: 2, gray: 1, green: 0 };
function worst(a: Light, b: Light): Light {
  return sev[a] >= sev[b] ? a : b;
}

/** Turn a person's generic-lab entries into grouped, deduped series with history. */
export function buildLabPanels(entries: EntryDTO[]): LabPanelGroup[] {
  const labs = entries.filter((e) => e.itemKey.startsWith("lab."));
  const bySlug = new Map<string, EntryDTO[]>();
  for (const e of labs) {
    const arr = bySlug.get(e.itemKey) ?? [];
    arr.push(e);
    bySlug.set(e.itemKey, arr);
  }

  const series: LabSeries[] = [];
  for (const [itemKey, arr] of bySlug) {
    arr.sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
    const latest = arr[0];
    const panel = (latest.panel as LabPanel) || "other";
    series.push({
      slug: itemKey.slice(4),
      itemKey,
      label: latest.label || itemKey.slice(4),
      unit: latest.unit ?? null,
      refText: latest.refText ?? null,
      panel,
      latest,
      flag: (latest.status as Light) || "gray",
      history: arr,
    });
  }

  const groups = new Map<LabPanel, LabSeries[]>();
  for (const s of series) {
    const arr = groups.get(s.panel) ?? [];
    arr.push(s);
    groups.set(s.panel, arr);
  }

  const out: LabPanelGroup[] = [];
  for (const panel of PANEL_ORDER) {
    const arr = groups.get(panel);
    if (!arr || arr.length === 0) continue;
    arr.sort((a, b) => sev[b.flag] - sev[a.flag] || a.label.localeCompare(b.label));
    out.push({ panel, series: arr, flag: arr.reduce<Light>((acc, s) => worst(acc, s.flag), "green") });
  }
  return out;
}
