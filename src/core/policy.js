// Readback ("confirm back") policies. The agent can only decide from what it HEARD (the hypothesis),
// never from what the caller really said. A readback catches an error only if the agent reads back
// the wrong value it heard; a value the recogniser dropped is never read back by a slot policy.

export const POLICIES = [
  { id: 'off', name: 'No readback', short: 'Off', desc: 'The agent acts on every value it hears.' },
  { id: 'numbers', name: 'Read back numbers', short: 'Numbers', desc: 'Repeat any amount, date or count the agent heard.' },
  { id: 'critical', name: 'Read back critical slots', short: 'Critical', desc: 'Numbers, plus any yes/no answer and any payment promise the agent heard.' },
  { id: 'all', name: 'Summarise every turn', short: 'Every turn', desc: 'Repeat the agent\'s understanding after every caller turn.' },
];

const READBACK_CATEGORIES = new Set(['number', 'negation', 'commitment']);

export function triggers(policyId, turn) {
  const h = turn.hyp;
  if (policyId === 'off') return false;
  if (policyId === 'all') return turn.hyp.tokens.length > 0 || turn.ref.tokens.length > 0;
  if (policyId === 'numbers') return h.numbers.length > 0;
  if (policyId === 'critical') return h.numbers.length > 0 || h.polarity !== null || h.commitment !== null;
  throw new Error(`unknown policy ${policyId}`);
}

/** Would this policy expose this error to the caller (so they can correct it)? */
export function catches(policyId, turn, err) {
  if (!READBACK_CATEGORIES.has(err.category)) return false; // escalation needs a guard, not a readback
  if (!triggers(policyId, turn)) return false;
  if (policyId === 'all') return true;
  const heardSomething = err.heard !== null && err.heard !== 'none';
  if (err.category === 'number') return heardSomething; // a dropped number is never read back
  if (policyId === 'numbers') return false;
  return heardSomething; // critical: negation heard as yes / commitment invented are read back
}

/** Score one policy over analysed calls. */
export function scorePolicy(policyId, calls, secondsPerReadback = 3) {
  let fixable = 0; let caught = 0; let readbacks = 0; let wasted = 0;
  for (const c of calls) {
    for (const t of c.turns) {
      const trig = triggers(policyId, t);
      const errs = t.errors.filter((e) => READBACK_CATEGORIES.has(e.category));
      fixable += errs.length;
      const got = errs.filter((e) => catches(policyId, t, e)).length;
      caught += got;
      if (trig) { readbacks += 1; if (got === 0) wasted += 1; }
    }
  }
  return {
    policyId, fixable, caught, missed: fixable - caught, readbacks, wasted,
    extraSeconds: readbacks * secondsPerReadback,
  };
}

export function scoreAll(calls, secondsPerReadback = 3) {
  return POLICIES.map((p) => ({ ...p, ...scorePolicy(p.id, calls, secondsPerReadback) }));
}
