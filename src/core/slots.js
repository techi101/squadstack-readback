// Critical slots in one caller turn: numbers, yes/no polarity, payment commitment, escalation signals.
import { tokenize } from './normalize.js';
import { extractNumbers } from './numbers.js';

const NEG = new Set(['nahi', 'nahin', 'nai', 'nhi', 'mat', 'no', 'not', 'nope', 'never', 'dont', 'नहीं', 'नही', 'मत', 'न']);
// "na" / "ना" is also a tag ("है ना", "kar dunga na"), so it counts only as the first word of a turn.
const NEG_FIRST_ONLY = new Set(['na', 'ना']);
const AFF = new Set(['haan', 'han', 'haa', 'ha', 'ji', 'hanji', 'haanji', 'yes', 'yeah', 'yup', 'ok', 'okay',
  'theek', 'thik', 'sure', 'हां', 'हा', 'जी', 'हांजी', 'ठीक', 'ओके']);

// Matched on the normalised turn text (nukta removed, ँ -> ं).
const PAID = /\b(kar|de|bhar|jama|pay)\s?(diya|di|diye|kiya)\b|already paid|paid kar|(कर|दे|भर|जमा)\s?(दिया|दी|दिए)|(पे|पेमेंट)\s?कर\s?दिया/;
const FUTURE = /\b(kar|de|bhar|jama|pay)\s?(dunga|dungi|doonga|doongi|denge|dunge|dega|degi|karunga|karungi|karenge)\b|\b(karunga|karungi|karenge)\b|will pay|(कर|दे|भर|जमा)\s?(दूंगा|दूंगी|दुंगा|दुंगी|देंगे|देगा|देगी)|(करूंगा|करूंगी|करेंगे|करुंगा|करुंगी)/;

const HUMAN = /\b(insaan|insan|human|real person|manager|supervisor|senior|kisi aur se baat|agent se baat)\b|इंसान|मैनेजर|सुपरवाइजर|सीनियर|किसी और से बात/;
const STOP = /(call|phone|fon)\s?mat\s?(karo|kariye|karna)|\b(dont|do not|stop)\s?call|band karo|कॉल मत|फोन मत|फ़ोन मत|परेशान मत/;
const DISTRESS = /mar jaunga|mar jaungi|marne ka|suicide|jaan de|khatam kar lunga|guzar gaye|guzar gayi|expire ho gaye|death ho gayi|मर जाऊंगा|मर जाऊंगी|जान दे|आत्महत्या|गुजर गए|गुजर गई|देहांत|खत्म कर लूंगा/;

const isNeg = (t, i) => NEG.has(t) || (i === 0 && NEG_FIRST_ONLY.has(t));

/** The caller's answer: the first yes/no word in the turn ("nahi ... " -> 'no'), or null. */
export function polarityOf(tokens) {
  for (let i = 0; i < tokens.length; i += 1) {
    if (isNeg(tokens[i], i)) return 'no';
    if (AFF.has(tokens[i])) return 'yes';
  }
  return null;
}

export function negationCount(tokens) {
  return tokens.filter((t, i) => isNeg(t, i)).length;
}

export function commitmentOf(text, negated) {
  if (PAID.test(text)) return 'already paid';
  if (FUTURE.test(text)) return negated ? 'refuses to pay' : 'promise to pay';
  return null;
}

export function escalationOf(text) {
  const s = [];
  if (HUMAN.test(text)) s.push('asks for a human');
  if (STOP.test(text)) s.push('asks to stop calls');
  if (DISTRESS.test(text)) s.push('distress or bereavement');
  return s;
}

/** All critical slots for one turn. */
export function extractSlots(turnText) {
  const tokens = tokenize(turnText);
  const text = tokens.join(' ');
  const negations = negationCount(tokens);
  return {
    tokens,
    numbers: extractNumbers(tokens),
    polarity: polarityOf(tokens),
    negations,
    commitment: commitmentOf(text, negations > 0),
    escalation: escalationOf(text),
  };
}
