import { test } from "node:test";
import assert from "node:assert/strict";
import { predictDiseases, detectEmergencies, DISEASE_DB } from "../lib/diseaseData";

test("empty input returns nothing", () => assert.equal(predictDiseases([]).length, 0));
test("returns at most 3 sorted results", () => {
  const r = predictDiseases(["high_fever", "headache", "body_ache"]);
  assert.ok(r.length >= 1 && r.length <= 3);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});
test("full symptom profile ranks its own disease top-3", () => {
  const miss: string[] = [];
  for (const [name, d] of Object.entries(DISEASE_DB)) {
    const top = predictDiseases(d.symptoms.slice(0, 6)).map(x => x.name);
    if (!top.includes(name)) miss.push(name);
  }
  assert.deepEqual(miss, []);
});
test("one vague symptom is never high confidence", () => {
  assert.notEqual(predictDiseases(["fatigue"])[0].confidence, "high");
});
test("red flags trigger", () => {
  assert.equal(detectEmergencies(["chest_pain", "left_arm_pain"]).length > 0, true);
  assert.equal(detectEmergencies(["sore_throat"]).length, 0);
});
