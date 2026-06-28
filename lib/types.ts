export type Provider = "anthropic" | "openai";
export type Sex = "male" | "female";

/** UI language. Default zh (Mandarin); switchable to en. */
export type Lang = "zh" | "en";
/** A localized string. */
export interface L {
  zh: string;
  en: string;
}
export type Light = "green" | "yellow" | "red" | "gray";
export type Category = "screening" | "biomarker" | "condition" | "lifestyle" | "vaccine";
export type EvidenceStrength = "guideline" | "trial" | "review" | "consensus" | "reference";
export type RiskRequirement = "lung_ldct_high_risk";

export interface BodyRegion {
  id: string;
  name: string;
  nameZh: string;
  /** Marker position on the body-map SVG (viewBox 0 0 200 440). */
  x: number;
  y: number;
}

export interface Knowledge {
  /** One-line plain summary. */
  summary: L;
  /** The first-principles science: mechanism, why it matters biologically. */
  firstPrinciples: L;
  /** Return on doing it — framed as a trade-off you can reason about. */
  roi: L;
  /** Honest downsides / risks, including procedure/anesthesia context. */
  risks: L;
  sources: EvidenceSource[];
}

export interface EvidenceSource {
  label: string;
  url: string;
  year: number;
  region?: string;
  strength: EvidenceStrength;
  note?: string;
}

export interface RiskFactors {
  smoking?: {
    status?: "never" | "former" | "current";
    packYears?: number | null;
    quitYearsAgo?: number | null;
  };
  familyHistory?: {
    colorectalCancer?: boolean;
    breastCancer?: boolean;
    gastricCancer?: boolean;
    prostateCancer?: boolean;
  };
  conditions?: {
    ibd?: boolean;
    hereditaryCancerSyndrome?: boolean;
    sleepApnea?: boolean;
    heartLungDisease?: boolean;
    anesthesiaReaction?: boolean;
  };
  regionOrAncestry?: string | null;
}

/** A relatable risk/benefit magnitude for the "how much should this weigh?" bars.
 *  `weight` is an ILLUSTRATIVE 0–1 reasoning aid (not a literal probability) —
 *  it answers "how much should this actually move my decision", which lets us put
 *  an acute one-time risk and a chronic cumulative one on the same mental scale. */
export interface DecisionComparison {
  label: L;
  weight: number;
  tone: "low" | "medium" | "high";
  detail: L;
}

/** A full, structured decision aid for items where the user is actively weighing
 *  a real choice (e.g. 肠胃镜). Built around the questions an ordinary, curious,
 *  data-trusting person actually asks. */
export interface DecisionGuide {
  /** What this exam actually checks — and the specific gap for this person. */
  whatToCheck: L;
  /** ROI in plain, quantified terms — what doing/skipping it buys or costs. */
  roi: L;
  /** Smartest / least-painful way to do it (sedation, combining, prep). */
  bestApproach: L;
  /** First principles on radiation cost (often: none — it's optical). */
  radiation: L;
  /** First principles on the anesthesia/sedation — mechanism + why reversible. */
  anesthesia: L;
  /** Relatable comparisons for the "how much should each worry weigh" visual. */
  comparisons: DecisionComparison[];
  /** The honest one-paragraph takeaway. */
  bottomLine: L;
}

export interface HealthItem {
  key: string;
  name: string;
  nameZh: string;
  regionId: string;
  category: Category;
  appliesTo?: { sex?: Sex; minAge?: number; maxAge?: number };
  requiresRisk?: RiskRequirement;
  /** Routine cadence in months once relevant (screenings). */
  intervalMonths?: number;
  /** Age at which this screening becomes relevant. */
  startAge?: number;
  /** A superior modality that satisfies this same screening goal — e.g. a recent
   *  colonoscopy supersedes FIT. If any listed item was done within `months`,
   *  this item is "covered" and shouldn't show as due. */
  supersededBy?: { key: string; months: number }[];
  unit?: string;
  /** Rough effort/cost + payoff signal used to surface "low-hanging fruit". */
  effort?: "low" | "medium" | "high";
  payoff?: "low" | "medium" | "high";
  knowledge: Knowledge;
  /** Optional rich decision aid (present for items like 胃镜/肠镜). */
  decision?: DecisionGuide;
}

/** A health finding extracted by the LLM from a report (full or partial). */
export interface ParsedFinding {
  itemKey: string; // one of the catalog keys
  date: string | null; // ISO yyyy-mm-dd if determinable
  status: Light | null; // green=normal, yellow=mild/watch, red=abnormal
  valueText: string; // concise result, original units/terms kept
  comment: string | null; // doctor note / recommendation
  confidence: "high" | "medium" | "low";
}

/** Layer-0: any measured value, captured with the lab's OWN reference data. */
export interface ParsedLab {
  slug: string; // stable key, e.g. "alt"
  label: string; // human label incl. Chinese term
  value: string; // value as printed (keep units/format)
  unit: string | null;
  refText: string | null; // the lab's printed reference range
  flag: Light | null; // normal/high/low derived from value vs range/↑↓
  panel: string; // grouping bucket (liver | kidney | lipid | ...)
}

/** Layer-0: a diagnosis / ongoing condition stated in a record. */
export interface ParsedCondition {
  slug: string; // stable key, e.g. "achalasia"
  label: string; // human label incl. Chinese term, e.g. "贲门失弛缓症"
  date: string | null; // when diagnosed/noted, if determinable
  status: Light | null; // active/managed severity hint (usually null)
  note: string | null; // extra detail
}

/** Layer-0: a procedure / surgery / operation in a record. */
export interface ParsedProcedure {
  slug: string; // stable key, e.g. "heller_myotomy"
  label: string; // human label, e.g. "腹腔镜 Heller 肌层切开术 + 胃底折叠术"
  date: string | null; // when performed
  place: string | null; // hospital / facility
  note: string | null; // findings, blood loss, surgeon, etc.
}

export interface ParseResult {
  /** Mapped to a curated catalog item. */
  findings: ParsedFinding[];
  /** Everything else — captured generically (Layer 0), NOT dropped. */
  labs: ParsedLab[];
  /** Diagnoses / ongoing conditions (Layer 0). */
  conditions: ParsedCondition[];
  /** Procedures / surgeries (Layer 0). */
  procedures: ParsedProcedure[];
  reportDate: string | null;
}

export const LAB_PANELS = [
  "lipid",
  "glucose",
  "liver",
  "kidney",
  "electrolyte",
  "blood_count",
  "coagulation",
  "thyroid",
  "tumor_marker",
  "vitamin",
  "inflammation",
  "infection",
  "urine",
  "hormone",
  "other",
] as const;
export type LabPanel = (typeof LAB_PANELS)[number];

/** AI comprehensive review — advisory overlay over the deterministic assessment. */
export interface ReviewHighlight {
  title: string;
  detail: string;
  tone: "good" | "watch" | "gap";
}
export interface ReviewSuggestion {
  kind: "log_entry" | "note";
  title: string;
  rationale: string;
  /** Present for kind="log_entry": a proposed entry the user can confirm-apply. */
  entry?: {
    itemKey: string; // catalog key (e.g. "gastroscopy") or condition./procedure./lab.
    date: string | null;
    status: Light | null;
    valueText: string;
    note: string | null;
  };
}
export interface ReviewResult {
  overview: string;
  highlights: ReviewHighlight[];
  suggestions: ReviewSuggestion[];
  generatedAt?: string;
}

export interface InsightMessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface PersonDTO {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string;
  isSelf: boolean;
  notes?: string | null;
  riskFactors?: RiskFactors | null;
}

export interface EntryDTO {
  id: string;
  personId: string;
  itemKey: string;
  performedAt: string;
  status?: Light | null;
  valueNum?: number | null;
  valueText?: string | null;
  notes?: string | null;
  source?: string | null;
  // Layer-0 generic-lab fields (present when itemKey starts with "lab.")
  label?: string | null;
  unit?: string | null;
  refText?: string | null;
  panel?: string | null;
}

export interface ItemStatus {
  item: HealthItem;
  light: Light;
  /** Most recent entry for this item, if any. */
  lastEntry?: EntryDTO;
  monthsSince?: number;
  /** Months until / past due (negative = overdue). */
  dueInMonths?: number;
  reason: L;
  /** Higher = better candidate for "low-hanging fruit / high ROI". */
  priority: number;
  /** Why an item is or is not eligible; keeps missing data separate from urgency. */
  eligibility: "eligible" | "not_yet" | "risk_unknown" | "not_applicable";
}
