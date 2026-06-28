import assert from "node:assert/strict";
import { itemByKey } from "../lib/catalog";
import { computeItemStatus } from "../lib/status";
import { EntryDTO, PersonDTO } from "../lib/types";

const entries: EntryDTO[] = [];
const lung = itemByKey("ldct_lung");
assert.ok(lung);

const basePerson: PersonDTO = {
  id: "p1",
  name: "Test",
  sex: "male",
  birthDate: "1970-01-01T00:00:00.000Z",
  isSelf: true,
};

const neverSmoker = computeItemStatus(
  lung,
  entries,
  {
    ...basePerson,
    riskFactors: { smoking: { status: "never", packYears: 0, quitYearsAgo: null } },
  },
  new Date("2026-06-07T00:00:00.000Z"),
);
assert.equal(neverSmoker.eligibility, "not_applicable");
assert.equal(neverSmoker.light, "gray");
assert.equal(neverSmoker.priority, 0);

const unknownSmoking = computeItemStatus(lung, entries, basePerson, new Date("2026-06-07T00:00:00.000Z"));
assert.equal(unknownSmoking.eligibility, "risk_unknown");
assert.equal(unknownSmoking.light, "gray");
assert.match(unknownSmoking.reason.en, /smoking history/i);
assert.match(unknownSmoking.reason.zh, /吸烟史/);

const highRiskFormer = computeItemStatus(
  lung,
  entries,
  {
    ...basePerson,
    riskFactors: { smoking: { status: "former", packYears: 25, quitYearsAgo: 10 } },
  },
  new Date("2026-06-07T00:00:00.000Z"),
);
assert.equal(highRiskFormer.eligibility, "eligible");
assert.equal(highRiskFormer.light, "red");

const colonoscopy = itemByKey("colonoscopy");
assert.ok(colonoscopy);
const notYet = computeItemStatus(
  colonoscopy,
  entries,
  { ...basePerson, birthDate: "1990-01-01T00:00:00.000Z" },
  new Date("2026-06-07T00:00:00.000Z"),
);
assert.equal(notYet.eligibility, "not_yet");
assert.equal(notYet.light, "gray");
