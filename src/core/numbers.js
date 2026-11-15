// Hinglish number reader: "छह हजार नौ सौ", "saadhe teen hazaar", "Rs 3,450", "twenty five".
import { normalizeText } from './normalize.js';

const HI_DEV = [
  null, 'एक', 'दो', 'तीन', 'चार', 'पांच|पाच', 'छह|छः|छे|छै', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह|पन्द्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस|छबीस', 'सत्ताईस', 'अट्ठाईस|अठाईस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी|उनासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
];

// Romanised Hindi. Only spellings that are not also common words.
// "saath" (60) is left out on purpose: it usually means "with".
const HI_ROMAN = {
  1: 'ek', 2: 'do', 3: 'teen|tin', 4: 'char|chaar', 5: 'paanch|panch|paach', 6: 'chhe|chhah|chhaha|chhah',
  7: 'saat', 8: 'aath', 9: 'nau', 10: 'das', 11: 'gyarah|gyara|gyaarah', 12: 'barah|baarah|bara',
  13: 'terah|tera', 14: 'chaudah|chauda', 15: 'pandrah|pandra|pandarah', 16: 'solah|sola', 17: 'satrah|satra',
  18: 'atharah|athara|attharah', 19: 'unnis|unees|unnees', 20: 'bees|bis', 21: 'ikkis|ikkees', 22: 'baais|bais|baees',
  23: 'teis|teees', 24: 'chaubis|chobis|chaubees', 25: 'pachchis|pachis|pachees|pachhis', 26: 'chhabbis|chabbis|chhabis',
  27: 'sattais|sattaees', 28: 'atthais|athais|atthaees', 29: 'untis|unatis', 30: 'tees|tis', 35: 'paintis|pentis',
  36: 'chhattis|chattis', 40: 'chalis|chaalis', 45: 'paintalis', 50: 'pachas|pachaas', 55: 'pachpan',
  70: 'sattar', 75: 'pachhattar|pachattar', 80: 'assi', 90: 'nabbe',
};

const EN_UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

const HUNDRED = ['सौ', 'sau', 'so', 'hundred'];
const BIG = { 'हजार': 1e3, hazaar: 1e3, hazar: 1e3, hajar: 1e3, hajaar: 1e3, thousand: 1e3, k: 1e3,
  'लाख': 1e5, lakh: 1e5, lac: 1e5, lakhs: 1e5, 'करोड़': 1e7, crore: 1e7, karod: 1e7, crores: 1e7 };
// Fractions said before a number: साढ़े तीन = 3.5, सवा दो = 2.25, पौने चार = 3.75
const PRE_MOD = { 'साढ़े': 0.5, saadhe: 0.5, sadhe: 0.5, saade: 0.5, 'सवा': 0.25, sawa: 0.25, sava: 0.25,
  'पौने': -0.25, paune: -0.25, pone: -0.25 };
const FRACTION_UNITS = { 'डेढ़': 1.5, dedh: 1.5, derh: 1.5, 'ढाई': 2.5, dhai: 2.5, dhaai: 2.5, adhai: 2.5 };

// Words that are numbers only when another number word, currency or date cue is next to them.
// "दे दो" (give), "do the payment", "so" are not numbers.
const AMBIGUOUS = new Set(['do', 'दो', 'tin', 'bis', 'tis', 'so', 'saat', 'das', 'k', 'ek', 'एक']);

export const CURRENCY = new Set(['₹', 'rs', 'rupees', 'rupee', 'rupaye', 'rupaiye', 'rupay', 'inr',
  'रुपये', 'रुपए', 'रूपए', 'रूपये', 'रुपया', 'रुपैया']);
export const DATE_CUES = new Set(['tareekh', 'tarikh', 'tarik', 'tareek', 'तारीख', 'तारीक', 'date', 'th', 'को_date']);

const key = (w) => normalizeText(w);
const UNIT = new Map();
HI_DEV.forEach((alts, n) => { if (alts) alts.split('|').forEach((w) => UNIT.set(key(w), n)); });
Object.entries(HI_ROMAN).forEach(([n, alts]) => alts.split('|').forEach((w) => UNIT.set(key(w), Number(n))));
EN_UNITS.forEach((w, n) => UNIT.set(w, n));
const TENS = new Map(Object.entries(EN_TENS));
const HUND = new Set(HUNDRED.map(key));
const BIGM = new Map(Object.entries(BIG).map(([w, v]) => [key(w), v]));
const PRE = new Map(Object.entries(PRE_MOD).map(([w, v]) => [key(w), v]));
const FRAC = new Map(Object.entries(FRACTION_UNITS).map(([w, v]) => [key(w), v]));
const AMB = new Set([...AMBIGUOUS].map(key));
const CUR = new Set([...CURRENCY].map(key));
const DATE = new Set([...DATE_CUES].map(key));

function kindOf(tok) {
  if (/^\d+(\.\d+)?$/.test(tok)) return 'digit';
  if (UNIT.has(tok) || TENS.has(tok) || FRAC.has(tok)) return 'unit';
  if (HUND.has(tok)) return 'hundred';
  if (BIGM.has(tok)) return 'big';
  if (PRE.has(tok)) return 'pre';
  return null;
}

function unitValue(tok) {
  if (/^\d/.test(tok)) return Number(tok);
  if (UNIT.has(tok)) return UNIT.get(tok);
  if (TENS.has(tok)) return TENS.get(tok);
  return FRAC.get(tok);
}

function isNumberish(tok) { return !!kindOf(tok) || CUR.has(tok) || DATE.has(tok); }

/**
 * Find every number in a token list.
 * Returns [{value, start, end, text, role}] where role is 'amount' | 'date' | 'number'.
 */
export function extractNumbers(tokens) {
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const k = kindOf(tokens[i]);
    if (!k) { i += 1; continue; }
    if (AMB.has(tokens[i]) || (k === 'hundred' && tokens[i] === 'so')) {
      const prev = tokens[i - 1]; const next = tokens[i + 1];
      const ctx = (prev && isNumberish(prev) && !AMB.has(prev)) || (next && isNumberish(next) && !AMB.has(next));
      if (!ctx) { i += 1; continue; }
    }
    if (k === 'big' && tokens[i] === 'k') { i += 1; continue; } // a bare "k" is not a number
    // Read one number phrase.
    let total = 0; let cur = null; let pending = 0; let lastKind = null; const start = i;
    let j = i;
    for (; j < tokens.length; j += 1) {
      const t = tokens[j]; const kk = kindOf(t);
      if (!kk) break;
      if (kk === 'pre') { if (lastKind === 'unit' || lastKind === 'digit') break; pending = PRE.get(t); lastKind = kk; continue; }
      if (kk === 'unit' || kk === 'digit') {
        let v = unitValue(t);
        if (cur !== null && (lastKind === 'unit' || lastKind === 'digit')) {
          // "twenty five" = 25; anything else ("teen chaar din") is two separate numbers.
          if (cur >= 20 && cur % 10 === 0 && cur < 100 && v < 10 && TENS.has(tokens[j - 1])) { cur += v; lastKind = kk; continue; }
          break;
        }
        if (pending) { v += pending; pending = 0; }
        cur = (cur ?? 0) + v; lastKind = kk; continue;
      }
      if (kk === 'hundred') { if (lastKind === 'hundred') break; cur = (cur ?? 1) * 100; lastKind = kk; continue; }
      if (kk === 'big') {
        if (t === 'k' && lastKind !== 'digit') break;
        total += (cur ?? 1) * BIGM.get(t); cur = null; lastKind = kk; continue;
      }
    }
    if (lastKind === 'pre' && j === start + 1) { i += 1; continue; }
    const value = Math.round((total + (cur ?? 0)) * 100) / 100;
    const before = tokens[start - 1]; const after = tokens[j];
    const phrase = tokens.slice(start, j);
    let role = 'number';
    if ((after && DATE.has(after)) || (after === 'को' && /तारीख|date/.test(tokens.slice(j, j + 3).join(' ')))) role = 'date';
    else if ((before && CUR.has(before)) || (after && CUR.has(after)) || phrase.some((t) => BIGM.has(t))) role = 'amount';
    out.push({ value, start, end: j, text: phrase.join(' '), role });
    i = j > i ? j : i + 1;
  }
  return out;
}
