// Text normalisation shared by every other module.
// Works on Hindi in Devanagari, Hindi in Latin letters (romanised) and English.

const NUKTA = /़/g; // the dot under ड़, ज़ etc. Spellings vary, so we drop it.
const CHANDRABINDU = /ँ/g; // ँ  -> ं  (हाँ and हां are the same word)

/** Lower-case, unify Devanagari spellings, split ₹ and digits out, drop punctuation. */
export function normalizeText(input) {
  let s = String(input ?? '').normalize('NFC');
  s = s.normalize('NFD').replace(NUKTA, '').normalize('NFC');
  s = s.replace(CHANDRABINDU, 'ं');
  s = s.toLowerCase();
  s = s.replace(/(\d),(?=\d)/g, '$1'); // 3,450 -> 3450
  s = s.replace(/₹/g, ' ₹ ');
  s = s.replace(/(\d)(st|nd|rd|th)\b/g, '$1 th'); // 5th -> "5 th" (keeps the ordinal cue)
  s = s.replace(/(\d)([a-zऀ-ॿ])/g, '$1 $2'); // 3450rs -> 3450 rs
  s = s.replace(/([a-zऀ-ॿ])(\d)/g, '$1 $2');
  s = s.replace(/[^\p{L}\p{M}\p{N}₹'\s]/gu, ' ');
  s = s.replace(/'/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

export function tokenize(input) {
  const s = normalizeText(input);
  return s ? s.split(' ') : [];
}
