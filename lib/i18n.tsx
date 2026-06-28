"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { L, Lang } from "./types";

/** Pick the right language from a localized string. */
export function pick(l: L, lang: Lang): string {
  return lang === "zh" ? l.zh : l.en;
}

// ── UI chrome strings ────────────────────────────────────────────────────────
const STRINGS = {
  appTitle: { zh: "持续健康检查", en: "Ongoing Health Check" },
  tagline: { zh: "第一性原理 · 看清回报 · 你来决定", en: "First-principles. ROI-aware. Your call." },
  loading: { zh: "正在加载你的健康地图…", en: "Loading your health map…" },
  bodyMap: { zh: "身体地图", en: "Body map" },
  bodyMapHint: { zh: "点击圆点跳转到对应部位。", en: "Tap a marker to jump to that area." },
  highestRoi: { zh: "回报最高的行动", en: "Highest-ROI moves" },
  highestRoiHint: {
    zh: "按「收益 × 容易程度 × 紧迫性」排序 — 先摘最低的果子。不求面面俱到，只抓真正有用的。",
    en: "Ranked by payoff × ease × urgency — the low-hanging fruit first. Not everything, just what moves the needle.",
  },
  nothingPressing: {
    zh: "暂无紧要事项 — 状态不错，保持例行检查的节奏即可。",
    en: "Nothing pressing — you're in good shape. Keep the routine checks ticking.",
  },
  onTrack: { zh: "正常", en: "on track" },
  watch: { zh: "关注", en: "watch" },
  address: { zh: "待处理", en: "address" },
  edit: { zh: "编辑", en: "edit" },
  yrs: { zh: "岁", en: "yrs" },
  effort: { zh: "省力", en: "effort" },
  payoff: { zh: "收益", en: "payoff" },
  effortLevels: { low: { zh: "省事", en: "low effort" }, medium: { zh: "中等麻烦", en: "medium effort" }, high: { zh: "较费事", en: "high effort" } },
  payoffLevels: { low: { zh: "收益低", en: "low payoff" }, medium: { zh: "收益中", en: "medium payoff" }, high: { zh: "收益高", en: "high payoff" } },
  // Item detail
  yourRecord: { zh: "你的记录 · 推荐依据", en: "Your record · drives the recommendation" },
  logLastCheck: { zh: "记录上次检查", en: "Log last check" },
  updateLog: { zh: "更新 / 记录", en: "Update / log" },
  noCheckYet: {
    zh: "尚未记录 — 填上你最近一次的结果和医生的评语，推荐（以及 AI 解读）会基于它调整。",
    en: "No check logged yet — add your last result and the doctor's comment so the recommendation (and the AI read) reflect it.",
  },
  dateOfCheck: { zh: "检查日期", en: "Date of check" },
  result: { zh: "结果", en: "Result" },
  autoByInterval: { zh: "自动（按间隔）", en: "Auto (by interval)" },
  greenNormal: { zh: "绿 — 正常", en: "Green — normal" },
  yellowWatch: { zh: "黄 — 观察", en: "Yellow — watch" },
  redAbnormal: { zh: "红 — 异常", en: "Red — abnormal" },
  findingsPlaceholder: {
    zh: "结果 / 发现（如：无息肉、LDL 3.4、轻度胃炎）",
    en: "Result / findings (e.g. no polyps, LDL 3.4, mild gastritis)",
  },
  commentPlaceholder: {
    zh: "结果评语 — 医生怎么说？（如：幽门螺杆菌已根除，1年后复查）",
    en: "Result comment — what did the doctor say? (e.g. H. pylori treated, recheck in 1y)",
  },
  saveCheck: { zh: "保存", en: "Save check" },
  saving: { zh: "保存中…", en: "Saving…" },
  history: { zh: "历史记录", en: "History" },
  noChecksLogged: { zh: "暂无记录。", en: "No checks logged yet." },
  // Knowledge sections
  firstPrinciples: { zh: "第一性原理", en: "First principles" },
  returnOnDoing: { zh: "做它的回报", en: "Return on doing it" },
  risksTradeoffs: { zh: "风险与取舍", en: "Risks & trade-offs" },
  // Decision block
  makeDecision: { zh: "做决定", en: "Make the decision" },
  whatToCheckGap: { zh: "查什么 — 以及你的缺口", en: "What to check — and your gap" },
  sedationRead: { zh: "你的档案 · 麻醉评估", en: "Your profile · sedation read" },
  smartestWay: { zh: "最省事 / 最不受罪的做法", en: "Smartest / least-painful way" },
  radiation: { zh: "辐射", en: "Radiation" },
  anesthesia: { zh: "麻醉", en: "Anesthesia" },
  worryWeigh: { zh: "每种担忧该占多大分量？", en: "How much should each worry actually weigh?" },
  worryWeighHint: {
    zh: "示意性的推理辅助 — 表示对决定的相对影响，不是精确概率。",
    en: "An illustrative reasoning aid — relative weight on your decision, not exact probabilities.",
  },
  none: { zh: "无", en: "none" },
  bottomLineForYou: { zh: "给你的结论", en: "Bottom line for you" },
  // AI
  askAi: { zh: "让 AI 给你个性化解读", en: "Ask AI for a personalized read" },
  aiNoKeys: {
    zh: "在 .env 中配置 ANTHROPIC_API_KEY 或 OPENAI_API_KEY 即可启用实时深度解读。",
    en: "Add an ANTHROPIC_API_KEY or OPENAI_API_KEY to .env to enable live deep-dives.",
  },
  aiPlaceholder: {
    zh: "例如：「以我的年龄，麻醉的真实风险有多大？」（可不填 — 留空则生成针对你的综合解读）",
    en: `e.g. "What's the real risk of the 麻醉 for me at my age?" (optional — leave blank for a tailored overview)`,
  },
  aiConsent: {
    zh: "我了解：本次请求会把该档案的年龄、性别、风险因素、相关检查记录和我的问题发送给所选的 AI 服务商。",
    en: "I understand this sends this profile's age, sex, risk factors, logged item history, and my question to the selected AI provider for this response.",
  },
  getInsight: { zh: "获取解读", en: "Get insight" },
  thinking: { zh: "思考中…", en: "Thinking…" },
  followUpPlaceholder: { zh: "追问…（会记得上面的对话）", en: "Ask a follow-up… (it remembers this thread)" },
  send: { zh: "发送", en: "Send" },
  regenerate: { zh: "重新生成", en: "Regenerate" },
  youLabel: { zh: "你", en: "You" },
  savedThread: { zh: "已保存 · 下次自动恢复", en: "Saved · restored next time" },
  // Profile modal
  editProfile: { zh: "编辑档案", en: "Edit profile" },
  addPerson: { zh: "添加成员", en: "Add a person" },
  profileHint: { zh: "年龄和性别决定哪些筛查与你相关。", en: "Age & sex decide which screenings become relevant." },
  name: { zh: "称呼", en: "Name" },
  namePlaceholder: { zh: "如：妈妈、女朋友、妹妹", en: "e.g. Mom, GF, Sister" },
  sex: { zh: "性别", en: "Sex" },
  male: { zh: "男", en: "Male" },
  female: { zh: "女", en: "Female" },
  dob: { zh: "出生日期", en: "Date of birth" },
  cancel: { zh: "取消", en: "Cancel" },
  save: { zh: "保存", en: "Save" },
  // AI errors (friendly, by code)
  errNoKey: {
    zh: "还没有配置 AI 密钥。点右上角 ⚙️ 设置，填入你自己的 Anthropic 或 OpenAI 密钥即可使用。",
    en: "No AI key set yet. Click ⚙️ Settings (top-right) and add your own Anthropic or OpenAI key to use this.",
  },
  errRateLimit: {
    zh: "AI 服务暂时限流了，请过一会儿再试（或在设置里换一个服务商/密钥）。",
    en: "The AI provider is rate-limiting right now — wait a moment and retry (or switch provider/key in Settings).",
  },
  errAuth: {
    zh: "密钥无效或无权限。请在 ⚙️ 设置里检查你的 API 密钥。注意：Claude Code 的 OAuth 令牌不适用，需要标准的 sk-ant-api03 密钥。",
    en: "The key is invalid or unauthorized. Check your API key in ⚙️ Settings. (Note: a Claude Code OAuth token won't work — use a standard sk-ant-api03 key.)",
  },
  errOverloaded: {
    zh: "AI 服务当前繁忙，请稍后再试。",
    en: "The AI service is busy right now — please try again shortly.",
  },
  errModel: {
    zh: "模型不可用。请在 .env 里把 OPENAI_MODEL / ANTHROPIC_MODEL 改成你账号支持的模型。",
    en: "Model unavailable. Set OPENAI_MODEL / ANTHROPIC_MODEL (in .env) to a model your account supports.",
  },
  errServer: { zh: "AI 服务出错了，请稍后再试。", en: "The AI service errored — please try again later." },
  errUnknown: { zh: "AI 请求失败，请重试。", en: "AI request failed — please try again." },
  // Import report
  importReport: { zh: "导入报告", en: "Import report" },
  importTitle: { zh: "从体检报告导入", en: "Import from a health report" },
  importHint: {
    zh: "粘贴结果文字，或上传报告照片/截图/PDF — 整套体检或单项结果都可以。AI 会提取数据，你确认后再保存。",
    en: "Paste result text or upload a photo / screenshot / PDF — a full checkup or a single result both work. AI extracts the data; you confirm before anything is saved.",
  },
  pasteHere: { zh: "在此粘贴报告文字（可选）", en: "Paste report text here (optional)" },
  addImages: { zh: "添加照片 / PDF", en: "Add photo / PDF" },
  preparing: { zh: "正在处理…", en: "Preparing…" },
  medicalHistory: { zh: "病史", en: "Medical history" },
  conditionsLabel: { zh: "诊断 / 慢性病", en: "Conditions" },
  proceduresLabel: { zh: "手术 / 操作", en: "Procedures" },
  noHistory: { zh: "暂无病史记录 — 上传手术记录或病历即可。", en: "No history yet — upload an operative note or record." },
  comprehensiveReview: { zh: "AI 综合评估", en: "AI comprehensive review" },
  reviewSubtitle: {
    zh: "AI 通读你的整体快照，补充规则引擎看不到的跨领域关联 — 仅作参考，不会自动改写状态。",
    en: "AI reads your whole snapshot and adds the cross-domain connections the rules can't see — advisory only; it never silently changes a light.",
  },
  reviewOverviewLabel: { zh: "总体印象", en: "Overview" },
  reviewHighlightsLabel: { zh: "要点 / 缺口", en: "Highlights & gaps" },
  reviewSuggestionsLabel: { zh: "建议（需你确认）", en: "Suggestions (you confirm)" },
  applySuggestion: { zh: "记录这条", en: "Log this" },
  applied: { zh: "已记录", en: "Logged" },
  runReview: { zh: "生成综合评估", en: "Run review" },
  reviewDisclaimer: {
    zh: "这是 AI 的第二意见，基于你已记录的数据推理，可能出错；交通灯仍由确定性规则计算。",
    en: "This is an AI second opinion reasoning over your logged data; it can be wrong. The traffic lights remain rule-computed.",
  },
  imagesAttached: { zh: "已添加图片", en: "images attached" },
  parse: { zh: "提取数据", en: "Extract data" },
  parsing: { zh: "正在提取…", en: "Extracting…" },
  reviewBeforeImport: { zh: "确认后导入 — 可编辑或取消勾选", en: "Review before importing — edit or uncheck any row" },
  nothingFound: { zh: "未能识别出可记录的检查结果。试试更清晰的照片或粘贴文字。", en: "No recordable findings detected. Try a clearer photo or paste the text." },
  trackedFindings: { zh: "重点项目", en: "Tracked items" },
  labValues: { zh: "检测指标（全部捕获）", en: "Lab values (all captured)" },
  alreadyLogged: { zh: "已存在", en: "already logged" },
  importN: { zh: "导入选中的", en: "Import selected" },
  importing: { zh: "导入中…", en: "Importing…" },
  importedN: { zh: "已导入", en: "Imported" },
  colItem: { zh: "项目", en: "Item" },
  colDate: { zh: "日期", en: "Date" },
  colResult: { zh: "结果", en: "Result" },
  colFinding: { zh: "数值 / 发现", en: "Value / finding" },
  lowConfidence: { zh: "低置信", en: "low confidence" },
  // Lab results section
  labResults: { zh: "实验室指标", en: "Lab results" },
  labResultsHint: {
    zh: "从报告导入的全部检测值，按面板分组。参考范围与正常/异常判定来自报告本身。",
    en: "Every value imported from reports, grouped by panel. Reference ranges and the normal/abnormal flag come from the report itself.",
  },
  noLabs: {
    zh: "还没有检测值 — 用上方「导入报告」从体检报告一键提取。",
    en: "No lab values yet — use Import report above to pull them from a checkup.",
  },
  referenceRange: { zh: "参考范围", en: "Reference" },
  measurements: { zh: "次记录", en: "records" },
  explain: { zh: "解释一下", en: "Explain" },
  generating: { zh: "生成中…", en: "Generating…" },
  aiUnreviewed: { zh: "AI 生成 · 未经审核", en: "AI-generated · unreviewed" },
  aiReviewed: { zh: "已审核", en: "reviewed" },
  // Settings
  settings: { zh: "设置", en: "Settings" },
  aiKeysTitle: { zh: "AI 接口密钥（自带）", en: "AI keys (bring your own)" },
  aiKeysHint: {
    zh: "密钥保存在你本机，只用来直接调用所选的 AI 服务商。本应用不会上传或代管你的密钥。",
    en: "Your key is stored on this device and used only to call the AI provider directly. This app never uploads or holds your key.",
  },
  anthropicKey: { zh: "Anthropic 密钥 (Claude)", en: "Anthropic key (Claude)" },
  openaiKey: { zh: "OpenAI 密钥", en: "OpenAI key" },
  keyConfigured: { zh: "已配置", en: "Configured" },
  keyFromEnv: { zh: "来自服务器环境变量", en: "From server env" },
  keyPlaceholderSet: { zh: "已设置 — 留空则保持不变", en: "Set — leave blank to keep" },
  defaultProviderLabel: { zh: "默认 AI", en: "Default AI" },
  // Footer
  disclaimer: {
    zh: "仅作健康教育与决策辅助，不构成医疗建议。筛查间隔为一般默认值，会随个人及家族风险变化，请以临床医生意见为准。",
    en: "Educational decision-support only — not medical advice. Screening intervals are general defaults and change with personal and family risk. Confirm with your clinician.",
  },
} as const;

export type UIKey = keyof typeof STRINGS;

// ── Context ──────────────────────────────────────────────────────────────────
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "zh",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  // After mount (not in initial state, so server and first client render agree),
  // pick the language from: a ?lang= URL override first (handy for shareable
  // links), else the saved preference. A deliberate one-time external-store sync.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("lang");
    const saved = localStorage.getItem("ohc-lang");
    const next = param === "en" || param === "zh" ? param : saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot hydration; lazy init would cause an SSR/client mismatch
    if (next === "en" || next === "zh") setLangState(next);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("ohc-lang", l);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const { lang, setLang } = useContext(LangContext);
  const t = (key: UIKey): string => {
    const v = STRINGS[key] as L;
    return pick(v, lang);
  };
  return { lang, setLang, t, pick: (l: L) => pick(l, lang) };
}

const ERR_KEY: Record<string, UIKey> = {
  no_key: "errNoKey",
  rate_limit: "errRateLimit",
  auth: "errAuth",
  overloaded: "errOverloaded",
  model: "errModel",
  server: "errServer",
  unknown: "errUnknown",
};

/** Map an AI error code (from the API) to a friendly localized message. */
export function aiErrorMessage(code: string | undefined, lang: Lang): string {
  const key = ERR_KEY[code ?? "unknown"] ?? "errUnknown";
  return pick(STRINGS[key] as L, lang);
}

export const effortLabel = (level: "low" | "medium" | "high", lang: Lang) =>
  pick(STRINGS.effortLevels[level], lang);
export const payoffLabel = (level: "low" | "medium" | "high", lang: Lang) =>
  pick(STRINGS.payoffLevels[level], lang);
