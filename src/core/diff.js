// Compare the slots in what the caller said (reference) with what the agent heard (ASR hypothesis).
import { extractSlots } from './slots.js';
import { alignWords, wordErrors } from './align.js';

export const CATEGORIES = ['number', 'negation', 'commitment', 'escalation'];

function fmt(n) {
  return Number.isInteger(n) ? n.toLocaleString('en-IN') : String(n);
}

function numberErrors(refNums, hypNums) {
  const errs = [];
  const hypLeft = [...hypNums];
  const refLeft = [];
  for (const r of refNums) {
    const k = hypLeft.findIndex((h) => h.value === r.value);
    if (k >= 0) hypLeft.splice(k, 1); else refLeft.push(r);
  }
  refLeft.forEach((r) => {
    const h = hypLeft.shift();
    if (h) errs.push({ category: 'number', kind: 'changed', role: r.role, said: fmt(r.value), heard: fmt(h.value), saidText: r.text, heardText: h.text });
    else errs.push({ category: 'number', kind: 'dropped', role: r.role, said: fmt(r.value), heard: null, saidText: r.text, heardText: null });
  });
  hypLeft.forEach((h) => errs.push({ category: 'number', kind: 'inserted', role: h.role, said: null, heard: fmt(h.value), saidText: null, heardText: h.text }));
  return errs;
}

/** All slot errors for one turn, plus its word alignment. */
export function diffTurn(refText, hypText) {
  const ref = extractSlots(refText);
  const hyp = extractSlots(hypText);
  const errors = numberErrors(ref.numbers, hyp.numbers);
  const flipped = ref.polarity === 'no' && hyp.polarity === 'yes';
  if (flipped || ref.negations !== hyp.negations) {
    let kind = 'no heard as yes';
    if (!flipped) kind = hyp.negations < ref.negations ? 'no lost' : 'no inserted';
    errors.push({ category: 'negation', kind, said: ref.polarity ?? 'none', heard: hyp.polarity ?? 'none', saidNegations: ref.negations, heardNegations: hyp.negations });
  }
  if (ref.commitment !== hyp.commitment) {
    errors.push({ category: 'commitment', kind: hyp.commitment ? (ref.commitment ? 'changed' : 'invented') : 'lost', said: ref.commitment ?? 'none', heard: hyp.commitment ?? 'none' });
  }
  ref.escalation.filter((s) => !hyp.escalation.includes(s)).forEach((s) => errors.push({ category: 'escalation', kind: 'missed', said: s, heard: 'not detected' }));
  hyp.escalation.filter((s) => !ref.escalation.includes(s)).forEach((s) => errors.push({ category: 'escalation', kind: 'false trigger', said: 'none', heard: s }));
  const ops = alignWords(ref.tokens, hyp.tokens);
  return { ref, hyp, errors, ops, wordErrors: wordErrors(ops), refWords: ref.tokens.length };
}

/** Analyse a list of calls: [{id, campaign, turns:[{ref, hyp}]}]. */
export function analyseCalls(calls) {
  return calls.map((c) => ({
    ...c,
    turns: c.turns.map((t, idx) => ({ index: idx, refText: t.ref, hypText: t.hyp, ...diffTurn(t.ref, t.hyp) })),
  }));
}
