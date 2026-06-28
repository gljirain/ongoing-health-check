import { BodyRegion, EvidenceSource, HealthItem } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// NOT MEDICAL ADVICE. This is an educational decision-support tool. Screening
// intervals are general defaults (drawn from common guidelines such as USPSTF,
// ACS, and Chinese expert consensus) and DO change with personal/family risk.
// Always confirm with a clinician. The goal here is to help you see the
// trade-offs and find the high-ROI, low-hanging-fruit checks — not to prescribe.
//
// CONTENT IS BILINGUAL: every text field is { zh, en }. Default UI is Mandarin.
// ─────────────────────────────────────────────────────────────────────────────

export const BODY_REGIONS: BodyRegion[] = [
  { id: "mind", name: "Mind & sleep", nameZh: "心理 / 睡眠", x: 100, y: 30 },
  { id: "dental", name: "Mouth & teeth", nameZh: "口腔 / 牙齿", x: 100, y: 58 },
  { id: "thyroid", name: "Thyroid", nameZh: "甲状腺", x: 100, y: 76 },
  { id: "heart", name: "Heart & vessels", nameZh: "心血管", x: 84, y: 128 },
  { id: "lungs", name: "Lungs", nameZh: "肺", x: 118, y: 122 },
  { id: "breast", name: "Breast", nameZh: "乳腺", x: 100, y: 116 },
  { id: "liver", name: "Liver", nameZh: "肝脏", x: 119, y: 162 },
  { id: "stomach", name: "Stomach", nameZh: "胃", x: 86, y: 158 },
  { id: "pancreas", name: "Metabolic", nameZh: "代谢 / 胰岛", x: 100, y: 176 },
  { id: "kidney", name: "Kidneys", nameZh: "肾脏", x: 122, y: 188 },
  { id: "colon", name: "Colon & rectum", nameZh: "结直肠", x: 100, y: 206 },
  { id: "repro", name: "Reproductive", nameZh: "生殖", x: 100, y: 232 },
  { id: "blood", name: "Bloodwork", nameZh: "血液 / 抽血", x: 150, y: 232 },
  { id: "skin", name: "Skin", nameZh: "皮肤", x: 50, y: 250 },
];

const SOURCES = {
  uspstfColorectal2021: {
    label: "USPSTF colorectal cancer screening",
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening",
    year: 2021,
    region: "US",
    strength: "guideline",
    note: "Average-risk adults 45-75; colonoscopy every 10 years is one option.",
  },
  cdcColorectal: {
    label: "CDC colorectal cancer screening overview",
    url: "https://www.cdc.gov/colorectal-cancer/screening/index.html",
    year: 2025,
    region: "US",
    strength: "reference",
  },
  asgeSedation2018: {
    label: "ASGE sedation and anesthesia in GI endoscopy",
    url: "https://www.asge.org/home/resources/publications/guidelines/guidelines-for-sedation-and-anesthesia-in-gi-endoscopy",
    year: 2018,
    region: "US",
    strength: "guideline",
    note: "Sedation risk depends on ASA class, airway, cardiopulmonary disease, monitoring, and personnel.",
  },
  uspstfBreast2024: {
    label: "USPSTF breast cancer screening",
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening",
    year: 2024,
    region: "US",
    strength: "guideline",
    note: "Average-risk women 40-74: biennial mammography.",
  },
  cdcLung2025: {
    label: "CDC lung cancer screening",
    url: "https://www.cdc.gov/lung-cancer/screening/index.html",
    year: 2026,
    region: "US",
    strength: "reference",
    note: "LDCT is for adults at high risk based on age and smoking history.",
  },
  aasldMasld2023: {
    label: "AASLD noninvasive assessment of fatty liver/MASLD",
    url: "https://www.aasld.org/liver-fellow-network/core-series/clinical-pearls/spare-me-jab-noninvasive-assessment-patients-masld",
    year: 2023,
    region: "US",
    strength: "guideline",
    note: "FIB-4 is a validated first-line fibrosis risk assessment.",
  },
  uspstfCervical2018: {
    label: "USPSTF cervical cancer screening",
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/cervical-cancer-screening",
    year: 2018,
    region: "US",
    strength: "guideline",
    note: "Age 21-29 cytology every 3 years; age 30-65 cytology every 3 years, hrHPV every 5 years, or co-testing every 5 years.",
  },
  uspstfPsa2018: {
    label: "USPSTF prostate cancer screening",
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/prostate-cancer-screening",
    year: 2018,
    region: "US",
    strength: "guideline",
    note: "Shared decision-making for men 55-69.",
  },
  nciGastricCancer: {
    label: "NCI stomach cancer prevention/screening overview",
    url: "https://www.cancer.gov/types/stomach",
    year: 2025,
    region: "US",
    strength: "reference",
  },
  adaStandards: {
    label: "ADA standards of care",
    url: "https://diabetesjournals.org/care/issue",
    year: 2026,
    region: "US",
    strength: "guideline",
  },
  ahaHypertension: {
    label: "AHA high blood pressure guidance",
    url: "https://www.heart.org/en/health-topics/high-blood-pressure",
    year: 2026,
    region: "US",
    strength: "guideline",
  },
  accAhaPrimaryPrevention: {
    label: "ACC/AHA primary prevention guidance",
    url: "https://www.acc.org/Guidelines",
    year: 2019,
    region: "US",
    strength: "guideline",
  },
  generalClinicalReference: {
    label: "General clinical reference - needs guideline-specific review",
    url: "https://www.ncbi.nlm.nih.gov/books/",
    year: 2026,
    strength: "reference",
    note: "MVP placeholder; replace with item-specific guideline before using for medical decisions.",
  },
} satisfies Record<string, EvidenceSource>;

// Shared "how much should each worry actually weigh?" bars for GI endoscopy.
// `weight` is an ILLUSTRATIVE reasoning aid (0–1), NOT a literal probability —
// it lets a one-time acute risk and a chronic cumulative one sit on one mental
// scale so you can see what should really drive the decision.
const GI_COMPARISONS = [
  {
    label: { zh: "内镜的辐射", en: "Radiation from the scope" },
    weight: 0.0,
    tone: "low" as const,
    detail: {
      zh: "为零。内镜就是一根软管前端的光学摄像头 — 纯光学成像，没有任何电离辐射。「辐射」这个担忧属于 CT 类检查（如 CT 仿真肠镜约几个 mSv），跟任何内镜都无关。",
      en: "Zero. An endoscope is a fibre-optic camera on a flexible tube — pure light, no ionizing radiation. The radiation worry belongs to CT-based tests (e.g. CT colonography ~a few mSv), not to any scope.",
    },
  },
  {
    label: { zh: "一次监护下的麻醉（健康成人）", en: "One monitored sedation (healthy adult)" },
    weight: 0.08,
    tone: "low" as const,
    detail: {
      zh: "严重不良事件约万分之 1–2，且绝大多数只是呼吸或血压短暂下降，麻醉医生当场即可纠正。是一次性的、有边界的、很小的成本。",
      en: "Serious adverse event ~1–2 in 10,000, and almost all are a brief dip in breathing/blood pressure the anesthetist reverses on the spot. A small, one-time, bounded cost.",
    },
  },
  {
    label: { zh: "普通人开一年车", en: "A typical year of driving" },
    weight: 0.13,
    tone: "medium" as const,
    detail: {
      zh: "普通人一年开车的致命事故风险与一次麻醉在同一量级 — 而这是你每天毫不犹豫接受的风险。",
      en: "The fatal-crash risk of an ordinary year on the road is in a similar ballpark — a risk you already accept without a second thought.",
    },
  },
  {
    label: { zh: "每天约 2 杯酒，年复一年", en: "~2 drinks a day, every year" },
    weight: 0.7,
    tone: "high" as const,
    detail: {
      zh: "酒精是一类（Group 1）致癌物；每天约 2 杯会让结直肠癌风险升高约 20%，而且这个代价每年都在重复累积 — 远大于几年才一次的麻醉。",
      en: "Alcohol is a Group-1 carcinogen; ~2 drinks/day raises colorectal-cancer risk on the order of ~20%, and it recurs every single year — a far larger, ongoing cost than one sedation every few years.",
    },
  },
];

export const HEALTH_ITEMS: HealthItem[] = [
  // ── STOMACH ────────────────────────────────────────────────────────────────
  {
    key: "gastroscopy",
    name: "Gastroscopy",
    nameZh: "胃镜",
    regionId: "stomach",
    category: "screening",
    startAge: 40,
    intervalMonths: 36, // every ~2–3y if prior findings; ~3–5y baseline (region-dependent)
    effort: "medium",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "经口进入食管和胃的摄像头检查，发现溃疡、幽门螺杆菌损伤、巴雷特食管和早期胃癌。",
        en: "Camera down the esophagus/stomach to catch ulcers, H. pylori damage, Barrett's, and early gastric cancer.",
      },
      firstPrinciples: {
        zh: "胃癌和食管癌会沿着一条已知路径静默发展多年：慢性炎症（多为幽门螺杆菌）→ 萎缩 → 肠化生 → 异型增生 → 癌。在黏膜层/早期阶段发现，5 年生存率约 90% 以上，且常可在内镜下直接切除（无需开刀）；等到有症状才发现，往往已是晚期，生存率只剩个位数。胃镜的全部价值就是把发现节点往前挪 — 你买的是一次「看见」直到晚期才会报警的组织的机会。",
        en: "Gastric and esophageal cancers grow silently for years through a known sequence: chronic inflammation (often H. pylori) → atrophy → metaplasia → dysplasia → cancer. Caught at the mucosal/early stage, 5-year survival is ~90%+ and treatment can be endoscopic (no major surgery). Caught symptomatic, it is often advanced with single-digit survival. The whole value of the scope is moving detection upstream in that cascade — you are buying a look at tissue that gives no symptoms until late.",
      },
      roi: {
        zh: "在东亚等高发人群中，为预防一例胃癌死亡所需的筛查人数（NNS）相当划算 — 这正是中国/日本/韩国比西方筛查积极得多的原因。如果你得过幽门螺杆菌、有家族史或慢性胃炎，回报会进一步大幅上升。对你来说：上次胃镜已是数年前，复查是合理且高价值的一步，尤其如果当年提到过胃炎或幽门螺杆菌。",
        en: "In high-incidence East-Asian populations the number-needed-to-screen to prevent one gastric-cancer death is favorable, which is exactly why China/Japan/Korea screen far more aggressively than the West. If you have ever had H. pylori, a family history, or chronic gastritis, the ROI rises sharply. For you specifically: last scope ~5 years ago — a repeat is a reasonable, high-value check, especially if any prior gastritis/H. pylori was noted.",
      },
      risks: {
        zh: "操作本身的风险极低（诊断性胃镜穿孔率不足万分之一）。大家真正纠结的是「无痛」的麻醉 — 见肠镜条目里的麻醉详解；用的是同一种丙泊酚镇静，对健康人来说风险确实很小。",
        en: "The procedure risk itself is very low (perforation < ~1 in 10,000 for diagnostic scopes). The thing people actually weigh is the 无痛 (sedated) option's anesthesia — see the 'colonoscopy' entry's anesthesia breakdown; the same propofol sedation applies and the risk is genuinely small for a healthy person.",
      },
      sources: [SOURCES.nciGastricCancer, SOURCES.asgeSedation2018],
    },
    decision: {
      whatToCheck: {
        zh: "胃镜查的是食管和胃黏膜：幽门螺杆菌损伤、溃疡、巴雷特食管，以及真正的目标 — 癌前病变和极早期癌。对你来说：上次胃镜已隔多年。东亚背景下胃癌基线发生率高于西方（所以日韩中筛查频率高得多），现在复查是合理的 — 如果当年报告提过胃炎或幽门螺杆菌则更应如此。聪明的做法：如果也要查肠，就「一次麻醉做胃肠镜」，麻醉和时间成本只付一次。",
        en: "A gastroscope looks at your esophagus and stomach lining for H. pylori damage, ulcers, Barrett's, and the real prize — pre-cancer and very early cancer. For you: your last 胃镜 was years ago. With an East-Asian background the baseline gastric-cancer rate is higher than in the West (which is exactly why Japan/Korea/China scope far more often), so a refresh now is reasonable — more so if any prior gastritis or H. pylori was ever noted. Smart move: if you ever do a colonoscopy too, do both in one sedation and pay the sedation/time cost once.",
      },
      roi: {
        zh: "黏膜期发现的早期胃癌 5 年生存率约 90% 以上，常可内镜下切除（ESD），无需开刀；等出现症状再发现，多半已是晚期（生存率个位数）。你用约 15–20 分钟的轻微麻烦，换一次查看「直到晚期才报警的组织」的机会。在高发背景下，这是几年一次的成本换来的高回报。",
        en: "Caught at the mucosal stage, early gastric cancer is ~90%+ 5-year survival and can often be removed endoscopically (ESD) with no surgery; caught once it causes symptoms it is usually advanced (single-digit survival). You are trading ~15–20 minutes of mild hassle for a look at tissue that gives zero warning until late. In a higher-incidence background the number-needed-to-screen is favorable — for a once-every-few-years cost, a strong return.",
      },
      bestApproach: {
        zh: "「无痛」（丙泊酚镇静）是最不受罪的路线：睡 10–15 分钟，醒来头脑清醒，全程无记忆。胃镜只需空腹，不用清肠。如果同时想查肠道，让医院安排一次麻醉做完两项。完全不想麻醉？可选超细经鼻胃镜，清醒状态完成（代价：有点恶心感，你能感觉到过程）。",
        en: "无痛 (propofol sedation) is the least-unpleasant route: asleep ~10–15 min, wake clear-headed, remember nothing. The only prep is fasting — no bowel cleanout for the upper scope. If you also want the colon checked, ask to combine them in one sedation. Prefer to skip sedation entirely? An ultrathin transnasal gastroscope can be done awake (trade-off: mild gagging, you feel it).",
      },
      radiation: {
        zh: "为零。胃镜是光纤摄像头 — 纯光学，零电离辐射。「辐射」这个问题对任何内镜都不成立，它属于 CT/X 光类检查。",
        en: "None. A gastroscope is a fibre-optic camera — pure light, zero ionizing radiation. The radiation question simply does not apply to any endoscopy; it belongs to CT/X-ray tests.",
      },
      anesthesia: {
        zh: "丙泊酚的原理是短暂放大大脑主要的「关机开关」（增强 GABA-A 抑制），让你平滑入睡。它的可贵之处是几分钟内就被清除（快速再分布+代谢），所以你醒来是清醒的而不是昏沉的。唯一真实的急性影响是呼吸/血压的短暂抑制 — 而这正是麻醉医生全程监测、实时纠正的东西。没有可靠证据表明健康成人单次规范监护下的镇静会造成持久的认知或器官损害；胃镜的镇静通常比肠镜更浅、更短。",
        en: "Propofol briefly amplifies the brain's main 'off' switch (it potentiates GABA-A inhibition), so you slide smoothly into sleep. It is prized because it clears in minutes (it redistributes and is metabolized fast), which is why you wake clear rather than groggy. The one real acute effect is transient depression of breathing/blood pressure — precisely what the anesthetist monitors and corrects in real time. There is no good evidence a single, properly-monitored sedation causes lasting cognitive or organ harm in a healthy adult; for the upper scope the sedation is usually lighter and shorter than for a colonoscopy.",
      },
      comparisons: GI_COMPARISONS,
      bottomLine: {
        zh: "多年未查的胃镜 + 东亚背景，使复查成为一个合理、中高价值的行动。人们最怕的两件事分别是：零（辐射）和很小（麻醉）— 所以请基于你真实的胃部风险（幽门螺杆菌史、胃炎、家族史）做决定，而不是基于这两个恐惧。",
        en: "A years-old 胃镜 plus an East-Asian background makes a refresh a sensible, moderate-to-high-value move. The two things people fear most here are, respectively, zero (radiation) and small (anesthesia) — so decide on your actual gastric risk (prior H. pylori, gastritis, family history), not on those fears.",
      },
    },
  },

  // ── COLON ────────────────────────────────────────────────────────────────
  {
    key: "colonoscopy",
    name: "Colonoscopy",
    nameZh: "肠镜",
    regionId: "colon",
    category: "screening",
    startAge: 45,
    intervalMonths: 120, // 10y if normal; shorter if polyps/risk
    effort: "medium",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "贯穿全结直肠的摄像头检查。独特之处：发现癌前息肉可当场切除 — 它既是检查，也（常常）是治疗。",
        en: "Camera through the colon/rectum. Uniquely, it can REMOVE precancerous polyps in the same session — it's both the test and (often) the cure.",
      },
      firstPrinciples: {
        zh: "几乎所有结直肠癌都走「腺瘤→癌」这条路：一个良性息肉要积累约 10 年的突变才会癌变。这条漫长、无症状的跑道正是机会所在 — 肠镜既能发现息肉，又能当场剪掉它，让它永远没机会变成癌。没有任何其他常见癌症筛查同时也是一步到位的干预。直检（肛门指检）只能摸到直肠最后几厘米；便隐血/粪便 DNA 能查出血或异常 DNA，但切不掉任何东西。所以去年一次正常的直检，对其余约 150cm 的结肠几乎说明不了什么。",
        en: "Almost all colorectal cancer follows the adenoma→carcinoma sequence: a benign polyp accumulates mutations over ~10 years before becoming cancer. That long, silent runway is the opportunity — colonoscopy finds polyps AND snips them out before they ever turn malignant. No other common cancer screen is also a one-step intervention. A DRE (直检) only reaches the last few cm of rectum and detects nothing higher up; FIT/stool-DNA tests detect bleeding/altered DNA but cannot remove anything. So a normal 直检 last year tells you almost nothing about the other ~150cm of colon.",
      },
      roi: {
        zh: "随机对照和队列研究显示，规律的肠镜筛查能把结直肠癌发病率和死亡率大幅压低（依从人群中发病率降低约 40–70%，因研究而异）。一次正常的检查通常换来约 10 年的安心 — 这是全医学里「付出/保护」比最好的项目之一。如果你只做过直检没做过肠镜，肠镜很可能是你单项回报最高的「低垂果实」：它覆盖了直检看不到的 95% 以上的肠道。",
        en: "Randomized and cohort data show colonoscopy-based screening cuts colorectal cancer incidence and mortality substantially (incidence reductions ~40–70% in adherent screening, depending on the study). A normal exam typically buys you ~10 years before the next one — one of the best effort-to-protection ratios in all of medicine. If you've done a 直检 but never a colonoscopy, the colonoscopy is arguably your single highest-ROI 'low-hanging fruit': it covers the 95%+ of the colon the 直检 can't see.",
      },
      risks: {
        zh: "麻醉（「无痛肠胃镜」之忧，用数字说话）：镇静通常用丙泊酚，由麻醉医生滴定。严重不良事件约为每万例镇静 1–3 例，且绝大多数是短暂的呼吸/血压下降，当场即被处理。对健康成人，这与拔牙镇静属同一量级。一个有用的参照：这一天的镇静风险，远小于长期规律饮酒带来的慢性风险 — 中到大量饮酒是一类致癌物，结直肠癌等风险随剂量上升。所以「几年一次的镇静」对比「年年累积的酒精暴露」，根本不是一个量级的选择题。操作风险：穿孔约 1/1000–1/3000，出血多发生在切息肉后、通常轻微。多数人真正讨厌的其实是清肠准备。注意：以上是人群数据 — 麻醉医生会评估你的个体风险。",
        en: "ANESTHESIA (the 无痛肠胃镜 concern, in numbers): sedation is usually propofol, titrated by an anesthetist. Serious adverse events are roughly 1–3 per 10,000 sedated procedures, and the large majority are transient (a dip in breathing/BP that's immediately managed). For a healthy adult this is in the same ballpark as routine sedation for dental surgery. A useful framing: the one-day risk of the sedation is far smaller than the chronic risk you carry from, say, regular heavy drinking — moderate-to-heavy alcohol is a Group-1 carcinogen with a dose-dependent rise in colorectal and other cancers. So 'one sedation every several years' vs 'cumulative alcohol exposure' is not a close call. Procedure risks: perforation ~1 in 1,000–3,000, bleeding mostly after polyp removal and usually minor. Bowel prep is the part most people actually dislike. NOTE: these are population figures — your anesthetist will assess your personal risk.",
      },
      sources: [SOURCES.uspstfColorectal2021, SOURCES.cdcColorectal, SOURCES.asgeSedation2018],
    },
    decision: {
      whatToCheck: {
        zh: "你做过直检（正常），但还没做过肠镜 — 两者不可互换。直检只能摸到直肠最后约 7–10cm；肠镜能看完整条约 1.5 米的结肠，而且能当场切掉癌前息肉。诚实的部分：常规人群筛查从 45 岁开始（USPSTF）。如果你还没到 45、没有家族史也没有症状，现在做肠镜的回报确实偏低 — 等待是合理的、有证据支持的选择。到了 45 它会立刻变成高价值项目 — 或者更早，如果有一级亲属患结直肠癌（从其确诊年龄减 10 年或 40 岁开始）、有炎症性肠病、或出现症状（便血、排便习惯持续改变、不明原因缺铁）。",
        en: "You have done a 直检 (normal) but never a 肠镜 — and those are not interchangeable. A 直检 reaches only the last ~7–10 cm of rectum; a colonoscopy sees the full ~1.5 m of colon and, uniquely, removes precancerous polyps in the same pass. The honest part: routine population screening starts at 45 (USPSTF). If you are below that age with no family history and no symptoms, a colonoscopy is genuinely lower-ROI right now — waiting is a legitimate, evidence-based choice. It flips to high-value at 45 — or earlier if you have a first-degree relative with colorectal cancer (start ~10 years before their diagnosis age, or 40), IBD, or symptoms (bleeding, a lasting change in bowel habit, unexplained iron-deficiency).",
      },
      roi: {
        zh: "在适应症内，肠镜是同类最佳，因为它「筛查+治疗」一步完成：腺瘤→癌要走约 10 年，今天切掉一个息肉，等于删掉了多年后的一个癌。依从筛查能把结直肠癌发病率压低约 40–70%，一次正常检查通常管约 10 年。但回报是按年龄/风险分级的 — 45 岁起很高，之前如果没有风险因素则一般。不要被漂亮的数字拉着在平均风险下提前很多年去做 — 那是过度检查：同样的小操作风险，却还没有真正的收益。",
        en: "When it is indicated, colonoscopy is best-in-class because it is screen + cure in one pass: the adenoma→carcinoma path takes ~10 years, so removing a polyp today prevents a cancer years later. Adherent screening cuts colorectal-cancer incidence ~40–70%, and a normal exam typically buys ~10 years. But the ROI is age/risk-gated — high from 45, modest before that without risk factors. Don't let the impressive numbers pull you into doing it years early if you are average-risk; that is over-testing, with the same small procedure risks and no real gain yet.",
      },
      bestApproach: {
        zh: "「无痛」（丙泊酚）：睡 20–30 分钟，醒来清醒，全程无记忆。大家真正不喜欢的是清肠 — 而分次服药（split-dose）、检查前一天低渣饮食、以及新型小容量清肠剂，已让它比传说中好受得多。如果同时做胃镜，就一次麻醉做完 — 一天准备、一次镇静、一次恢复。",
        en: "无痛 (propofol): asleep ~20–30 min, wake clear, remember nothing. The part people actually dislike is the prep (the bowel cleanout) — and split-dose timing, a low-residue day, and newer low-volume preps make it far more tolerable than its reputation. If you also do a gastroscopy, combine them in one sedation — one prep day, one sedation, one recovery.",
      },
      radiation: {
        zh: "为零。肠镜是光学摄像头 — 零电离辐射。（「辐射」的担忧属于 CT 仿真肠镜，约几个 mSv；真正的肠镜是 0。）",
        en: "None. A colonoscope is an optical camera — zero ionizing radiation. (The radiation worry belongs to CT colonography, ~a few mSv; a real colonoscopy is 0.)",
      },
      anesthesia: {
        zh: "丙泊酚短暂放大大脑的「关机开关」（增强 GABA-A 抑制），让你平滑入睡，几分钟内即被清除 — 所以醒来是清醒的。唯一真实的急性影响是呼吸/血压的短暂下降，这正是麻醉医生盯着并实时纠正的事。没有可靠证据表明健康成人单次监护镇静会造成持久伤害；「几年一次」的累计剂量可以忽略不计。",
        en: "Propofol briefly amplifies the brain's main 'off' switch (it potentiates GABA-A inhibition), so you slide smoothly into sleep, and it clears in minutes — which is why you wake clear-headed. The one real acute effect is a transient dip in breathing/blood pressure, exactly what the anesthetist watches and corrects in real time. No good evidence a single monitored sedation causes lasting harm in a healthy adult; the cumulative 'dose' of one sedation every several years is negligible.",
      },
      comparisons: GI_COMPARISONS,
      bottomLine: {
        zh: "如果你不到 45 岁、没有家族史和症状，肠镜对你不紧迫 — 这是有证据支持的正当选择，不是偷懒。把它排进 45 岁的日历（家族史或症状出现则提前），到时考虑和胃镜「一次麻醉」一起做。决定因素应该是你的年龄+家族史 — 而不是辐射（没有）或麻醉（很小且可逆）。",
        en: "If you are below 45 with no family history or symptoms, a colonoscopy is not urgent for you — and that is a fine, evidence-based call, not laziness. Put it on the calendar for 45 (or sooner if family history or symptoms appear), and consider pairing it with your 胃镜 in one sedation when the time comes. The deciding factor should be your age + family history — not radiation (there is none) or anesthesia (small and reversible).",
      },
    },
  },
  {
    key: "dre",
    name: "Digital rectal exam",
    nameZh: "直检 (肛门指检)",
    regionId: "colon",
    category: "screening",
    startAge: 40,
    intervalMonths: 12,
    // For colorectal screening, a colonoscopy covers everything a DRE reaches and far more.
    supersededBy: [{ key: "colonoscopy", months: 120 }],
    effort: "low",
    payoff: "low",
    knowledge: {
      summary: {
        zh: "医生用手指快速检查直肠下段（男性同时触诊前列腺）。便宜快捷，但覆盖范围非常有限。",
        en: "A quick finger exam of the lower rectum (and prostate in men). Cheap and fast, but very limited reach.",
      },
      firstPrinciples: {
        zh: "直检物理上只能触及远端约 7–10cm。大多数结直肠病变、尤其是位置更深的，全都摸不到。它是有用的辅助手段（前列腺质地、低位直肠肿块、痔疮），但绝不是肠镜或粪便检测的替代品。",
        en: "A DRE physically reaches only the distal ~7–10cm. Most colorectal lesions and essentially all proximal ones are out of range. It is a useful adjunct (prostate texture, low rectal masses, hemorrhoids) but is NOT a substitute for a colonoscopy or a stool-based test.",
      },
      roi: {
        zh: "成本低、但作为癌症筛查的产出也低。把正常的直检理解为「门口看了一眼没问题」— 它对屋子里其余部分什么都说明不了。它的主要价值在于已经做了；它留下的空白，正是肠镜要填的。",
        en: "Low cost, low yield as a cancer screen. Treat a normal DRE as 'the doorway looked fine' — it says nothing about the rest of the house. Its main value is that it's already done; the gap it leaves is exactly what the colonoscopy fills.",
      },
      risks: {
        zh: "基本没有 — 轻微不适而已。",
        en: "Essentially none — mild discomfort.",
      },
      sources: [SOURCES.cdcColorectal],
    },
  },
  {
    key: "fit",
    name: "Stool test (FIT / occult blood)",
    nameZh: "便隐血 (FIT)",
    regionId: "colon",
    category: "screening",
    startAge: 45,
    intervalMonths: 12,
    // A colonoscopy is the definitive test FIT exists to triage toward — a recent
    // one (≤10y) makes FIT unnecessary.
    supersededBy: [{ key: "colonoscopy", months: 120 }],
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "不用清肠、不用麻醉的粪便潜血检测 — 在家就能做；结果正常能显著降低「此刻存在正在出血的息肉或肠癌」的概率。",
        en: "A no-prep, no-sedation stool test for hidden blood — can be done at home; a normal result meaningfully lowers the odds of an actively bleeding polyp or cancer right now.",
      },
      firstPrinciples: {
        zh: "较大的息肉和结直肠癌往往会渗出微量血液；FIT 检测粪便中的人血红蛋白。它看不到扁平或不出血的病变，所以单次 FIT 的灵敏度不如肠镜 — 但每年都做，对癌症的累积灵敏度很高；阴性的 FIT 意味着此刻存在出血性进展期病变的概率很低。任何一次 FIT 阳性都是直通肠镜的车票。",
        en: "Larger polyps and colorectal cancers tend to ooze microscopic amounts of blood; FIT detects human hemoglobin in stool. It cannot see flat or non-bleeding lesions, so a single FIT is less sensitive than a colonoscopy — but done EVERY YEAR its cumulative sensitivity for cancer is high, and a negative FIT means a low probability of a bleeding advanced lesion at this moment. Any positive FIT is a direct ticket to a colonoscopy.",
      },
      roi: {
        zh: "「付出/保护」比最好的项目之一：便宜、无创、不清肠、不麻醉、不请假。有组织的年度 FIT 项目确实降低了结直肠癌死亡率。它对你的真正战略价值：FIT 正常（尤其再加直检正常），是「未到筛查年龄、无症状无家族史时推迟肠镜」的正当、有据可依的理由 — 每年做 FIT，45 岁再上肠镜（任何一次转阳则立刻提前）。",
        en: "One of the best effort-to-protection ratios there is: cheap, non-invasive, no prep, no sedation, no time off. Organized annual-FIT programs cut colorectal-cancer mortality. Its real strategic value: a normal FIT (especially alongside a normal 直检) is a legitimate, evidence-based reason to DEFER a colonoscopy when you're below the screening start age with no symptoms or family history — keep doing FIT yearly and bring in the colonoscopy at 45 (or sooner if anything turns positive).",
      },
      risks: {
        zh: "风险约等于零。它的问题是局限而非伤害：假阴性（漏掉不出血的息肉）和假阳性（痔疮等其他出血）— 所以 FIT 是肠镜的补充，不是替代。",
        en: "Effectively zero risk. Limitations, not harms: false negatives (misses non-bleeding polyps) and false positives (hemorrhoids or other GI bleeding) — so FIT complements, it does not replace, a colonoscopy.",
      },
      sources: [SOURCES.uspstfColorectal2021, SOURCES.cdcColorectal],
    },
  },

  // ── LIVER / METABOLIC ────────────────────────────────────────────────────
  {
    key: "fatty_liver",
    name: "Fatty liver (NAFLD)",
    nameZh: "脂肪肝",
    regionId: "liver",
    category: "condition",
    intervalMonths: 12,
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "肝细胞内脂肪堆积。极其常见、通常无声 — 早期发现时，大部分可通过生活方式逆转。",
        en: "Fat accumulation in liver cells. Extremely common, usually silent, and — caught early — largely reversible through lifestyle.",
      },
      firstPrinciples: {
        zh: "非酒精性脂肪肝是全身代谢压力在肝脏上的读数：热量过剩/精制碳水+胰岛素抵抗，驱动甘油三酯囤进肝细胞。多数人停留在良性阶段（单纯脂肪变），但一部分会进展：脂肪变 → 脂肪性肝炎（NASH，活动性炎症）→ 纤维化 → 肝硬化，其中纤维化是开始难以逆转的那一步。关键洞察：早期的脂肪是一盏代谢警示灯，不只是肝的问题 — 它与胰岛素抵抗同行，同时推高你的 2 型糖尿病和心血管风险。",
        en: "Non-alcoholic fatty liver disease is the liver's readout of whole-body metabolic stress: excess calories/refined carbs and insulin resistance drive triglyceride storage in hepatocytes. Most cases stay benign (simple steatosis), but a subset progress: steatosis → steatohepatitis (NASH, active inflammation) → fibrosis → cirrhosis, and fibrosis is the step that becomes hard to reverse. The key insight is that early fat is a metabolic warning light, not just a liver problem — it travels with insulin resistance, raising your risk for type-2 diabetes and cardiovascular disease.",
      },
      roi: {
        zh: "回报极高，因为主要的「治疗」是免费且由你掌控的：体重下降约 7–10% 就能让许多人的脂肪变消退、甚至早期纤维化回退；戒掉酒精、含糖饮料和精制碳水，加上运动，直接逆转病因。这里的「成本」是真正的生活方式取舍 — 恰恰是这个看板存在的意义。复查也便宜：肝脏B超 + 转氨酶（ALT/AST）+ FIB-4 评分（由年龄、AST、ALT、血小板算出），就能告诉你处在安全的「只是有脂肪」区，还是需要认真对待的「纤维化形成中」区。",
        en: "Very high ROI because the main treatment is free and you control it: ~7–10% body-weight loss can resolve steatosis and even regress early fibrosis in many people; cutting alcohol, sugary drinks, and refined carbs plus adding exercise directly reverses the driver. The 'cost' is genuinely a lifestyle trade-off, which is exactly the kind of decision this dashboard is for. Re-checking is cheap: a liver ultrasound + ALT/AST + a FIB-4 score (from age, AST, ALT, platelets) tells you whether you're in the safe 'just fat' zone or the 'fibrosis forming' zone that needs real attention.",
      },
      risks: {
        zh: "风险在于「不行动」：多年间静默进展为纤维化/肝硬化。检查本身（B超+抽血）零风险。每年复查一次、看 FIB-4 趋势，是确认稳定/好转的正确节奏。",
        en: "The risk is in NOT acting: silent progression to fibrosis/cirrhosis over years. The check itself (ultrasound + blood) is zero-risk. A yearly re-look with a FIB-4 trend is the right cadence to confirm it's stable/improving.",
      },
      sources: [SOURCES.aasldMasld2023],
    },
  },
  {
    key: "liver_ultrasound",
    name: "Abdominal ultrasound",
    nameZh: "腹部B超",
    regionId: "liver",
    category: "screening",
    intervalMonths: 12,
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "便宜、无辐射的肝胆胰脾肾成像 — 查脂肪肝、结石和囊肿的标准第一站。",
        en: "Cheap, no-radiation imaging of liver, gallbladder, kidneys, pancreas — the standard first look for fatty liver, stones, and cysts.",
      },
      firstPrinciples: {
        zh: "超声靠声波在组织界面的反射成像；脂肪、液体和结石会以特征性的方式改变回声。它依赖操作者水平、对胰腺不算理想，但对「亮肝」（脂肪肝）、胆结石和肾囊肿来说，是高价值、低阻力的第一遍排查。",
        en: "Ultrasound bounces sound off tissue interfaces; fat, fluid, and stones change echogenicity in characteristic ways. It is operator-dependent and not great for the pancreas, but for a bright fatty liver, gallstones, and kidney cysts it's a high-value, low-friction first pass.",
      },
      roi: {
        zh: "低成本、零辐射、覆盖面广 — 适合与抽血搭配的年度「广角」扫描。打包进常规体检时回报最佳。",
        en: "Low cost, no radiation, broad coverage — a good annual 'wide-angle' scan that pairs with bloodwork. Best ROI when bundled into a routine physical.",
      },
      risks: {
        zh: "无（无辐射、无创）。",
        en: "None (no radiation, non-invasive).",
      },
      sources: [SOURCES.generalClinicalReference],
    },
  },

  // ── BLOOD / METABOLIC PANEL ────────────────────────────────────────────────
  {
    key: "lipids",
    name: "Lipid panel (LDL etc.)",
    nameZh: "血脂 (LDL)",
    regionId: "blood",
    category: "biomarker",
    intervalMonths: 12,
    unit: "mmol/L",
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "LDL/ApoB 是动脉粥样硬化的因果驱动因素 — 也是你最可改变的指标之一。",
        en: "LDL/ApoB are the causal driver of atherosclerosis — and among the most modifiable numbers you own.",
      },
      firstPrinciples: {
        zh: "动脉粥样硬化是累积性的：LDL/ApoB 颗粒钻进动脉壁、被氧化、在几十年里堆出斑块。真正的暴露量是「曲线下面积」— 你的 LDL 水平 × 年数。这就是为什么更早降 LDL 会复利：你压低的是一生的积分，不只是今天的数字。这是医学里因果关系最扎实的结论之一（基因学、临床试验、流行病学三路证据汇合）。",
        en: "Atherosclerosis is cumulative: LDL/ApoB particles infiltrate the artery wall, get oxidized, and seed plaques over decades. The exposure is area-under-the-curve — your LDL level multiplied by years. That's why lowering LDL earlier compounds: you're reducing a lifetime integral, not just today's number. This is one of the most causally-established relationships in medicine (genetics, trials, and epidemiology all converge).",
      },
      roi: {
        zh: "极高。检查只是一管血；回报是预防头号死因。知道自己的 LDL/ApoB，你才能清醒地做取舍（饮食、运动，必要时他汀 — 后者的风险特征非常清楚）。对多数人这是教科书级的低垂果实：成本极小，下游保护巨大且证据充分。",
        en: "Extremely high. The test is a cheap blood draw; the payoff is preventing the #1 cause of death. Knowing your LDL/ApoB lets you make a clear-eyed trade-off (diet, exercise, and if needed a statin — which has a very well-characterized risk profile). For most people this is textbook low-hanging fruit: small cost, large, well-proven downstream protection.",
      },
      risks: {
        zh: "抽血本身可忽略。真正的「风险」是对一个你本可以现在就开始扭转的、长达几十年的静默过程保持无知。",
        en: "The blood draw is trivial. The real 'risk' is staying unaware of a silent, decades-long process you could be bending downward now.",
      },
      sources: [SOURCES.accAhaPrimaryPrevention],
    },
  },
  {
    key: "hba1c",
    name: "HbA1c / fasting glucose",
    nameZh: "糖化血红蛋白 / 血糖",
    regionId: "pancreas",
    category: "biomarker",
    intervalMonths: 12,
    unit: "%",
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "你过去 3 个月的平均血糖。胰岛素抵抗和 2 型糖尿病的早期预警表。",
        en: "Your 3-month average blood sugar. The early-warning gauge for insulin resistance and type-2 diabetes.",
      },
      firstPrinciples: {
        zh: "葡萄糖会按平均浓度比例「粘」在血红蛋白上，所以 HbA1c 等于把约 90 天的血糖做了积分。2 型糖尿病发展缓慢，有一段很长的「糖尿病前期」窗口，而干预在这个窗口里效果最好。同一个胰岛素抵抗也是脂肪肝、高甘油三酯和心血管风险的底层 — 这一个数字把你看板上的好几个部位串在了一起。",
        en: "Glucose sticks to hemoglobin in proportion to its average level, so HbA1c integrates ~90 days of blood sugar. Type-2 diabetes develops slowly through a long pre-diabetic window where intervention is highly effective. The same insulin resistance underlies fatty liver, high triglycerides, and cardiovascular risk — so this one number ties several of your other regions together.",
      },
      roi: {
        zh: "高。检查便宜，而糖尿病前期正是生活方式干预（体重、碳水、运动）效果最大、证据最强的窗口（DPP 试验中生活方式干预的防进展效果胜过二甲双胍）。抓住一个悄悄爬升的 A1c，是经典的高回报预防。",
        en: "High. Cheap test, and the pre-diabetes window is where lifestyle change (weight, carbs, exercise) has its largest, best-proven effect (the DPP trial showed lifestyle beat metformin for preventing progression). Catching a creeping A1c is classic high-ROI prevention.",
      },
      risks: {
        zh: "可忽略（抽血）。",
        en: "Trivial (blood draw).",
      },
      sources: [SOURCES.adaStandards],
    },
  },
  {
    key: "vitamin_d",
    name: "Vitamin D (25-OH)",
    nameZh: "维生素D (25-OH)",
    regionId: "blood",
    category: "biomarker",
    intervalMonths: 12,
    unit: "nmol/L",
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "一管血查 25-OH 维生素D — 影响骨骼、肌肉和免疫，缺乏极其常见且容易纠正。",
        en: "A blood test for 25-OH vitamin D — affects bone, muscle, and immunity; deficiency is very common and easy to fix.",
      },
      firstPrinciples: {
        zh: "维生素D 调节钙吸收和骨骼健康，也参与肌肉和免疫功能。它主要由皮肤经日晒合成 — 室内工作、防晒、高纬度都会让水平偏低，所以在很多人群里不足/缺乏非常普遍。长期不足影响骨密度，也与多项健康指标相关。",
        en: "Vitamin D regulates calcium absorption and bone health, and plays a role in muscle and immune function. The skin makes most of it from sunlight — indoor work, sunscreen, and high latitudes push levels down, so insufficiency is very common. Chronic shortfall affects bone density and tracks with various health markers.",
      },
      roi: {
        zh: "很高的「付出/收益」比：一管血查出来，缺了就用便宜的口服补充剂纠正。注意别过度 — 过高（潜在毒性）也不好，按结果补。",
        en: "Great effort-to-payoff: one blood draw, and a shortfall is fixed with a cheap oral supplement. Don't overdo it — very high levels aren't good either; supplement to the result.",
      },
      risks: {
        zh: "抽血可忽略；主要的坑是盲目大剂量补。",
        en: "Trivial (blood draw); the main pitfall is blind high-dose supplementing.",
      },
      sources: [SOURCES.generalClinicalReference],
    },
  },
  {
    key: "blood_pressure",
    name: "Blood pressure",
    nameZh: "血压",
    regionId: "heart",
    category: "biomarker",
    intervalMonths: 6,
    unit: "mmHg",
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "中风、心梗、肾损伤和眼底损伤的静默放大器 — 也是最便宜的可测指标之一。",
        en: "The silent multiplier of stroke, heart attack, kidney and eye damage — and one of the cheapest things to measure.",
      },
      firstPrinciples: {
        zh: "血压是作用在动脉壁上的力；长期偏高会机械性损伤血管内皮、加速动脉粥样硬化，同时让心脏、肾脏和视网膜/脑内的细小血管超负荷。风险从约 115/75 mmHg 起持续上升 — 没有突变的阈值，是剂量-反应关系。高血压在出事之前没有任何症状，所以才叫「沉默的杀手」。",
        en: "Pressure is force on the artery wall; chronically high pressure mechanically damages endothelium and accelerates atherosclerosis, while straining the heart, kidneys, and tiny retinal/brain vessels. Risk rises continuously from ~115/75 mmHg upward — there's no sharp threshold, it's a dose-response. Hypertension is symptomless until it isn't, which is why it's called the silent killer.",
      },
      roi: {
        zh: "全医学回报最高的项目之一：一台一百多块的家用血压计，加上治疗（生活方式 ± 便宜的经典药物），就能预防相当大比例的中风和心梗。在家自测还能排除「白大衣效应」的噪音。如果你只长期跟踪一个指标，就跟踪它。",
        en: "Among the highest ROI in all of medicine: a ~$20 home cuff, and treatment (lifestyle ± cheap generics) prevents a large fraction of strokes and heart attacks. Self-measurement at home removes 'white-coat' noise. If you track nothing else regularly, track this.",
      },
      risks: {
        zh: "测量无任何风险。",
        en: "None to measure.",
      },
      sources: [SOURCES.ahaHypertension],
    },
  },

  // ── HEART / VESSELS (deeper) ────────────────────────────────────────────────
  {
    key: "cac_score",
    name: "Coronary calcium (CAC) score",
    nameZh: "冠脉钙化积分",
    regionId: "heart",
    category: "screening",
    startAge: 40,
    intervalMonths: 60,
    effort: "medium",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "一次低剂量 CT，直接数出你冠状动脉里的钙化斑块 — 把「风险估算」变成一张真实的照片。",
        en: "A low-dose CT that directly counts calcified plaque in your coronary arteries — turns 'risk estimate' into a real picture.",
      },
      firstPrinciples: {
        zh: "风险计算器用人群平均值估你的概率；CAC 扫描看的是你自己的动脉。钙化是已形成的动脉粥样硬化的指纹。0 分极有说服力（未来 5–10 年事件风险非常低）；高分则把你重新归到更高风险档，是认真控 LDL/血压的最清晰理由。它专治「临界风险」人群的纠结。",
        en: "Risk calculators estimate your odds from averages; a CAC scan looks at YOUR arteries. Calcium is a fingerprint of established atherosclerosis. A score of 0 is powerfully reassuring (very low event risk for ~5–10y); a high score reclassifies you upward and is the clearest motivator to treat LDL/BP aggressively. It resolves the ambiguity many people feel at 'borderline' risk.",
      },
      roi: {
        zh: "对处在「要不要开始吃他汀」的中等风险地带的人，决策价值很高 — 常常一次扫描就改变决定。辐射低（约 1 mSv，相当于几个月的天然本底辐射）。",
        en: "High decision-value for people in the intermediate-risk, 'should I start a statin?' zone — it often changes the decision in one scan. Low radiation (~1 mSv, comparable to a few months of background).",
      },
      risks: {
        zh: "小剂量辐射；偶有需要随访的意外发现。如果你已明确属于高风险并在治疗中，则不需要做。",
        en: "Small radiation dose; occasional incidental findings that prompt follow-up. Not needed if you're already clearly high-risk and treating.",
      },
      sources: [SOURCES.accAhaPrimaryPrevention],
    },
  },
  {
    key: "carotid",
    name: "Carotid ultrasound",
    nameZh: "颈动脉超声",
    regionId: "heart",
    category: "screening",
    startAge: 40,
    intervalMonths: 60,
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "无创超声看颈动脉壁有没有增厚或斑块 — 全身动脉粥样硬化的一个直接窗口。",
        en: "Non-invasive ultrasound of the carotid wall for thickening or plaque — a direct window onto whole-body atherosclerosis.",
      },
      firstPrinciples: {
        zh: "颈动脉就在皮肤下方，超声能直接测「内-中膜厚度」(IMT) 和有无斑块 — 这是动脉粥样硬化最早期的可见标志，且与冠脉和脑卒中风险相关。IMT 增厚或出现斑块，说明你「LDL × 年数」的累积暴露已经在血管壁上留下了痕迹；干净的颈动脉则是强有力的反向证据。",
        en: "The carotids sit just under the skin, so ultrasound can directly measure intima-media thickness (IMT) and look for plaque — the earliest visible markers of atherosclerosis, and they track with coronary and stroke risk. Thickening or plaque means your cumulative LDL×years exposure has started marking the artery wall; clean carotids are strong evidence the other way.",
      },
      roi: {
        zh: "便宜、无辐射、无创，把抽象的「心血管风险评分」变成一张血管壁的真实照片。对血脂/血压处于临界、想知道「现在到底有没有损伤」的人价值最高。",
        en: "Cheap, no radiation, non-invasive — turns an abstract CV risk score into a real picture of the artery wall. Highest value for someone with borderline lipids/BP who wants to know whether damage has actually begun.",
      },
      risks: {
        zh: "无（无辐射、无创）。偶有意义不明的轻微发现。",
        en: "None (no radiation, non-invasive). Occasional minor findings of unclear significance.",
      },
      sources: [SOURCES.accAhaPrimaryPrevention],
    },
  },

  // ── BREAST (female) ────────────────────────────────────────────────────────
  {
    key: "breast_screen",
    name: "Breast screening (US / mammogram)",
    nameZh: "乳腺检查 (超声 / 钼靶)",
    regionId: "breast",
    category: "screening",
    appliesTo: { sex: "female" },
    startAge: 40,
    intervalMonths: 24,
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "给妈妈/伴侣/姐妹：钼靶（乳腺X线）是人群筛查的主力；超声/MRI 是按风险和乳腺密度加配的补充。",
        en: "For mom / partner / sister: mammography is the main population screen; ultrasound/MRI are risk- and density-dependent add-ons.",
      },
      firstPrinciples: {
        zh: "乳腺癌的可发现性随大小变化；影像能在手摸到之前很多年发现亚厘米级肿瘤。局限期（早期）5 年生存率约 99%，扩散后大幅下降。年轻、乳腺致密的女性中，超声是钼靶的好搭档（致密组织会在X线下「藏住」肿瘤）。每月自检/临床触诊是有用但粗糙的兜底，不能替代影像。",
        en: "Breast cancer detectability scales with size; imaging finds sub-centimeter tumors long before a hand can. Early-stage (localized) 5-year survival is ~99% vs far lower once spread. In younger women with dense breasts, ultrasound complements mammography well (dense tissue hides tumors on X-ray). A monthly self/clinical exam is a useful but coarse backstop, not a replacement for imaging.",
      },
      roi: {
        zh: "高且证据充分，但间隔与方式取决于指南和个人风险。USPSTF 建议平均风险女性 40–74 岁每两年一次钼靶。乳腺致密、明确家族史、既往不典型增生或遗传风险会改变方案，可能需要加超声或讨论 MRI。",
        en: "High and well-established, but interval and modality are guideline- and risk-dependent. USPSTF recommends biennial mammography for average-risk women 40-74. Dense breasts, strong family history, prior atypia, or genetic risk can change the plan and may justify ultrasound or MRI discussion.",
      },
      risks: {
        zh: "钼靶有小剂量X线；主要代价是假阳性和过度诊断（查出本不会惹事的惰性病变）。超声无辐射。对 40 岁以上的大多数女性，净收益是正的。",
        en: "Mammography uses a small X-ray dose; the main downsides are false positives and overdiagnosis (finding indolent disease). Ultrasound has no radiation. Net benefit is favorable for most women from 40 onward.",
      },
      sources: [SOURCES.uspstfBreast2024],
    },
  },

  // ── REPRODUCTIVE ────────────────────────────────────────────────────────────
  {
    key: "cervical_screen",
    name: "Cervical screening (HPV / Pap)",
    nameZh: "宫颈筛查 (HPV / TCT)",
    regionId: "repro",
    category: "screening",
    appliesTo: { sex: "female" },
    startAge: 21,
    intervalMonths: 36,
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "预防医学的伟大胜利之一：HPV/TCT 检测能在癌前阶段抓住病变并轻松处理 — 宫颈癌如今基本可防。",
        en: "One of the great preventive wins: HPV/Pap testing catches pre-cancer that's easily treated — cervical cancer is now largely preventable.",
      },
      firstPrinciples: {
        zh: "几乎所有宫颈癌都由高危 HPV 的持续感染引起，它驱动一个长达数年的缓慢癌前过程（CIN）。检测病毒（HPV）和异常细胞（TCT）能在这条漫长、可治疗的跑道上拦截它；HPV 疫苗则从上游直接移除大部分病因。病因明确、跑道漫长、癌前处理简单 — 接近理想的筛查对象。",
        en: "Nearly all cervical cancer is caused by persistent high-risk HPV, which drives a slow precancer (CIN) over years. Testing for the virus (HPV) and abnormal cells (Pap/TCT) finds that precancer in its long, treatable window; plus HPV vaccination removes most of the cause upstream. Cause is known, runway is long, treatment of precancer is simple — a near-ideal screening target.",
      },
      roi: {
        zh: "非常高。美国平均风险的常规节奏：21–29 岁每 3 年一次细胞学；30–65 岁可选每 3 年细胞学、每 5 年高危 HPV、或每 5 年联合筛查。家人没打过 HPV 疫苗的，配套补上。",
        en: "Very high. The usual U.S. average-risk pattern is cytology every 3 years from 21-29, then cytology every 3 years, primary high-risk HPV every 5 years, or co-testing every 5 years from 30-65. Pair with HPV vaccination for family members who haven't had it.",
      },
      risks: {
        zh: "极小（短暂不适）。",
        en: "Minimal (brief discomfort).",
      },
      sources: [SOURCES.uspstfCervical2018],
    },
  },
  {
    key: "psa",
    name: "Prostate (PSA) discussion",
    nameZh: "前列腺 (PSA)",
    regionId: "repro",
    category: "screening",
    appliesTo: { sex: "male" },
    startAge: 55,
    intervalMonths: 24,
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "一项前列腺癌风险的血液检测 — 确有价值，但因为过度诊断问题，属于「医患共同决策」项目。",
        en: "A blood test for prostate cancer risk — genuinely useful but a shared decision because of overdiagnosis.",
      },
      firstPrinciples: {
        zh: "PSA 是一种随前列腺体积和病变升高的蛋白。它并不完美：查出的癌有很多生长极慢、一辈子不会惹事（过度诊断），同时也会漏掉一些。现代做法已大幅缓和这个缺点：风险分层的阈值、复测、活检前先做 MRI、以及用主动监测替代立刻治疗。",
        en: "PSA is a protein that rises with prostate volume and disease. It's imperfect: many cancers it finds are slow and would never harm you (overdiagnosis), while it also misses some. Modern practice softens the downside with risk-adjusted thresholds, repeat testing, MRI before biopsy, and active surveillance instead of immediate treatment.",
      },
      roi: {
        zh: "中等且因人而异。收益（减少前列腺癌死亡）是真实的，但单次检测的收益小于肠癌/血脂筛查，而代价端（活检焦虑、过度治疗）不可忽略 — 所以是「先讨论、别反射性开单」。有家族史则倾向「做、且更早做」。",
        en: "Moderate and personal. Benefit (fewer prostate-cancer deaths) is real but smaller per test than colon/lipid screening, and the harm side (biopsy anxiety, overtreatment) is non-trivial — hence 'discuss, don't reflex-order'. Family history shifts it toward 'yes, earlier'.",
      },
      risks: {
        zh: "检测本身只是抽血；它可能触发的后续链条（活检、过度治疗）才是真正要权衡的成本。",
        en: "The test is a blood draw; the cascade it can trigger (biopsy, overtreatment) is the actual cost to weigh.",
      },
      sources: [SOURCES.uspstfPsa2018],
    },
  },

  // ── LUNGS ────────────────────────────────────────────────────────────────
  {
    key: "ldct_lung",
    name: "Low-dose CT (lung)",
    nameZh: "低剂量胸部CT",
    regionId: "lungs",
    category: "screening",
    startAge: 50,
    appliesTo: { minAge: 50, maxAge: 80 },
    requiresRisk: "lung_ldct_high_risk",
    intervalMonths: 12,
    effort: "medium",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "主要面向（曾经的）吸烟者：低剂量 CT 能在肺癌还可治愈的早期把它揪出来。",
        en: "For (ex-)smokers especially: low-dose CT catches lung cancer early, when it's curable.",
      },
      firstPrinciples: {
        zh: "肺癌致命主要因为发现得晚。LDCT 能在症状出现前数年看到小结节；I 期肿瘤切除常可治愈，IV 期则预后很差。代价是假阳性（良性结节需要随访）和小剂量辐射。",
        en: "Lung cancer is lethal mostly because it's found late. LDCT sees small nodules years before symptoms; resecting a stage-I tumor is often curative, vs dismal survival at stage IV. The trade-off is false positives (benign nodules needing follow-up) and a small radiation dose.",
      },
      roi: {
        zh: "对高风险人群（大量吸烟史）回报非常高：NLST、NELSON 等试验显示肺癌死亡率降低约 20–24%。对从不吸烟、无暴露/家族史的人回报很低 — 这是按风险定向的筛查，不是人人都做的。",
        en: "Very high for high-risk groups (heavy smoking history): trials (NLST, NELSON) showed ~20–24% lung-cancer mortality reduction. Low ROI for lifelong never-smokers with no exposure/family history — this is risk-targeted, not universal.",
      },
      risks: {
        zh: "低剂量辐射；假阳性和意外发现会带来额外检查。",
        en: "Low radiation; false positives and incidental findings driving extra scans.",
      },
      sources: [SOURCES.cdcLung2025],
    },
  },

  // ── THYROID ────────────────────────────────────────────────────────────────
  {
    key: "thyroid",
    name: "Thyroid function & ultrasound",
    nameZh: "甲状腺功能 / 超声",
    regionId: "thyroid",
    category: "biomarker",
    intervalMonths: 24,
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "一管 TSH 血检（± 颈部超声），监测这个悄悄设定全身代谢节奏的器官。",
        en: "A TSH blood test (± neck ultrasound) for an organ that quietly sets your whole-body metabolic rate.",
      },
      firstPrinciples: {
        zh: "甲状腺通过 T3/T4 设定代谢节奏，受 TSH 调控。功能减退或亢进都很常见（尤其女性），表现为疲劳、体重和情绪变化 — 很容易被忽略或归因到别处。TSH 是一个灵敏的单一指标；超声能发现结节（绝大多数是良性 — 小结节别过度追查）。",
        en: "The thyroid sets metabolic tempo via T3/T4, regulated by TSH. Under- or over-activity is common (especially in women) and causes fatigue, weight and mood changes that are easy to miss or misattribute. TSH is a sensitive single number; ultrasound finds nodules (mostly benign — avoid over-investigating small ones).",
      },
      roi: {
        zh: "中等。TSH 便宜，且能解决一类常见、可治疗的「说不清的不舒服」。注意：无差别地「找结节」会导致过度诊断 — 有理由再扫。",
        en: "Moderate. TSH is cheap and fixes a common, treatable cause of vague symptoms. Caution: indiscriminate nodule hunting leads to overdiagnosis, so scan with a reason.",
      },
      risks: {
        zh: "抽血可忽略；主要的坑是良性结节的过度诊断。",
        en: "Blood test trivial; main pitfall is overdiagnosis of benign nodules.",
      },
      sources: [SOURCES.generalClinicalReference],
    },
  },

  // ── SKIN ────────────────────────────────────────────────────────────────────
  {
    key: "skin_check",
    name: "Skin / mole check",
    nameZh: "皮肤 / 痣检查",
    regionId: "skin",
    category: "screening",
    intervalMonths: 12,
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "目视检查变化的痣（自查+皮肤科）— 黑色素瘤浅时几乎可治愈，深时致命。",
        en: "A visual check (self + dermatologist) for changing moles — melanoma is curable when thin, deadly when deep.",
      },
      firstPrinciples: {
        zh: "黑色素瘤的危险程度随侵犯深度变化；薄的病变早期切除几乎总能治愈，深的会转移。皮肤是可见的，所以「探测器」就是一双训练过的眼睛 — 成本极低。自查用 ABCDE 法则：不对称（Asymmetry）、边界（Border）、颜色（Color）、直径（Diameter）、演变（Evolving）。",
        en: "Melanoma's danger scales with depth of invasion; a thin lesion caught early is nearly always cured by simple excision, while a deep one metastasizes. Because skin is visible, the detection 'sensor' is just trained eyes — extremely cheap. Use ABCDE (Asymmetry, Border, Color, Diameter, Evolving) for self-checks.",
      },
      roi: {
        zh: "目视检查的「付出/收益」比很好，尤其是肤色浅、痣多、有日晒或家族史的人。自我监测基本免费。",
        en: "High effort-to-payoff for a low-cost visual exam, especially with fair skin, lots of moles, or sun/family history. Mostly free to self-monitor.",
      },
      risks: {
        zh: "看一看没有任何风险；对可疑皮损的活检也是小操作。",
        en: "None for looking; biopsies of suspicious spots are minor.",
      },
      sources: [SOURCES.generalClinicalReference],
    },
  },

  // ── DENTAL ──────────────────────────────────────────────────────────────────
  {
    key: "dental",
    name: "Dental cleaning & exam",
    nameZh: "口腔检查 / 洗牙",
    regionId: "dental",
    category: "screening",
    intervalMonths: 6,
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "每年 1–2 次洗牙防蛀牙和牙周病 — 而且牙龈炎症与心血管/代谢风险的关联越来越明确。",
        en: "Twice-yearly cleaning prevents cavities and gum disease — and gum inflammation is increasingly linked to heart and metabolic risk.",
      },
      firstPrinciples: {
        zh: "牙菌斑细菌导致龋齿和牙周炎（慢性牙龈炎症）。在口腔之外，牙周炎症与心血管和代谢疾病相关 — 这是一个你可以低成本移除的全身性低度炎症输入。早抓蛀牙意味着补一小块，而不是根管。",
        en: "Plaque bacteria drive caries and periodontitis (chronic gum inflammation). Beyond the mouth, periodontal inflammation is associated with cardiovascular and metabolic disease — a low-grade systemic inflammatory input you can remove cheaply. Catching cavities early means a small filling, not a root canal.",
      },
      roi: {
        zh: "高且被低估。便宜、常规，能避免日后昂贵又疼的麻烦，可能还顺手降一点全身炎症。经典的低垂果实。",
        en: "High and underrated. Cheap, routine, prevents expensive/painful problems later, and may shave a bit of systemic inflammation. Classic low-hanging fruit.",
      },
      risks: {
        zh: "可忽略。",
        en: "Negligible.",
      },
      sources: [SOURCES.generalClinicalReference],
    },
  },

  // ── EYES ────────────────────────────────────────────────────────────────────
  {
    key: "eye_exam",
    name: "Comprehensive eye exam",
    nameZh: "眼科检查",
    regionId: "mind",
    category: "screening",
    intervalMonths: 24,
    effort: "low",
    payoff: "medium",
    knowledge: {
      summary: {
        zh: "查视力，更查静默的威胁 — 青光眼、视网膜/糖尿病性病变 — 视网膜还能预览你的血管健康。",
        en: "Checks vision plus silent threats — glaucoma, retinal/diabetic changes — and the retina even previews vascular health.",
      },
      firstPrinciples: {
        zh: "青光眼对视神经的损伤无痛且不可逆，只有测眼压+看视神经才能发现。视网膜还是全身唯一能直接「看见」小血管的地方 — 糖尿病和高血压的血管损伤最先在这里显形，所以眼睛是观察全身血管健康的一扇窗。",
        en: "Glaucoma damages the optic nerve painlessly and irreversibly; it's only caught by measuring eye pressure and looking at the nerve. The retina is also the one place you can directly SEE small blood vessels — diabetic and hypertensive damage shows up there first, making the eye a window onto systemic vascular health.",
      },
      roi: {
        zh: "中到高：早期拦截不可逆的视力损失，还顺带做了一次血管检查。便宜且快。",
        en: "Moderate–high: catches irreversible vision loss early and doubles as a vascular check. Cheap and quick.",
      },
      risks: {
        zh: "无。",
        en: "None.",
      },
      sources: [SOURCES.generalClinicalReference],
    },
  },

  // ── MIND / SLEEP / LIFESTYLE ────────────────────────────────────────────────
  {
    key: "mental_health",
    name: "Mental health & stress",
    nameZh: "心理健康 / 压力",
    regionId: "mind",
    category: "lifestyle",
    intervalMonths: 6,
    effort: "low",
    payoff: "high",
    knowledge: {
      summary: {
        zh: "长期压力、焦虑、低落和睡不好是健康的「输入变量」，不是软性附加项 — 它们会推动其他所有指标。",
        en: "Chronic stress, anxiety, low mood and poor sleep are health inputs, not soft extras — they move every other number.",
      },
      firstPrinciples: {
        zh: "慢性压力让皮质醇和交感神经长期偏高，推高血压和血糖、扰乱睡眠，并驱动让代谢更糟的行为（喝酒、暴食）。睡眠是大脑清理代谢废物、身体修复的时段 — 长期睡眠不足会独立推高心血管代谢风险。这些都会反馈到这个看板的肝、心和代谢区域。",
        en: "Chronic stress keeps cortisol and sympathetic tone elevated, which raises blood pressure and glucose, disturbs sleep, and drives behaviors (drinking, overeating) that worsen the metabolic picture. Sleep is when the brain clears metabolic waste and the body repairs — chronic short sleep independently raises cardiometabolic risk. These feed back into the liver, heart, and metabolic regions of this dashboard.",
      },
      roi: {
        zh: "高，且常被忽略。一次简短自评（PHQ-9 / GAD-7）加上守住睡眠和恢复，下游收益广泛、成本几乎为零。这是你其他几盏灯背后的上游杠杆。",
        en: "High and often ignored. A brief self-check (PHQ-9 / GAD-7) plus protecting sleep and recovery has broad downstream payoff and essentially no cost. This is the upstream lever behind several of your other lights.",
      },
      risks: {
        zh: "自评没有任何风险；风险在于一直不去测它。",
        en: "None to check in; the risk is leaving it unmeasured.",
      },
      sources: [SOURCES.generalClinicalReference],
    },
  },
];

export function regionById(id: string): BodyRegion | undefined {
  return BODY_REGIONS.find((r) => r.id === id);
}

export function itemByKey(key: string): HealthItem | undefined {
  return HEALTH_ITEMS.find((i) => i.key === key);
}

/** Items that apply to a given person (sex/age gating). */
export function itemsForPerson(sex: "male" | "female", ageYears: number): HealthItem[] {
  return HEALTH_ITEMS.filter((it) => {
    const a = it.appliesTo;
    if (!a) return true;
    if (a.sex && a.sex !== sex) return false;
    if (a.minAge != null && ageYears < a.minAge) return false;
    if (a.maxAge != null && ageYears > a.maxAge) return false;
    return true;
  });
}
