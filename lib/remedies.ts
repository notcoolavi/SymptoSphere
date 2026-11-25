/**
 * Home-care only. Anything that names a medicine, drug class, vaccine, dose,
 * or prescription treatment is removed. Doctor/hospital referral is handled
 * by the nearby-care feature, not by remedy text.
 */
const BLOCKED = new RegExp(
  [
    "\\b(mg|mcg|ml|dose|dosage|tablet|tablets|capsule|capsules|pill|pills|syrup|injection|injections)\\b",
    "\\b(antibiotic\\w*|antiviral\\w*|antifungal\\w*|antihistamine\\w*|antacid\\w*|steroid\\w*|corticosteroid\\w*)\\b",
    "\\b(paracetamol|acetaminophen|ibuprofen|aspirin|naproxen|loratadine|cetirizine|omeprazole|hydrocortisone|epinephrine|epipen|insulin|inhaler|decongestant|calamine|artificial tears|eye drops|ear drops|cream|creams|ointment|drops)\\b",
    "\\b(vaccine\\w*|medication\\w*|medicine\\w*|medicat\\w*|prescri\\w*|therapy|therapies|treatment course|course)\\b",
    "\\b(dermatologist|doctor|physician|specialist|consult\\w*|hospital|emergency|er visit)\\b",
    "\\b(oral rehydration salts|ors)\\b",
  ].join("|"),
  "i"
);

// Medicine-free replacements for items that were otherwise useful at home.
const REPLACE: Record<string, string> = {
  "ORS fluids": "Sip water, coconut water, rice water or lightly salted broth often",
  "Oral rehydration salts": "Sip water, coconut water or lightly salted broth in small amounts",
  "Cool compresses": "Cool, damp cloth on the skin for comfort",
  "Oatmeal baths": "Lukewarm oatmeal bath (plain, uncooked oats in water)",
  "Warm compresses": "Warm, damp cloth on the eyes for a few minutes",
  "Moisturize regularly": "Moisturize regularly with a plain, fragrance-free lotion or coconut oil",
};

export function sanitizeRemedies(items: string[]): string[] {
  const out: string[] = [];
  for (const raw of items) {
    const item = REPLACE[raw] ?? raw;
    if (BLOCKED.test(item)) continue;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

export const isHomeOnly = (text: string) => !BLOCKED.test(text);
