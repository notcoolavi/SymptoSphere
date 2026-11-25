import { test } from "node:test";
import assert from "node:assert/strict";
import { extractSymptoms } from "../lib/nlp";

test("extracts multiple symptoms from natural text", () => {
  const r = extractSymptoms("My head is pounding, I keep throwing up and I feel really tired");
  for (const s of ["headache", "vomiting", "fatigue"]) assert.ok(r.present.includes(s), s);
});
test("negation goes to absent", () => {
  const r = extractSymptoms("I have a cough but no fever and I'm not dizzy");
  assert.ok(r.present.includes("cough"));
  assert.ok(r.absent.includes("high_fever"));
  assert.ok(r.absent.includes("dizziness"));
  assert.ok(!r.present.includes("high_fever"));
});
test("longer phrase beats shorter one", () => {
  const r = extractSymptoms("I have a severe headache");
  assert.ok(r.present.includes("severe_headache"));
  assert.ok(!r.present.includes("headache"));
});
test("plural and casual phrasing", () => {
  const r = extractSymptoms("loose motions and stomach cramps since yesterday");
  assert.ok(r.present.includes("diarrhea") && r.present.includes("stomach_cramps"));
});
test("greeting yields nothing", () => assert.deepEqual(extractSymptoms("hello there").present, []));
import { LEXICON_IDS } from "../lib/nlp";
import { isScorable } from "../lib/diseaseData";
test("every lexicon id is a real symptom in the database", () => {
  const bad = LEXICON_IDS.filter(id => !isScorable(id));
  assert.deepEqual(bad, []);
});
