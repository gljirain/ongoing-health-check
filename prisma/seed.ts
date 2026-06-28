// Demo seed — entirely FICTIONAL data so a fresh clone shows a populated, lively
// dashboard. No real person. (Your own private data, if any, lives in the
// gitignored prisma/seed.local.ts — run `npm run db:seed:local`.)
import { PrismaClient } from "@prisma/client";
import { seedExplainers } from "../lib/lab-explainers";

const prisma = new PrismaClient();

async function main() {
  const birthDate = new Date("1972-05-20"); // ~52 — old enough that most screenings are relevant
  const demoNotes =
    "Fictional demo profile to show how the dashboard works — every value here is made up. " +
    "Add your own data, or import a report, to replace it.";
  const me = await prisma.person.upsert({
    where: { id: "self" },
    update: { name: "Demo User", sex: "male", birthDate, isSelf: true, notes: demoNotes },
    create: {
      id: "self",
      name: "Demo User",
      sex: "male",
      birthDate,
      isSelf: true,
      notes: demoNotes,
      riskFactors: {
        smoking: { status: "former", packYears: 5, quitYearsAgo: 12 },
        familyHistory: { colorectalCancer: false, breastCancer: false, gastricCancer: false, prostateCancer: false },
        conditions: { ibd: false, hereditaryCancerSyndrome: false, sleepApnea: false, heartLungDisease: false, anesthesiaReaction: false },
      },
    },
  });

  const y = (s: string) => new Date(s);
  const entries = [
    // Colonoscopy done recently & clean → the app marks FIT/DRE "covered" (supersession demo).
    { itemKey: "colonoscopy", performedAt: y("2024-03-10"), status: "green", valueText: "Clean exam; one small benign polyp removed.", notes: "Demo. Next routine scope ~10y if no new risk." },
    // Metabolic
    { itemKey: "lipids", performedAt: y("2025-09-02"), status: "yellow", valueText: "LDL-C 3.6 mmol/L (mildly high); HDL 1.1; TG 1.8.", notes: "Demo — borderline; diet + recheck." },
    { itemKey: "hba1c", performedAt: y("2025-09-02"), status: "green", valueText: "HbA1c 5.5% — normal.", notes: "Demo." },
    { itemKey: "blood_pressure", performedAt: y("2025-09-02"), status: "yellow", valueText: "138/86 mmHg (stage-1 range).", notes: "Demo — recheck at home over a week." },
    // Liver / abdomen
    { itemKey: "fatty_liver", performedAt: y("2025-09-02"), status: "yellow", valueText: "Mild fatty liver on ultrasound; liver enzymes normal.", notes: "Demo — simple steatosis; weight + sugar." },
    // Heart
    { itemKey: "carotid", performedAt: y("2025-09-02"), status: "green", valueText: "Carotid ultrasound normal — no plaque.", notes: "Demo." },
    // Thyroid / vitamin
    { itemKey: "thyroid", performedAt: y("2025-09-02"), status: "green", valueText: "TSH 2.1, FT4 normal; thyroid ultrasound clear.", notes: "Demo." },
    { itemKey: "vitamin_d", performedAt: y("2025-09-02"), status: "yellow", valueText: "25-OH vitamin D 58 nmol/L — insufficient.", notes: "Demo — daily D3 + sun." },
    // Dental / eyes
    { itemKey: "dental", performedAt: y("2025-02-14"), status: "green", valueText: "Cleaning + exam, no issues.", notes: "Demo." },
    { itemKey: "eye_exam", performedAt: y("2023-06-01"), status: "green", valueText: "Vision check normal; mild near-sightedness.", notes: "Demo — due for a refresh." },
    // Layer-0 labs (show the lab panels + trend)
    { itemKey: "lab.alt", performedAt: y("2025-09-02"), status: "green", valueText: "30 U/L", label: "丙氨酸氨基转移酶 (ALT)", unit: "U/L", refText: "0-50", panel: "liver" },
    { itemKey: "lab.creatinine", performedAt: y("2025-09-02"), status: "green", valueText: "82 umol/L", label: "肌酐 (Creatinine)", unit: "umol/L", refText: "57-97", panel: "kidney" },
    { itemKey: "lab.ua", performedAt: y("2025-09-02"), status: "yellow", valueText: "440 umol/L", label: "尿酸 (Uric acid)", unit: "umol/L", refText: "150-420", panel: "kidney" },
    { itemKey: "lab.hgb", performedAt: y("2025-09-02"), status: "green", valueText: "150 g/L", label: "血红蛋白 (Hemoglobin)", unit: "g/L", refText: "130-175", panel: "blood_count" },
    // Condition + procedure (show the Medical history section)
    { itemKey: "condition.hypertension", performedAt: y("2024-01-01"), status: "yellow", valueText: "高血压 (Hypertension)", label: "高血压 (Hypertension)", notes: "Demo — diet-controlled, monitoring at home." },
    { itemKey: "procedure.appendectomy", performedAt: y("2010-08-15"), valueText: "阑尾切除术 (Appendectomy)", label: "阑尾切除术 (Appendectomy)", notes: "Demo — uncomplicated, laparoscopic." },
  ];

  await prisma.entry.deleteMany({ where: { personId: me.id } });
  for (const e of entries) {
    await prisma.entry.create({ data: { ...e, personId: me.id } });
  }

  const n = await seedExplainers(prisma);
  console.log(`Seeded demo profile with ${entries.length} entries + ${n} reviewed lab explainers.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
