// Curated, reviewed Layer-1 explainers for the most common Chinese 体检 markers.
// Seeded into the LabExplainer cache (reviewed: true) so users see vetted content
// immediately. Canonical slugs here MUST match the parser's canonical-slug list
// in lib/ai.ts (PARSE_SYSTEM), so imported labs resolve to these.

export interface LabExplainerSeed {
  slug: string;
  zh: string;
  en: string;
}

export const LAB_EXPLAINERS: LabExplainerSeed[] = [
  // ── Liver ──
  {
    slug: "alt",
    zh: "丙氨酸氨基转移酶（ALT/谷丙转氨酶）主要存在于肝细胞内。升高通常提示肝细胞受刺激或损伤——常见于脂肪肝、饮酒、药物或病毒性肝炎。轻度升高很常见，结合 AST 和生活方式一起看更有意义。",
    en: "ALT (alanine aminotransferase) lives mostly inside liver cells. A rise usually means the liver is irritated or injured — fatty liver, alcohol, medications, or viral hepatitis are common causes. Mild elevations are common; read it alongside AST and lifestyle.",
  },
  {
    slug: "ast",
    zh: "天冬氨酸氨基转移酶（AST/谷草转氨酶）存在于肝脏，也存在于心肌和肌肉。和 ALT 一起升高多指向肝脏；单独 AST 高有时来自剧烈运动或肌肉。AST/ALT 的比值能帮助区分原因。",
    en: "AST (aspartate aminotransferase) is in the liver but also heart and muscle. Rising together with ALT points to the liver; an isolated AST bump can come from hard exercise or muscle. The AST/ALT ratio helps distinguish the cause.",
  },
  {
    slug: "ggt",
    zh: "γ-谷氨酰转移酶（GGT）对酒精和胆道问题尤其敏感。升高常与饮酒、脂肪肝或胆汁淤积有关，是判断「转氨酶升高是不是和酒精/胆道相关」的有用旁证。",
    en: "GGT (gamma-glutamyl transferase) is especially sensitive to alcohol and bile-duct issues. Elevations often track with drinking, fatty liver, or bile flow problems — a useful clue for whether liver enzymes relate to alcohol or the biliary tract.",
  },
  {
    slug: "alp",
    zh: "碱性磷酸酶（ALP）主要来自肝胆系统和骨骼。升高可见于胆道梗阻或骨骼活跃（青少年、骨愈合也会偏高）。需要结合 GGT 等一起判断来源。",
    en: "Alkaline phosphatase (ALP) comes mainly from the liver/bile ducts and bone. Highs can mean bile-duct blockage or active bone turnover (also normally higher in teens or during bone healing). Read with GGT to locate the source.",
  },
  {
    slug: "tbil",
    zh: "总胆红素（TBIL）是红细胞分解的产物，由肝脏处理后排出。轻度升高很常见，多为良性的吉尔伯特综合征（禁食或疲劳时更明显）；明显升高需排查肝脏或胆道问题。",
    en: "Total bilirubin (TBIL) is a breakdown product of red cells, processed by the liver. Mild elevations are common and often benign (Gilbert's syndrome, worse with fasting/fatigue); marked elevations warrant a look at the liver or bile ducts.",
  },
  {
    slug: "alb",
    zh: "白蛋白（ALB）是肝脏合成的主要血浆蛋白，反映营养状况和肝脏合成功能。偏低可见于营养不良、慢性炎症或肝/肾问题；它也帮助维持血管内的液体平衡。",
    en: "Albumin (ALB) is the main blood protein made by the liver, reflecting nutrition and the liver's synthetic function. Low levels can signal poor nutrition, chronic inflammation, or liver/kidney issues; it also helps hold fluid in the vessels.",
  },
  {
    slug: "tp",
    zh: "总蛋白（TP）是血液中白蛋白和球蛋白的总和。异常通常需要看白蛋白/球蛋白的比例来解读，单独看意义有限。",
    en: "Total protein (TP) is albumin plus globulins in the blood. An abnormal value usually needs the albumin/globulin breakdown to interpret — on its own it says little.",
  },
  // ── Kidney ──
  {
    slug: "creatinine",
    zh: "肌酐（Cr）是肌肉代谢的废物，由肾脏滤过排出，是肾功能的核心指标。升高提示肾脏滤过能力下降；它也受肌肉量影响（肌肉多的人偏高属正常）。常与 eGFR 一起看。",
    en: "Creatinine is a muscle-metabolism waste cleared by the kidneys — a core kidney-function marker. A rise suggests reduced filtering; it's also affected by muscle mass (muscular people run higher normally). Read with eGFR.",
  },
  {
    slug: "urea",
    zh: "尿素（BUN）是蛋白质代谢的废物，由肾脏排出。升高可见于肾功能下降，也受高蛋白饮食、脱水影响，特异性不如肌酐。",
    en: "Urea (BUN) is a protein-metabolism waste cleared by the kidneys. Highs can reflect reduced kidney function but are also swayed by high-protein diet and dehydration — less specific than creatinine.",
  },
  {
    slug: "ua",
    zh: "尿酸（UA）是嘌呤代谢的产物。长期偏高会沉积在关节引发痛风，也与代谢综合征、肾结石相关。受饮食（海鲜、内脏、酒、果糖）影响很大，是可通过生活方式调节的指标。",
    en: "Uric acid (UA) is a purine-metabolism product. Chronically high levels can crystallize in joints (gout) and link to metabolic syndrome and kidney stones. Diet (seafood, organ meat, alcohol, fructose) strongly affects it — a modifiable number.",
  },
  {
    slug: "egfr",
    zh: "估算肾小球滤过率（eGFR）由肌酐、年龄、性别算出，估计肾脏每分钟过滤血液的能力，是肾功能最直观的总评分。≥90 一般正常；持续偏低提示慢性肾病，需随访。",
    en: "Estimated GFR (eGFR) is computed from creatinine, age, and sex to estimate how much blood the kidneys filter per minute — the most intuitive overall kidney score. ≥90 is generally normal; a persistently low value suggests chronic kidney disease and needs follow-up.",
  },
  // ── Metabolic / lipid ──
  {
    slug: "glu",
    zh: "空腹血糖（GLU）反映当下的血糖水平。偏高可能是糖尿病前期或糖尿病的信号，但单次空腹值会受饮食和应激影响；糖化血红蛋白（HbA1c）能反映近 3 个月的平均水平，更稳定。",
    en: "Fasting glucose (GLU) reflects your current blood sugar. Highs can flag pre-diabetes or diabetes, but a single fasting value is swayed by diet and stress; HbA1c (3-month average) is steadier.",
  },
  {
    slug: "tcho",
    zh: "总胆固醇（TC）是血液中各类胆固醇的总和。它本身不如「坏胆固醇」LDL 有针对性——同样的总值，LDL 高还是 HDL 高，意义完全不同。要看分项。",
    en: "Total cholesterol (TC) sums all cholesterol types in the blood. It's less informative than LDL ('bad') on its own — the same total means very different things depending on whether LDL or HDL is driving it. Look at the breakdown.",
  },
  {
    slug: "tg",
    zh: "甘油三酯（TG）是血液中储存能量的脂肪，对饮食和酒精非常敏感（检查前要空腹）。长期偏高与胰岛素抵抗、脂肪肝相关，主要靠减少精制碳水、糖和酒精来改善。",
    en: "Triglycerides (TG) are the blood's energy-storage fat, very sensitive to diet and alcohol (fast before testing). Chronically high levels track with insulin resistance and fatty liver, improved mainly by cutting refined carbs, sugar, and alcohol.",
  },
  {
    slug: "hdl",
    zh: "高密度脂蛋白（HDL，「好胆固醇」）把多余的胆固醇运回肝脏处理，偏高通常是保护性的。运动和健康脂肪能提升它。它和「坏胆固醇」LDL 的作用方向相反。",
    en: "HDL ('good cholesterol') ferries excess cholesterol back to the liver — higher is generally protective. Exercise and healthy fats raise it. It works in the opposite direction to LDL ('bad cholesterol').",
  },
  // ── Blood count ──
  {
    slug: "wbc",
    zh: "白细胞（WBC）是免疫系统的「军队」。升高常见于感染或炎症（也会因应激、吸烟短暂升高）；偏低可见于某些病毒感染、药物或免疫问题。需要结合分类（中性粒/淋巴）来解读。",
    en: "White blood cells (WBC) are the immune system's army. Highs commonly mean infection or inflammation (also transiently from stress or smoking); lows can come from some viral infections, medications, or immune issues. The differential (neutrophils/lymphocytes) refines it.",
  },
  {
    slug: "rbc",
    zh: "红细胞（RBC）携带血红蛋白运输氧气。偏低提示贫血，偏高可见于脱水或缺氧代偿。通常和血红蛋白、红细胞压积一起解读。",
    en: "Red blood cells (RBC) carry hemoglobin to deliver oxygen. Low suggests anemia; high can come from dehydration or low-oxygen compensation. Read with hemoglobin and hematocrit.",
  },
  {
    slug: "hgb",
    zh: "血红蛋白（HGB）是红细胞里携带氧气的蛋白，是判断贫血最直接的指标。偏低（贫血）常见原因是缺铁；男性不明原因的贫血需要查找出血来源。",
    en: "Hemoglobin (HGB) is the oxygen-carrying protein in red cells — the most direct anemia marker. Low (anemia) is often iron deficiency; unexplained anemia in men warrants a search for a bleeding source.",
  },
  {
    slug: "plt",
    zh: "血小板（PLT）负责止血凝血。偏低出血风险增加，偏高可见于炎症、缺铁或（少见）骨髓问题。FIB-4 等肝纤维化评分也会用到它。",
    en: "Platelets (PLT) drive clotting. Low raises bleeding risk; high can come from inflammation, iron deficiency, or (rarely) marrow problems. Fibrosis scores like FIB-4 also use it.",
  },
  // ── Electrolytes ──
  {
    slug: "k",
    zh: "钾（K）是维持心脏和肌肉正常电活动的关键电解质。过高或过低都可能影响心律，因此偏离正常范围时医生会重视。受肾功能、药物和饮食影响。",
    en: "Potassium (K) is a key electrolyte for normal heart and muscle electrical activity. Both highs and lows can affect heart rhythm, so doctors take out-of-range values seriously. Influenced by kidney function, medications, and diet.",
  },
  {
    slug: "na",
    zh: "钠（Na）主要决定体内的水分平衡和血压。异常通常反映的是水的问题（脱水或水潴留）而非盐本身，需结合临床判断。",
    en: "Sodium (Na) largely governs your body's water balance and blood pressure. Abnormal values usually reflect a water problem (dehydration or fluid retention) more than salt itself, interpreted in clinical context.",
  },
  {
    slug: "ca",
    zh: "钙（Ca）对骨骼、肌肉收缩和神经传导都重要，血钙由甲状旁腺等精密调控。明显异常需排查甲状旁腺、维生素D 或肾脏问题。",
    en: "Calcium (Ca) matters for bone, muscle contraction, and nerve signaling, with blood levels tightly regulated (e.g. by the parathyroid). Marked abnormalities warrant checking the parathyroid, vitamin D, or kidneys.",
  },
  // ── Tumor markers ──
  {
    slug: "cea",
    zh: "癌胚抗原（CEA）是一种肿瘤标志物，但特异性不高——吸烟、炎症、良性肠道/肺部疾病都可能让它轻度升高。单次轻度升高多无大碍，重要的是趋势和结合其他检查。",
    en: "CEA is a tumor marker, but not very specific — smoking, inflammation, and benign gut/lung conditions can mildly raise it. A single mild elevation is usually not alarming; the trend and other tests matter more.",
  },
  {
    slug: "afp",
    zh: "甲胎蛋白（AFP）主要用于肝癌和某些生殖细胞肿瘤的辅助监测，慢性肝病时也可能轻度升高。对没有肝病背景的人，正常的 AFP 是常规的安心指标。",
    en: "AFP (alpha-fetoprotein) is used mainly to help monitor liver cancer and certain germ-cell tumors, and can be mildly raised in chronic liver disease. For someone without liver disease, a normal AFP is routine reassurance.",
  },
  {
    slug: "ca199",
    zh: "糖类抗原19-9（CA19-9）多用于胰腺和胆道肿瘤的辅助监测，但良性胆道炎症、梗阻也会升高，特异性有限。轻度升高常需复查随访而非立即担心。",
    en: "CA19-9 is used mainly to help monitor pancreatic and biliary tumors, but benign bile-duct inflammation or blockage can raise it too — limited specificity. Mild elevations usually mean recheck and follow, not immediate alarm.",
  },
  {
    slug: "ca724",
    zh: "糖类抗原72-4（CA72-4）是最不特异的肿瘤标志物之一：饮食、痛风药、良性胃肠道疾病甚至部分健康人都可能让它轻度升高。孤立的轻度升高通常意义有限，建议定期复查看趋势。",
    en: "CA72-4 is one of the least specific tumor markers: diet, gout medications, benign GI conditions, and even some healthy people can nudge it up. An isolated mild elevation usually means little — recheck for the trend.",
  },
  {
    slug: "ca125",
    zh: "糖类抗原125（CA125）常用于卵巢相关监测，但在月经、子宫内膜异位、炎症等良性情况下也会升高，单次结果需谨慎解读。",
    en: "CA125 is often used for ovarian-related monitoring, but rises in benign conditions too (menstruation, endometriosis, inflammation), so a single result needs cautious interpretation.",
  },
  // ── Thyroid ──
  {
    slug: "tsh",
    zh: "促甲状腺激素（TSH）是判断甲状腺功能最灵敏的单一指标。TSH 偏高通常提示甲状腺偏「懒」（功能减退），偏低提示偏「亢」（功能亢进）——方向和直觉相反，因为它是大脑发给甲状腺的指令。",
    en: "TSH (thyroid-stimulating hormone) is the single most sensitive thyroid-function marker. High TSH usually means an underactive thyroid, low TSH an overactive one — counterintuitively, because it's the brain's signal *to* the thyroid.",
  },
  {
    slug: "ft4",
    zh: "游离甲状腺素（FT4）是甲状腺实际分泌的活性激素水平，常和 TSH 一起判断甲状腺功能。两者结合能区分问题出在甲状腺本身还是大脑的调控。",
    en: "Free T4 (FT4) is the level of active hormone the thyroid actually secretes, read together with TSH. The pair distinguishes whether a problem is in the thyroid itself or the brain's control of it.",
  },
  // ── Vitamins / inflammation ──
  {
    slug: "vitd",
    zh: "25-羟维生素D 反映体内维生素D 储备，影响骨骼、肌肉和免疫。室内工作、防晒、高纬度都会让它偏低，不足非常普遍，缺了用便宜的口服补充剂即可纠正。",
    en: "25-OH vitamin D reflects your vitamin D stores, affecting bone, muscle, and immunity. Indoor work, sunscreen, and high latitudes drive it down; insufficiency is very common and easily fixed with a cheap oral supplement.",
  },
  {
    slug: "crp",
    zh: "C反应蛋白（CRP）是炎症的快速标志物，感染或组织损伤时迅速升高。高敏 CRP（hs-CRP）还能反映与心血管风险相关的低度慢性炎症。",
    en: "C-reactive protein (CRP) is a fast inflammation marker, rising quickly with infection or tissue injury. High-sensitivity CRP (hs-CRP) also reflects the low-grade chronic inflammation tied to cardiovascular risk.",
  },
  {
    slug: "homocysteine",
    zh: "同型半胱氨酸是一种氨基酸，偏高与心血管风险相关，常因叶酸、维生素B12/B6 不足引起，补充相应维生素往往可以降低。",
    en: "Homocysteine is an amino acid; elevated levels associate with cardiovascular risk and often stem from low folate or vitamin B12/B6 — usually lowerable by replacing those vitamins.",
  },
  {
    slug: "esr",
    zh: "血沉（ESR）是红细胞在试管中下沉的速度，是一个非特异的炎症指标。升高提示体内存在炎症或感染，但不能定位原因，需结合症状和其他检查。",
    en: "ESR (erythrocyte sedimentation rate) is how fast red cells settle in a tube — a non-specific inflammation marker. A rise signals inflammation or infection somewhere, but doesn't localize it; read with symptoms and other tests.",
  },
  // ── Coagulation ──
  {
    slug: "pt",
    zh: "凝血酶原时间（PT）衡量血液通过「外源性途径」凝固的速度，主要反映几个凝血因子和肝脏合成功能。延长可见于肝病、维生素K 缺乏或服用华法林等抗凝药。常与 INR 一起报告。",
    en: "Prothrombin time (PT) measures how fast blood clots via the 'extrinsic' pathway, reflecting several clotting factors and liver function. Prolongation can come from liver disease, vitamin K deficiency, or anticoagulants like warfarin. Reported with INR.",
  },
  {
    slug: "inr",
    zh: "国际标准化比值（INR）是把 PT 标准化后的数值，方便跨实验室比较。对没有服用抗凝药的人，INR 约 1 属正常；服用华法林者会按目标范围调整剂量。",
    en: "INR (international normalized ratio) standardizes PT so results compare across labs. For someone not on blood thinners, an INR around 1 is normal; people on warfarin are dosed to a target range.",
  },
  {
    slug: "aptt",
    zh: "活化部分凝血活酶时间（APTT）衡量「内源性途径」的凝血速度，用于评估另一组凝血因子，也用于监测肝素类抗凝。轻微偏差常无大碍，明显异常需进一步检查。",
    en: "APTT (activated partial thromboplastin time) measures the 'intrinsic' clotting pathway, assessing another set of factors and used to monitor heparin. Small deviations are often unimportant; marked abnormalities warrant follow-up.",
  },
  {
    slug: "fib",
    zh: "纤维蛋白原（FIB）是凝血的关键蛋白，也是一种急性期反应物——炎症、感染时会升高。偏低可能影响凝血，明显异常需结合临床判断。",
    en: "Fibrinogen (FIB) is a key clotting protein and also an acute-phase reactant — it rises with inflammation or infection. Low levels can impair clotting; marked abnormalities are interpreted in clinical context.",
  },
];

/** Upsert all curated explainers as reviewed:true. Used by dev seed + desktop template. */
export async function seedExplainers(
  prisma: import("@prisma/client").PrismaClient,
): Promise<number> {
  for (const e of LAB_EXPLAINERS) {
    await prisma.labExplainer.upsert({
      where: { slug: e.slug },
      update: { zh: e.zh, en: e.en, reviewed: true },
      create: { slug: e.slug, zh: e.zh, en: e.en, reviewed: true },
    });
  }
  return LAB_EXPLAINERS.length;
}
