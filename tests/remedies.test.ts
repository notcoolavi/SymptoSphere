import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeRemedies, isHomeOnly } from "../lib/remedies";
import { DISEASE_DB } from "../lib/diseaseData";

test("drops medicine, vaccine and doctor-referral items", () => {
  const out = sanitizeRemedies(["Rest", "Paracetamol", "Annual flu vaccine", "Antihistamines", "Dermatologist consult", "Drink fluids"]);
  assert.deepEqual(out, ["Rest", "Drink fluids"]);
});
test("ORS is replaced with a home fluid instead of removed", () => {
  const out = sanitizeRemedies(["ORS fluids"]);
  assert.equal(out.length, 1);
  assert.ok(/coconut water|broth/i.test(out[0]));
});
test("no remaining remedy in the database names a medicine", () => {
  const bad: string[] = [];
  for (const [name, d] of Object.entries(DISEASE_DB)) for (const r of d.remedies) if (!isHomeOnly(r)) bad.push(`${name}: ${r}`);
  assert.deepEqual(bad, []);
});
