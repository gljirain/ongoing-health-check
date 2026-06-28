import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  EntryDTO,
  HealthItem,
  ItemStatus,
  Lang,
  LAB_PANELS,
  LabPanel,
  Light,
  ParseResult,
  PersonDTO,
  Provider,
  ReviewResult,
} from "./types";
import { getApiKey } from "./settings";
import { HEALTH_ITEMS } from "./catalog";

export type { Provider };

/** Classify a provider/SDK error into a stable code the UI can localize. */
export function aiErrorCode(err: unknown): string {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const status = e?.status ?? e?.statusCode;
  const msg = String(e?.message ?? "");
  if (/No (Anthropic|OpenAI) API key configured/i.test(msg)) return "no_key";
  if (status === 429 || /rate.?limit/i.test(msg)) return "rate_limit";
  if (status === 401 || status === 403 || /invalid x-api-key|authentication|permission/i.test(msg))
    return "auth";
  if (status === 529 || /overloaded/i.test(msg)) return "overloaded";
  if (status === 404 || /model/i.test(msg)) return "model";
  if (typeof status === "number" && status >= 500) return "server";
  return "unknown";
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

const SYSTEM = `You are a careful, evidence-based health-literacy guide embedded in a personal health-check dashboard. Your job is to help the user make their OWN informed trade-offs, not to push a maximalist "do every test" agenda.

For every answer:
- Lead with FIRST PRINCIPLES: the underlying biology/mechanism — why this matters at a causal level, not just "guidelines say so".
- Quantify the RETURN ON INVESTMENT honestly: what does doing (or skipping) this actually buy or cost, in concrete terms (risk reduction, what's caught and when, number-needed-to-screen intuition). Use ranges, and say when evidence is strong vs weak.
- Put RISKS in perspective with relatable comparisons (e.g. compare a one-time sedation risk to everyday exposures like alcohol). Be numerate and calm, never alarmist.
- Respect PERSONAL PREFERENCE and trade-offs. The user explicitly wants to see the cost/benefit and then decide — sometimes the rational choice is to NOT do something. Surface that.
- Be specific to the person's age, sex, and their logged history when given.
- Keep it tight and scannable. Use short paragraphs or bullets. No filler.
- End with: "This is educational, not medical advice — confirm with your clinician."

Never invent specific numbers you're unsure of; prefer well-established ranges and flag uncertainty.`;

const LANG_INSTRUCTION: Record<Lang, string> = {
  zh: `Respond entirely in Simplified Chinese (简体中文), in a natural, clear, non-stiff style. Keep standard medical test names with their common Chinese terms (e.g. 胃镜, 肠镜, 幽门螺杆菌). End with: "以上仅为健康教育内容，不构成医疗建议 — 请与你的医生确认。"`,
  en: `Respond in English. End with: "This is educational, not medical advice — confirm with your clinician."`,
};

/** The grounding context (person + topic + logged data) — no question. */
export function buildContext(args: {
  item?: HealthItem;
  status?: ItemStatus;
  person: PersonDTO;
  ageYears: number;
  history?: EntryDTO[];
}): string {
  const { item, status, person, ageYears, history } = args;
  const parts: string[] = [];
  parts.push(
    `Person: ${person.sex}, age ${ageYears}.${person.notes ? ` Notes: ${person.notes}` : ""}`,
  );
  if (person.riskFactors) {
    parts.push(`Recorded risk factors: ${JSON.stringify(person.riskFactors)}.`);
  }
  if (item) {
    const k = item.knowledge;
    parts.push(
      `Topic: ${item.name} (${item.nameZh}) — category: ${item.category}.`,
      `Curated knowledge already shown to the user:\n- Summary: ${k.summary.en}\n- First principles: ${k.firstPrinciples.en}\n- ROI: ${k.roi.en}\n- Risks: ${k.risks.en}`,
    );
    if (item.decision) {
      const d = item.decision;
      parts.push(
        `A structured decision aid is ALSO already shown to the user — do not just repeat it, build on it:\n- What to check: ${d.whatToCheck.en}\n- ROI: ${d.roi.en}\n- Best approach: ${d.bestApproach.en}\n- Radiation: ${d.radiation.en}\n- Anesthesia: ${d.anesthesia.en}\n- Bottom line: ${d.bottomLine.en}`,
      );
    }
  }
  if (status) {
    parts.push(`Their current status for this item: light=${status.light}; ${status.reason.en}`);
  }
  if (history && history.length) {
    const lines = history
      .slice(0, 6)
      .map((e) => {
        const date = new Date(e.performedAt).toISOString().slice(0, 10);
        const bits = [
          e.status ? `[${e.status}]` : null,
          e.valueText || null,
          e.notes ? `comment: "${e.notes}"` : null,
        ].filter(Boolean);
        return `- ${date}: ${bits.join(" — ") || "logged"}`;
      })
      .join("\n");
    parts.push(
      `The user's OWN logged checks & result comments for this item (use these — tailor the recommendation to what they actually recorded, especially any findings/comments):\n${lines}`,
    );
  } else if (item) {
    parts.push("The user has not logged any check for this item yet.");
  }
  return parts.join("\n\n");
}

/** The synthetic opening ask, prepended so the thread starts with a user turn. */
export const INITIAL_ASK: Record<Lang, string> = {
  zh: "请给我一个针对我的个性化解读：现在是否值得优先处理？对我这样的人，做或不做的真实成本/收益是什么？请超出上面已展示的内容，加入更多深度、数字和取舍框架。",
  en: "Give me a personalized take: is this worth prioritizing now, and what's the honest cost/benefit for someone like me? Go beyond the curated text — add depth, numbers, and the trade-off framing.",
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Continuous, context-grounded insight. `messages` is the full thread to send
 *  (already including the synthetic opening user ask). Returns the assistant reply. */
export async function generateInsight(args: {
  provider: Provider;
  lang?: Lang;
  context: string;
  messages: ChatMessage[];
}): Promise<string> {
  const system = `${SYSTEM}\n\n${LANG_INSTRUCTION[args.lang ?? "zh"]}\n\n# Context about this person and topic (don't just repeat it — reason from it):\n${args.context}`;

  if (args.provider === "anthropic") {
    const key = await getApiKey("anthropic");
    if (!key) throw new Error("No Anthropic API key configured");
    const client = key.startsWith("sk-ant-oat")
      ? new Anthropic({ authToken: key, apiKey: null })
      : new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1600,
      system,
      messages: args.messages,
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  const openaiKey = await getApiKey("openai");
  if (!openaiKey) throw new Error("No OpenAI API key configured");
  const openai = new OpenAI({ apiKey: openaiKey });
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    max_completion_tokens: 4000,
    messages: [{ role: "system", content: system }, ...args.messages],
  });
  return res.choices[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT PARSER — extract structured findings from a report (full OR partial:
// a single result, one area, or a whole 体检报告). Content-driven: only emits
// what's actually present. Always followed by a human confirm step in the UI.
// ─────────────────────────────────────────────────────────────────────────────

function catalogForPrompt(): string {
  return HEALTH_ITEMS.map(
    (i) => `- ${i.key}: ${i.nameZh} / ${i.name} [region: ${i.regionId}; ${i.category}] — covers: ${i.knowledge.summary.en}`,
  ).join("\n");
}

const PARSE_SYSTEM = `You extract structured health data from whatever a user gives you — a single result, one body area, or a full multi-page 体检报告 (Chinese or English, typed text or a photo/scan).

You return FOUR buckets:
1. "findings" — values that map to one of the KNOWN TRACKED ITEMS (by key).
2. "labs" — EVERY OTHER measured value (CBC, liver/kidney panels, electrolytes, tumor markers, vitamins, infectious screens, etc.). Capture these too — do NOT drop them.
3. "conditions" — diagnoses / ongoing conditions stated in the record (e.g. 贲门失弛缓症 achalasia, 高血压, 糖尿病, 萎缩性胃炎). NOT a transient finding — a named condition the person has.
4. "procedures" — operations / surgeries / interventions (e.g. 腹腔镜下食管贲门肌层切开术 Heller myotomy, 胃底折叠术 fundoplication, ESD 息肉切除, 胆囊切除术). This is what an OPERATIVE NOTE / 手术记录 is mostly about — capture it, don't reduce it to a stray number like blood loss.

GLOBAL rules:
- Only emit what is ACTUALLY PRESENT. Never invent or infer missing tests. Partial input → few items; full report → many. Expected.
- Capture EVERY numeric/result line you can see, especially in lab panels. Completeness matters.
- KEEP original numbers, units, and Chinese terms.
- date / reportDate: ISO yyyy-mm-dd if determinable, else null.

For "findings" (mapped): {itemKey, date, status: green|yellow|red|null, valueText, comment, confidence: high|medium|low}.
  status reflects CLINICAL SIGNIFICANCE — how much it should concern the person — NOT merely whether a word other than 正常 appears. Grade it:
  - green = normal / 未见异常, OR a COMMON BENIGN finding that needs no action and carries ~zero concern: 浅表性胃炎/慢性非萎缩性胃炎, 单纯性肝囊肿/肾囊肿, 前列腺钙化, C-TIRADS 1–2 的小甲状腺结节, 轻度乳腺增生, 痔疮, 屈光不正, 良性息肉已完整切除. These have a name but are reassuring.
  - yellow = genuinely worth monitoring or lifestyle action: 萎缩性胃炎/肠化生, 需随访的息肉, 脂肪肝, 处于临界/轻度异常的指标, 较大或可疑的囊肿/结节.
  - red = clearly abnormal or needs prompt follow-up: 异型增生/上皮内瘤变, 可疑占位/恶性, 明显异常, 重要肿瘤标志物明确阳性.
  When unsure, pick the LESS alarming status and set confidence low.

For "labs" (everything else): {slug, label, value, unit, refText, flag, panel}.
  - slug: short lowercase ascii key. USE THESE CANONICAL SLUGS when the marker matches (so values line up across reports): ALT→alt, AST→ast, GGT→ggt, ALP→alp, 总胆红素/TBIL→tbil, 白蛋白→alb, 总蛋白→tp, 肌酐/Cr→creatinine, 尿素/BUN→urea, 尿酸/UA→ua, eGFR→egfr, 葡萄糖/血糖→glu, 总胆固醇/TC→tcho, 甘油三酯/TG→tg, HDL→hdl, 白细胞/WBC→wbc, 红细胞/RBC→rbc, 血红蛋白/HGB→hgb, 血小板/PLT→plt, 钾/K→k, 钠/Na→na, 氯/Cl→cl, 钙/Ca→ca, CEA→cea, AFP→afp, CA19-9→ca199, CA125→ca125, CA72-4→ca724, PSA→psa, TSH→tsh, 游离T4/FT4→ft4, 维生素D/25-OH→vitd, CRP→crp, 血沉/ESR→esr, 同型半胱氨酸→homocysteine, 凝血酶原时间/PT→pt, INR→inr, APTT→aptt, 纤维蛋白原/FIB→fib, 凝血酶时间/TT→tt. For anything else, make a sensible short slug.
  - label: human label incl. Chinese term, e.g. "丙氨酸氨基转移酶 (ALT)".
  - value: as printed (e.g. "42").  unit: e.g. "U/L" or null.  refText: the report's printed reference range, e.g. "0-50" or null.
  - flag: DERIVE from the value vs the printed reference range or the ↑/↓ mark — green = in range; yellow = mildly out; red = clearly out; null if no range given. The lab's own range is the source of truth.
  - panel: one of [lipid, glucose, liver, kidney, electrolyte, blood_count, coagulation, thyroid, tumor_marker, vitamin, inflammation, infection, urine, hormone, other]. Put PT/INR/APTT/纤维蛋白原/TT in "coagulation".

For "conditions": {slug, label, date, status, note}.
  - slug: short ascii key (e.g. "achalasia", "hypertension"). label: keep the Chinese term (e.g. "贲门失弛缓症"). date: when diagnosed if stated, else null. status: usually null (or yellow if active/uncontrolled). note: brief detail.

For "procedures": {slug, label, date, place, note}.
  - slug: short ascii key (e.g. "heller_myotomy"). label: the procedure name, Chinese kept (combine the operations done, e.g. "腹腔镜 Heller 肌层切开术 + 胃底折叠术"). date: operation date. place: hospital. note: key intra-op detail (findings, blood loss, complications) in one short phrase.

Output ONLY a JSON object (no markdown, no prose):
{"reportDate": string|null, "findings": [...], "labs": [...], "conditions": [...], "procedures": [...]}`;

function dataUrlParts(dataUrl: string): { mediaType: string; data: string } {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const m = /^data:([^;]+);base64$/.exec(header);
  if (comma < 0 || !m) return { mediaType: "image/jpeg", data: dataUrl };
  return { mediaType: m[1], data: dataUrl.slice(comma + 1) };
}

function toLight(v: unknown): Light | null {
  return v === "green" || v === "yellow" || v === "red" ? v : null;
}
function toConfidence(v: unknown): "high" | "medium" | "low" {
  return v === "high" || v === "medium" || v === "low" ? v : "low";
}

function coerceParseResult(raw: unknown): ParseResult {
  const knownKeys = new Set(HEALTH_ITEMS.map((i) => i.key));
  const obj = (raw ?? {}) as Record<string, unknown>;
  const findingsIn = Array.isArray(obj.findings) ? obj.findings : [];
  const findings = findingsIn
    .map((f) => f as Record<string, unknown>)
    .filter((f) => typeof f.itemKey === "string" && knownKeys.has(f.itemKey))
    .map((f) => ({
      itemKey: f.itemKey as string,
      date: typeof f.date === "string" && f.date ? f.date.slice(0, 10) : null,
      status: toLight(f.status),
      valueText: typeof f.valueText === "string" ? f.valueText : "",
      comment: typeof f.comment === "string" && f.comment ? f.comment : null,
      confidence: toConfidence(f.confidence),
    }));
  const labsIn = Array.isArray(obj.labs) ? obj.labs : [];
  const labs = labsIn
    .map((l) => l as Record<string, unknown>)
    .filter((l) => typeof l.label === "string" && (typeof l.value === "string" || typeof l.value === "number"))
    .map((l) => {
      const rawSlug = typeof l.slug === "string" && l.slug ? l.slug : String(l.label);
      const slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40) || "lab";
      const panel = LAB_PANELS.includes(l.panel as LabPanel) ? (l.panel as string) : "other";
      return {
        slug,
        label: l.label as string,
        value: String(l.value),
        unit: typeof l.unit === "string" && l.unit ? l.unit : null,
        refText: typeof l.refText === "string" && l.refText ? l.refText : null,
        flag: toLight(l.flag),
        panel,
      };
    });
  const slugify = (s: string, fallback: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || fallback;
  const dateOrNull = (d: unknown) => (typeof d === "string" && d ? d.slice(0, 10) : null);
  const strOrNull = (s: unknown) => (typeof s === "string" && s ? s : null);

  const conditionsIn = Array.isArray(obj.conditions) ? obj.conditions : [];
  const conditions = conditionsIn
    .map((c) => c as Record<string, unknown>)
    .filter((c) => typeof c.label === "string" && c.label)
    .map((c) => ({
      slug: slugify(typeof c.slug === "string" && c.slug ? c.slug : String(c.label), "condition"),
      label: c.label as string,
      date: dateOrNull(c.date),
      status: toLight(c.status),
      note: strOrNull(c.note),
    }));

  const proceduresIn = Array.isArray(obj.procedures) ? obj.procedures : [];
  const procedures = proceduresIn
    .map((p) => p as Record<string, unknown>)
    .filter((p) => typeof p.label === "string" && p.label)
    .map((p) => ({
      slug: slugify(typeof p.slug === "string" && p.slug ? p.slug : String(p.label), "procedure"),
      label: p.label as string,
      date: dateOrNull(p.date),
      place: strOrNull(p.place),
      note: strOrNull(p.note),
    }));

  return {
    reportDate: typeof obj.reportDate === "string" && obj.reportDate ? obj.reportDate.slice(0, 10) : null,
    findings,
    labs,
    conditions,
    procedures,
  };
}

function extractJson(text: string): unknown {
  const fenced = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  const slice = start >= 0 && end > start ? fenced.slice(start, end + 1) : fenced;
  return JSON.parse(slice);
}

export async function parseReport(args: {
  provider: Provider;
  text?: string;
  images?: string[]; // data URLs
  today?: string; // ISO yyyy-mm-dd, for resolving relative dates
}): Promise<ParseResult> {
  const dateLine = args.today
    ? `Today's date is ${args.today}. Resolve ALL relative dates to absolute yyyy-mm-dd: 去年/last year, 前年, 上个月/last month, N年前/N个月前, "去年11月" → that November of last year (use day 01 if only a month is given). Never default a relative date to today.\n\n`
    : "";
  const userText = `${dateLine}KNOWN TRACKED ITEMS (map findings to these keys):\n${catalogForPrompt()}\n\n${
    args.text ? `Report text:\n${args.text}` : "The report is in the attached image(s)."
  }`;

  if (args.provider === "anthropic") {
    const key = await getApiKey("anthropic");
    if (!key) throw new Error("No Anthropic API key configured");
    const client = key.startsWith("sk-ant-oat")
      ? new Anthropic({ authToken: key, apiKey: null })
      : new Anthropic({ apiKey: key });
    const content: Anthropic.ContentBlockParam[] = [];
    for (const img of args.images ?? []) {
      const { mediaType, data } = dataUrlParts(img);
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType as "image/jpeg", data },
      });
    }
    content.push({ type: "text", text: userText });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 8000, // dense multi-page reports emit a lot of JSON — room so it doesn't truncate
      system: PARSE_SYSTEM,
      messages: [{ role: "user", content }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return coerceParseResult(extractJson(text || "{}"));
  }

  const openaiKey = await getApiKey("openai");
  if (!openaiKey) throw new Error("No OpenAI API key configured");
  const openai = new OpenAI({ apiKey: openaiKey });
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: userText },
  ];
  for (const img of args.images ?? []) {
    content.push({ type: "image_url", image_url: { url: img } });
  }
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    // gpt-5.x reasoning tokens draw from this budget; generous so a multi-page
    // report doesn't come back empty (reasoning starved) or truncated.
    max_completion_tokens: 16000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PARSE_SYSTEM },
      { role: "user", content },
    ],
  });
  // `|| "{}"` guards an empty string (reasoning-starved) so we degrade to an
  // empty result instead of crashing on JSON.parse.
  return coerceParseResult(extractJson(res.choices[0]?.message?.content || "{}"));
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — on-demand explainer for a generic lab marker. Authored once for
// BOTH languages, then cached (see /api/explain). LLM-as-lookup of settled
// medical facts — clearly labeled as AI until a human reviews it.
// ─────────────────────────────────────────────────────────────────────────────

const EXPLAIN_SYSTEM = `You explain a single clinical lab marker in plain, first-principles terms for an ordinary but curious person. Keep it to settled, well-established facts (no speculation). Cover, briefly: what it measures, what HIGH and what LOW typically indicate, and why it matters. 2–4 short sentences. Calm and non-alarmist. This is general information about the marker, NOT advice about a specific person's value.

Output ONLY JSON: {"zh": "<简体中文>", "en": "<English>"}`;

export async function explainLab(args: {
  provider: Provider;
  label: string;
  panel?: string;
}): Promise<{ zh: string; en: string }> {
  const prompt = `Lab marker: ${args.label}${args.panel ? ` (panel: ${args.panel})` : ""}. Explain it.`;

  if (args.provider === "anthropic") {
    const key = await getApiKey("anthropic");
    if (!key) throw new Error("No Anthropic API key configured");
    const client = key.startsWith("sk-ant-oat")
      ? new Anthropic({ authToken: key, apiKey: null })
      : new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 700,
      system: EXPLAIN_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const o = extractJson(text) as { zh?: string; en?: string };
    return { zh: o.zh ?? "", en: o.en ?? "" };
  }

  const openaiKey = await getApiKey("openai");
  if (!openaiKey) throw new Error("No OpenAI API key configured");
  const openai = new OpenAI({ apiKey: openaiKey });
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    max_completion_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXPLAIN_SYSTEM },
      { role: "user", content: prompt },
    ],
  });
  const o = extractJson(res.choices[0]?.message?.content ?? "{}") as { zh?: string; en?: string };
  return { zh: o.zh ?? "", en: o.en ?? "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE REVIEW — an advisory second opinion over the WHOLE snapshot. It
// does NOT override the deterministic lights; it surfaces cross-domain reasoning
// the rules engine can't, and PROPOSES structured updates the user confirms.
// ─────────────────────────────────────────────────────────────────────────────

const REVIEW_SYSTEM = `You give a careful, holistic second opinion on ONE person's health snapshot, for an ordinary but curious person who values data and trade-offs. You receive: their profile, every logged entry (findings, labs, conditions, procedures), and the app's CURRENT deterministic assessment (traffic lights + what's due).

Your job is NOT to restate the per-item lights — the app computes those reliably. Add what a rules engine CANNOT:
1. Connect across domains — e.g. a surgery or condition that implies another test was effectively done, or that changes what's needed (a 贲门失弛缓症/achalasia operation almost always includes a pre-op diagnostic 胃镜; achalasia also raises long-term esophageal-cancer risk → periodic surveillance).
2. Spot gaps or redundancies the rules miss.
3. Flag combinations that matter (a condition + a lab + age together).

Rules:
- Ground EVERYTHING in the data given. Never invent results. When you infer something, say it is an INFERENCE and give the clinical reasoning.
- You do NOT override the app's lights. For anything actionable, emit a SUGGESTION the user confirms.
- Use "log_entry" when the data implies a tracked item was effectively done (e.g. infer a 胃镜 from a pre-op workup), so the app reflects it once confirmed. itemKey MUST be a known catalog key (provided) or a condition./procedure./lab. key. Pick a conservative date and a green status unless the data says otherwise.
- Use "note" for advisory points with no single entry to log.
- Calm, non-alarmist, first-principles. Be concise. Write all prose in the requested language.

Output ONLY JSON:
{"overview":"2-4 sentence holistic picture","highlights":[{"title":"...","detail":"...","tone":"good|watch|gap"}],"suggestions":[{"kind":"log_entry","title":"...","rationale":"...","entry":{"itemKey":"gastroscopy","date":"2024-11-01","status":"green","valueText":"...","note":"..."}},{"kind":"note","title":"...","rationale":"..."}]}`;

function coerceReview(raw: unknown): ReviewResult {
  const known = new Set(HEALTH_ITEMS.map((i) => i.key));
  const obj = (raw ?? {}) as Record<string, unknown>;
  const tone = (t: unknown): "good" | "watch" | "gap" => (t === "good" || t === "gap" ? t : "watch");
  const highlights = (Array.isArray(obj.highlights) ? obj.highlights : [])
    .map((h) => h as Record<string, unknown>)
    .filter((h) => typeof h.title === "string")
    .map((h) => ({ title: String(h.title), detail: typeof h.detail === "string" ? h.detail : "", tone: tone(h.tone) }));
  const suggestions = (Array.isArray(obj.suggestions) ? obj.suggestions : [])
    .map((s) => s as Record<string, unknown>)
    .filter((s) => typeof s.title === "string")
    .map((s) => {
      const kind = s.kind === "log_entry" ? "log_entry" : "note";
      const e = (s.entry ?? {}) as Record<string, unknown>;
      const itemKey = typeof e.itemKey === "string" ? e.itemKey : "";
      const validKey = known.has(itemKey) || /^(condition|procedure|lab)\./.test(itemKey);
      const entry =
        kind === "log_entry" && validKey
          ? {
              itemKey,
              date: typeof e.date === "string" && e.date ? e.date.slice(0, 10) : null,
              status: toLight(e.status),
              valueText: typeof e.valueText === "string" ? e.valueText : "",
              note: typeof e.note === "string" && e.note ? e.note : null,
            }
          : undefined;
      // A log_entry whose key didn't validate degrades to a note (still shown).
      return {
        kind: entry ? ("log_entry" as const) : ("note" as const),
        title: String(s.title),
        rationale: typeof s.rationale === "string" ? s.rationale : "",
        entry,
      };
    });
  return { overview: typeof obj.overview === "string" ? obj.overview : "", highlights, suggestions };
}

export async function generateReview(args: {
  provider: Provider;
  lang?: Lang;
  context: string;
}): Promise<ReviewResult> {
  const system = `${REVIEW_SYSTEM}\n\n${LANG_INSTRUCTION[args.lang ?? "zh"]}`;
  const user = args.context;

  if (args.provider === "anthropic") {
    const key = await getApiKey("anthropic");
    if (!key) throw new Error("No Anthropic API key configured");
    const client = key.startsWith("sk-ant-oat")
      ? new Anthropic({ authToken: key, apiKey: null })
      : new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return coerceReview(extractJson(text || "{}"));
  }

  const openaiKey = await getApiKey("openai");
  if (!openaiKey) throw new Error("No OpenAI API key configured");
  const openai = new OpenAI({ apiKey: openaiKey });
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    max_completion_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return coerceReview(extractJson(res.choices[0]?.message?.content || "{}"));
}
