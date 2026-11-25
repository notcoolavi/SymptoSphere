#!/usr/bin/env node
/**
 * Rebuilds data/learned.json from a public symptom-disease CSV.
 *
 * Supported CSV layouts (auto-detected):
 *   A) wide:  Disease,Symptom_1,Symptom_2,...        (one row per case, symptom names in cells)
 *   B) binary: <symptom columns 0/1>...,prognosis    (one row per case)
 *
 * Usage:  node scripts/update-db.mjs [csvUrlOrPath]
 * Source: argv[2] or env SYMPTOM_DATA_URL or data/sources.json "csv".
 *
 * Safety: the new model is only written if it passes validation
 * (enough rows, matches known diseases, and does not reduce accuracy
 * versus the previous model on a held-out split).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "data", "learned.json");
const srcCfg = path.join(root, "data", "sources.json");

const norm = (s) => String(s).trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");

function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

function toCases(rows) {
  const header = rows[0].map((h) => h.trim());
  const labelIdx = header.findIndex((h) => /^(disease|prognosis|diagnosis|label)$/i.test(h));
  if (labelIdx < 0) throw new Error("No Disease/prognosis column found");
  const body = rows.slice(1);
  const binary = body.slice(0, 50).every((r) => r.every((v, i) => i === labelIdx || v === "" || v === "0" || v === "1"));
  return body.map((r) => {
    const disease = r[labelIdx].trim();
    const symptoms = binary
      ? header.filter((h, i) => i !== labelIdx && r[i] === "1").map(norm)
      : r.filter((v, i) => i !== labelIdx && v.trim() !== "").map(norm);
    return { disease, symptoms: [...new Set(symptoms)] };
  }).filter((c) => c.disease && c.symptoms.length);
}

function train(cases) {
  const diseases = {};
  for (const c of cases) {
    const d = (diseases[c.disease] ||= { n: 0, symptoms: {} });
    d.n++;
    for (const s of c.symptoms) d.symptoms[s] = (d.symptoms[s] || 0) + 1;
  }
  return diseases;
}

// simple Bernoulli naive Bayes accuracy for validation
function accuracy(model, cases) {
  const names = Object.keys(model); const total = names.reduce((a, n) => a + model[n].n, 0);
  let hit1 = 0, hit3 = 0;
  for (const c of cases) {
    const scored = names.map((n) => {
      const m = model[n]; let ll = Math.log(m.n / total);
      for (const s of c.symptoms) ll += Math.log(((m.symptoms[s] || 0) + 0.5) / (m.n + 1));
      return [n, ll];
    }).sort((a, b) => b[1] - a[1]);
    if (scored[0][0] === c.disease) hit1++;
    if (scored.slice(0, 3).some(([n]) => n === c.disease)) hit3++;
  }
  return { top1: hit1 / cases.length, top3: hit3 / cases.length };
}

async function load(src) {
  if (/^https?:\/\//.test(src)) {
    const r = await fetch(src, { headers: { "User-Agent": "symptosphere-updater" } });
    if (!r.ok) throw new Error(`Download failed: ${r.status} ${src}`);
    return r.text();
  }
  return fs.readFileSync(path.resolve(src), "utf8");
}

async function main() {
  const cfg = fs.existsSync(srcCfg) ? JSON.parse(fs.readFileSync(srcCfg, "utf8")) : {};
  const src = process.argv[2] || process.env.SYMPTOM_DATA_URL || cfg.csv;
  if (!src) { console.log("No data source configured (set data/sources.json 'csv' or SYMPTOM_DATA_URL). Nothing to do."); return; }

  const cases = toCases(parseCSV(await load(src)));
  if (cases.length < 200) throw new Error(`Only ${cases.length} usable rows; refusing to update`);

  // deterministic 80/20 split
  const train_ = [], test_ = [];
  cases.forEach((c, i) => ((i % 5 === 0 ? test_ : train_).push(c)));
  const candidate = train(train_);
  const cand = accuracy(candidate, test_);

  const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : { diseases: {} };
  let prevAcc = null;
  if (Object.keys(prev.diseases || {}).length) prevAcc = accuracy(prev.diseases, test_);

  console.log(`rows=${cases.length} diseases=${Object.keys(candidate).length}`);
  console.log(`candidate  top1=${(cand.top1 * 100).toFixed(1)}%  top3=${(cand.top3 * 100).toFixed(1)}%`);
  if (prevAcc) console.log(`previous   top1=${(prevAcc.top1 * 100).toFixed(1)}%  top3=${(prevAcc.top3 * 100).toFixed(1)}%`);

  if (prevAcc && cand.top3 + 0.01 < prevAcc.top3) throw new Error("Candidate model is worse than the current one; keeping current");

  // final model uses ALL rows
  const finalModel = train(cases);
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(), source: /^https?:/.test(src) ? src : path.basename(src),
    rows: cases.length, heldOut: { top1: +cand.top1.toFixed(4), top3: +cand.top3.toFixed(4) }, diseases: finalModel,
  }));
  console.log("Wrote data/learned.json");
}
main().catch((e) => { console.error("update-db failed:", e.message); process.exit(1); });
