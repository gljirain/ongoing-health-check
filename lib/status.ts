import { EntryDTO, HealthItem, ItemStatus, L, Light, PersonDTO, RiskRequirement } from "./types";
import { itemByKey, itemsForPerson } from "./catalog";

export function ageYears(birthDate: string | Date, now = new Date()): number {
  const b = new Date(birthDate);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function monthsBetween(from: string | Date, to = new Date()): number {
  const f = new Date(from);
  return (
    (to.getFullYear() - f.getFullYear()) * 12 +
    (to.getMonth() - f.getMonth()) +
    (to.getDate() - f.getDate()) / 30.4
  );
}

const SEVERITY: Record<Light, number> = { red: 3, yellow: 2, gray: 1, green: 0 };
const PAYOFF: Record<string, number> = { high: 3, medium: 2, low: 1 };
const EASE: Record<string, number> = { low: 3, medium: 2, high: 1 };

/** Compute the traffic light + ROI priority for one item, given a person's entries. */
export function computeItemStatus(
  item: HealthItem,
  entries: EntryDTO[],
  person: PersonDTO,
  now = new Date(),
): ItemStatus {
  const mine = entries
    .filter((e) => e.itemKey === item.key)
    .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt));
  const lastEntry = mine[0];
  const age = ageYears(person.birthDate, now);
  const monthsSince = lastEntry ? monthsBetween(lastEntry.performedAt, now) : undefined;

  let light: Light = "gray";
  let reason: L = { zh: "", en: "" };
  let dueInMonths: number | undefined;
  let eligibility: ItemStatus["eligibility"] = "eligible";

  const startAge = item.startAge ?? 0;
  const risk = evaluateRiskRequirement(item.requiresRisk, person);

  if (risk === "unknown") {
    eligibility = "risk_unknown";
    reason = riskUnknownReason(item.requiresRisk);
    const payoff = PAYOFF[item.payoff ?? "medium"];
    const ease = EASE[item.effort ?? "medium"];
    return {
      item,
      light: "gray",
      lastEntry,
      monthsSince,
      dueInMonths,
      reason,
      priority: payoff + ease,
      eligibility,
    };
  }

  if (risk === "not_applicable") {
    eligibility = "not_applicable";
    return {
      item,
      light: "gray",
      lastEntry,
      monthsSince,
      dueInMonths,
      reason: {
        zh: "根据已记录的风险信息，暂不适用。",
        en: "Not indicated from the risk data recorded.",
      },
      priority: 0,
      eligibility,
    };
  }

  // Supersession: a superior modality satisfies this same screening goal, so a
  // lesser one shouldn't show as due. E.g. a recent colonoscopy supersedes FIT/DRE —
  // colonoscopy both sees and removes polyps; FIT only triages toward it.
  if (item.supersededBy?.length) {
    for (const s of item.supersededBy) {
      const sup = entries
        .filter((e) => e.itemKey === s.key)
        .sort((a, b) => +new Date(b.performedAt) - +new Date(a.performedAt))[0];
      if (!sup) continue;
      const since = monthsBetween(sup.performedAt, now);
      if (since > s.months) continue;
      const supName = itemByKey(s.key);
      return {
        item,
        light: "green",
        lastEntry,
        monthsSince,
        dueInMonths: s.months - since,
        reason: {
          zh: `已由${supName?.nameZh ?? "更全面的检查"}覆盖（${fmtMonths(since, "zh")}前）— 更全面的检查，无需单独做此项；按其复查计划即可。`,
          en: `Covered by your ${supName?.name ?? "more complete test"} (${fmtMonths(since, "en")} ago) — the definitive test; this one isn't needed separately. Follow that test's schedule.`,
        },
        priority: 0,
        eligibility: "eligible",
      };
    }
  }

  if (item.category === "condition") {
    if (lastEntry) {
      light = (lastEntry.status as Light) || "yellow";
      reason = {
        zh: `${fmtMonths(monthsSince!, "zh")}前记录 — 关注趋势变化。`,
        en: `Recorded ${fmtMonths(monthsSince!, "en")} ago — keep an eye on the trend.`,
      };
      if (item.intervalMonths) dueInMonths = item.intervalMonths - monthsSince!;
    } else {
      light = "gray";
      reason = { zh: "此人暂无相关记录。", en: "Not recorded for this person." };
    }
  } else if (item.category === "lifestyle") {
    if (lastEntry) {
      light = (lastEntry.status as Light) || "green";
      reason = {
        zh: `上次自查于${fmtMonths(monthsSince!, "zh")}前。`,
        en: `Last self-check ${fmtMonths(monthsSince!, "en")} ago.`,
      };
    } else {
      light = "gray";
      reason = {
        zh: "尚未记录自查 — 随时可以快速完成一次。",
        en: "No self-check logged — quick to do anytime.",
      };
    }
  } else {
    // screening / biomarker / vaccine
    if (lastEntry) {
      // They've done it at least once — judge by recency/interval, NOT the age
      // gate. (Having done a scope at 31 doesn't become irrelevant because the
      // routine start age is 40.)
      if (item.intervalMonths) {
        dueInMonths = item.intervalMonths - monthsSince!;
        const overdue = -dueInMonths;
        if (overdue <= 0) {
          light = "green";
          reason = {
            zh: `${fmtMonths(monthsSince!, "zh")}前做过 — 距下次建议还有${fmtMonths(dueInMonths, "zh")}。`,
            en: `Done ${fmtMonths(monthsSince!, "en")} ago — next due in ${fmtMonths(dueInMonths, "en")}.`,
          };
        } else if (overdue <= item.intervalMonths * 0.5) {
          light = "yellow";
          reason = {
            zh: `已超出建议间隔${fmtMonths(overdue, "zh")}。`,
            en: `${fmtMonths(overdue, "en")} past the suggested interval.`,
          };
        } else {
          light = "red";
          reason = {
            zh: `已超期${fmtMonths(overdue, "zh")} — 明显值得安排。`,
            en: `${fmtMonths(overdue, "en")} overdue — clearly worth scheduling.`,
          };
        }
      } else {
        light = "green";
        reason = {
          zh: `${fmtMonths(monthsSince!, "zh")}前记录过。`,
          en: `Recorded ${fmtMonths(monthsSince!, "en")} ago.`,
        };
      }
    } else if (age < startAge) {
      light = "gray";
      eligibility = "not_yet";
      reason = {
        zh: `尚未到期 — 常规筛查约从 ${startAge} 岁开始。`,
        en: `Not yet due — routine screening starts around age ${startAge}.`,
      };
    } else {
      light = item.payoff === "high" ? "red" : "yellow";
      reason = {
        zh: "从未记录且按年龄已到期 — 值得处理。",
        en: "Never recorded and due by your age — worth addressing.",
      };
    }
  }

  // A logged result can ESCALATE the light (e.g. a polyp/abnormal finding), and
  // IS the standing state for conditions/lifestyle. But a normal screening result
  // years ago must NOT keep a now-overdue item green — so for screenings we only
  // let the logged status push the light toward more attention, never less.
  if (lastEntry?.status) {
    const logged = lastEntry.status as Light;
    if (item.category === "condition" || item.category === "lifestyle") {
      light = logged;
    } else if (SEVERITY[logged] > SEVERITY[light]) {
      // The RESULT (not the timing) is driving the light — say so, otherwise a
      // freshly-done check showing yellow looks contradictory next to "next due in 3y".
      light = logged;
      const tail =
        logged === "red"
          ? { zh: "本次结果异常，建议跟进（见下方记录）。", en: "the logged result is flagged — worth following up (see record below)." }
          : { zh: "本次结果值得关注（见下方记录）。", en: "the logged result is worth a look (see record below)." };
      reason = {
        zh: `${reason.zh.replace(/[。.]$/, "")}；不过${tail.zh}`,
        en: `${reason.en.replace(/[。.]$/, "")} — but ${tail.en}`,
      };
    }
  }

  // Priority = how much you'd gain by acting now. Severity × value × ease.
  const sev = SEVERITY[light];
  const payoff = PAYOFF[item.payoff ?? "medium"];
  const ease = EASE[item.effort ?? "medium"];
  const priority = sev > 0 ? sev * 3 + payoff * 2 + ease : 0;

  return { item, light, lastEntry, monthsSince, dueInMonths, reason, priority, eligibility };
}

export function computeAllStatuses(
  person: PersonDTO,
  entries: EntryDTO[],
  now = new Date(),
): ItemStatus[] {
  const items = itemsForPerson(person.sex, ageYears(person.birthDate, now));
  return items.map((it) => computeItemStatus(it, entries, person, now));
}

/** Worst light across a set — for coloring a body region. */
export function aggregateLight(statuses: ItemStatus[]): Light {
  const order: Light[] = ["red", "yellow", "green", "gray"];
  for (const l of order) if (statuses.some((s) => s.light === l)) return l;
  return "gray";
}

function fmtMonths(m: number, lang: "zh" | "en"): string {
  const abs = Math.abs(Math.round(m));
  if (lang === "zh") {
    if (abs < 1) return "不到 1 个月";
    if (abs < 12) return `${abs} 个月`;
    const y = Math.floor(abs / 12);
    const r = abs % 12;
    return r ? `${y} 年 ${r} 个月` : `${y} 年`;
  }
  if (abs < 1) return "under a month";
  if (abs < 12) return `${abs} mo`;
  const y = Math.floor(abs / 12);
  const r = abs % 12;
  return r ? `${y}y ${r}mo` : `${y}y`;
}

function evaluateRiskRequirement(
  requirement: RiskRequirement | undefined,
  person: PersonDTO,
): "eligible" | "not_applicable" | "unknown" {
  if (!requirement) return "eligible";

  if (requirement === "lung_ldct_high_risk") {
    const smoking = person.riskFactors?.smoking;
    if (!smoking?.status) return "unknown";
    if (smoking.status === "never") return "not_applicable";

    const packYears = smoking.packYears;
    if (packYears == null) return "unknown";
    if (packYears < 20) return "not_applicable";

    if (smoking.status === "current") return "eligible";
    if (smoking.quitYearsAgo == null) return "unknown";
    return smoking.quitYearsAgo <= 15 ? "eligible" : "not_applicable";
  }

  return "unknown";
}

function riskUnknownReason(requirement: RiskRequirement | undefined): L {
  if (requirement === "lung_ldct_high_risk") {
    return {
      zh: "需要先填写吸烟史 — 低剂量CT只推荐给高风险的现/曾吸烟者。",
      en: "Needs smoking history first — LDCT is only recommended for high-risk current/former smokers.",
    };
  }
  return {
    zh: "需要先补充风险因素信息才能分类。",
    en: "Needs risk-factor data before this can be classified.",
  };
}
