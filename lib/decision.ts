import { L, PersonDTO } from "./types";
import { ageYears } from "./status";

export interface PersonalSedationNote {
  band: "low" | "moderate" | "elevated";
  headline: L;
  detail: L;
  flags: L[];
}

/**
 * Turn a person's age + recorded risk factors into a plain-language, profile-
 * adjusted read on sedation (无痛) risk for GI endoscopy. Honest and bounded —
 * population figures nudged by the few factors that genuinely move sedation risk
 * (age, sleep apnea / airway, heart-lung disease, prior anesthesia reaction).
 */
export function personalSedationNote(person: PersonDTO): PersonalSedationNote {
  const age = ageYears(person.birthDate);
  const c = person.riskFactors?.conditions ?? {};
  const flags: L[] = [];

  if (c.sleepApnea)
    flags.push({
      zh: "睡眠呼吸暂停（镇静时气道需要额外关注）",
      en: "sleep apnea (airway needs extra care under sedation)",
    });
  if (c.heartLungDisease)
    flags.push({
      zh: "心肺疾病（会提高镇静风险）",
      en: "heart/lung disease (raises sedation risk)",
    });
  if (c.anesthesiaReaction)
    flags.push({
      zh: "既往麻醉不良反应（务必告知麻醉医生）",
      en: "a prior reaction to anesthesia (tell the anesthetist)",
    });
  if (age >= 70)
    flags.push({
      zh: "70 岁以上（镇静风险随年龄逐渐上升）",
      en: "age 70+ (sedation risk rises gradually with age)",
    });

  const band: PersonalSedationNote["band"] =
    flags.length === 0 && age < 60 ? "low" : flags.length >= 2 || age >= 75 ? "elevated" : "moderate";

  if (band === "low") {
    return {
      band,
      headline: {
        zh: `${age} 岁、健康、档案中无麻醉警示项`,
        en: `At ${age}, healthy, no anesthesia red flags on file`,
      },
      detail: {
        zh: "对你这样的人，监护下的丙泊酚镇静处在风险最低档 — 严重不良事件约每万例 1–2 例，且绝大多数只是呼吸或血压的短暂下降，麻醉医生当场即可纠正。几年一次的单次镇静是一个小的、有边界的、可逆的成本。",
        en: "For someone like you, monitored propofol sedation sits at the low end — serious adverse events on the order of ~1–2 per 10,000 procedures, and the large majority are a brief dip in breathing or blood pressure the anesthetist corrects on the spot. A single sedation every few years is a small, bounded, reversible cost.",
      },
      flags,
    };
  }

  if (band === "elevated") {
    return {
      band,
      headline: {
        zh: "有几项因素使你的镇静风险高于基线",
        en: "A few factors raise your sedation risk above baseline",
      },
      detail: {
        zh: "你的档案中有会实质性改变镇静方案讨论的因素，所以这件事应当与麻醉医生一起规划，而不是当作例行公事。检查本身仍然可以很值得做 — 重点是镇静方案要个体化（更浅的镇静、麻醉医生主导的监护，或某些情况下选择不镇静/超细镜）。",
        en: "Your profile has factors that meaningfully change the sedation conversation, so this is one to plan with an anesthetist rather than treat as routine. The exam can still be very worthwhile — the point is the sedation plan should be tailored (lighter sedation, anesthetist-led monitoring, or in some cases an unsedated/ultrathin option).",
      },
      flags,
    };
  }

  return {
    band,
    headline: {
      zh: "略高于最年轻/最健康的基线 — 仍然不高",
      en: "Slightly above the youngest/healthiest baseline — still modest",
    },
    detail: {
      zh: "你的镇静风险比最低档略高一点，但对监护下的操作来说仍然不大。请把下面列出的事项告知麻醉医生；对这一档的大多数人来说，「无痛」依然是合理、低风险的选择。",
      en: "Your sedation risk is a notch above the lowest band but still modest for a monitored procedure. Flag the items below to the anesthetist; for most people in this band 无痛 remains a reasonable, low-risk choice.",
    },
    flags,
  };
}
