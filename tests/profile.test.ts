import { test } from "node:test";
import assert from "node:assert/strict";
import { predictDiseases, detectEmergencies } from "../lib/diseaseData";
import { extractSymptoms } from "../lib/nlp";

test("males are never shown PCOS or endometriosis", () => {
  const r = predictDiseases(["irregular_periods", "pelvic_pain", "weight_gain", "acne"], { sex: "male" });
  assert.ok(!r.some(x => /PCOS|Endometriosis/.test(x.name)));
});
test("age shifts the ranking for ambiguous input", () => {
  const sy = ["memory_loss", "confusion", "fatigue"];
  const senior = predictDiseases(sy, { age: "senior" })[0].score;
  const child = predictDiseases(sy, { age: "child" })[0].score;
  assert.ok(senior >= child);
});
test("end to end: free text -> prediction + red flag", () => {
  const { present } = extractSymptoms("crushing chest pain, pain in my left arm and I'm sweating");
  assert.ok(detectEmergencies(present).length > 0);
  assert.ok(predictDiseases(present).length > 0);
});
test("end to end: classic flu description ranks flu-like illness first", () => {
  const { present } = extractSymptoms("high fever, body aches, chills, headache and a dry cough");
  const top = predictDiseases(present).map(r => r.name);
  assert.ok(top.some(n => /Influenza|COVID/.test(n)), top.join(", "));
});
