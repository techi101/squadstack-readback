import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, tokenize } from '../src/core/normalize.js';
import { extractNumbers } from '../src/core/numbers.js';
import { extractSlots } from '../src/core/slots.js';
import { alignWords, wordErrors } from '../src/core/align.js';
import { diffTurn, analyseCalls } from '../src/core/diff.js';
import { scorePolicy, catches } from '../src/core/policy.js';
import { parseInput } from '../src/core/parse.js';
import { SAMPLE_CALLS } from '../src/data/sample.js';

const nums = (s) => extractNumbers(tokenize(s)).map((n) => n.value);
const roles = (s) => extractNumbers(tokenize(s)).map((n) => n.role);

test('normalise: nukta, chandrabindu, commas, ₹', () => {
  assert.equal(normalizeText('हाँ'), normalizeText('हां'));
  assert.equal(normalizeText('हज़ार'), normalizeText('हजार'));
  assert.equal(normalizeText('₹3,450!'), '₹ 3450');
  assert.equal(normalizeText('5th'), '5 th');
});

test('numbers: Devanagari compounds', () => {
  assert.deepEqual(nums('छह हजार नौ सौ'), [6900]);
  assert.deepEqual(nums('तीन हजार चार सौ पचास रुपये'), [3450]);
  assert.deepEqual(nums('छब्बीस तारीख'), [26]);
  assert.deepEqual(nums('छबीस'), [26]); // spelling used in SquadStack's public post
  assert.deepEqual(nums('निन्यानवे'), [99]);
});

test('numbers: romanised and English', () => {
  assert.deepEqual(nums('chhe hazaar nau sau'), [6900]);
  assert.deepEqual(nums('ek lakh pachaas hazaar'), [150000]);
  assert.deepEqual(nums('twenty five thousand'), [25000]);
  assert.deepEqual(nums('Rs 3,450 by 5th'), [3450, 5]);
});

test('numbers: fractions साढ़े / सवा / पौने / डेढ़ / ढाई', () => {
  assert.deepEqual(nums('साढ़े तीन हजार'), [3500]);
  assert.deepEqual(nums('sawa do lakh'), [225000]);
  assert.deepEqual(nums('पौने चार सौ'), [375]);
  assert.deepEqual(nums('डेढ़ लाख'), [150000]);
  assert.deepEqual(nums('dhai hazaar'), [2500]);
});

test('numbers: ambiguous words need a number context', () => {
  assert.deepEqual(nums('haan de do'), []);
  assert.deepEqual(nums('दे दो भाई'), []);
  assert.deepEqual(nums('so I will pay'), []);
  assert.deepEqual(nums('do hazaar'), [2000]);
  assert.deepEqual(nums('teen chaar din'), [3, 4]);
});

test('numbers: roles', () => {
  assert.deepEqual(roles('EMI bees tareekh ko'), ['date']);
  assert.deepEqual(roles('paanch sau rupaye'), ['amount']);
  assert.deepEqual(roles('चार लोग'), ['number']);
});

test('slots: polarity is the first yes/no word; "ना" tag is not a no', () => {
  assert.equal(extractSlots('nahi abhi salary nahi aayi').polarity, 'no');
  assert.equal(extractSlots('haan abhi salary nahi aayi').polarity, 'yes');
  assert.equal(extractSlots('कर दूंगा है ना').polarity, null);
  assert.equal(extractSlots('ना अभी नहीं').polarity, 'no');
});

test('slots: commitment and escalation', () => {
  assert.equal(extractSlots('haan kal bhar dunga').commitment, 'promise to pay');
  assert.equal(extractSlots('nahi karunga payment').commitment, 'refuses to pay');
  assert.equal(extractSlots('मैंने तो कल ही भर दी थी').commitment, 'already paid');
  assert.deepEqual(extractSlots('मुझे मैनेजर से बात करनी है').escalation, ['asks for a human']);
  assert.deepEqual(extractSlots('call mat karo').escalation, ['asks to stop calls']);
});

test('align: counts substitutions, deletions, insertions', () => {
  const ops = alignWords(['a', 'b', 'c'], ['a', 'x', 'c', 'd']);
  assert.equal(wordErrors(ops), 2);
  assert.deepEqual(ops.map((o) => o.op), ['=', 'S', '=', 'I']);
  assert.equal(wordErrors(alignWords([], [])), 0);
});

test('diff: wrong date, flipped no, lost promise, missed handoff', () => {
  assert.deepEqual(diffTurn('EMI bees tareekh ko kar dunga', 'EMI tees tareekh ko kar dunga').errors.map((e) => [e.category, e.kind, e.said, e.heard]),
    [['number', 'changed', '20', '30']]);
  assert.equal(diffTurn('nahi nahi subah mat aana', 'haan haan subah mat aana').errors[0].kind, 'no heard as yes');
  assert.equal(diffTurn('नहीं मैंने ये order नहीं किया', 'मैंने ये order किया').errors[0].kind, 'no lost');
  assert.equal(diffTurn('सोमवार तक भर दूंगा', 'सोमवार तक भर दो').errors[0].kind, 'lost');
  assert.equal(diffTurn('मुझे किसी इंसान से बात करनी है', 'मुझे किसी इन सान से बात करनी है').errors[0].category, 'escalation');
  assert.equal(diffTurn('हां ठीक है', 'हां ठीक है').errors.length, 0);
  assert.equal(diffTurn('yeah science', 'yeah thanks').errors.length, 0); // content error, not a critical slot
});

test('policy: a dropped value is never caught by a slot readback', () => {
  const [call] = analyseCalls([{ id: 'x', campaign: 'c', turns: [{ ref: 'तीन ply', hyp: 'free ply' }] }]);
  const t = call.turns[0];
  assert.equal(t.errors[0].kind, 'dropped');
  assert.equal(catches('numbers', t, t.errors[0]), false);
  assert.equal(catches('all', t, t.errors[0]), true);
});

test('policy: escalation misses are never "caught" by readback', () => {
  const [call] = analyseCalls([{ id: 'x', campaign: 'c', turns: [{ ref: 'मैनेजर से बात कराओ', hyp: 'मैं नेचर से बात कराओ' }] }]);
  assert.equal(scorePolicy('all', [call]).fixable, 0);
});

test('policy: ordering on the sample is monotone and costs grow', () => {
  const calls = analyseCalls(SAMPLE_CALLS);
  const s = ['off', 'numbers', 'critical', 'all'].map((p) => scorePolicy(p, calls, 3));
  for (let i = 1; i < s.length; i += 1) {
    assert.ok(s[i].caught >= s[i - 1].caught);
    assert.ok(s[i].readbacks >= s[i - 1].readbacks);
  }
  assert.equal(s[0].caught, 0);
  assert.equal(s[3].caught, s[3].fixable);
  assert.equal(s[1].extraSeconds, s[1].readbacks * 3);
});

test('parse: text, JSON and benchmark-shaped rows', () => {
  const t = parseInput('# c1 | BFSI\nbees tareekh ||| tees tareekh\nhaan\thaan');
  assert.equal(t.length, 1); assert.equal(t[0].campaign, 'BFSI'); assert.equal(t[0].turns.length, 2);
  const j = parseInput(JSON.stringify([{ id: 'a', turns: [{ ref: 'x', hyp: 'y' }] }]));
  assert.equal(j[0].turns[0].hyp, 'y');
  const b = parseInput(JSON.stringify([{ sample_id: 7, business_domain: 'BFSI', normalised_reference: 'एक\nदो', arth_v2_normalised: 'एक\nदो', nova_3_normalised: 'एक\n' }]), 'nova_3');
  assert.equal(b[0].id, 'sample 7'); assert.equal(b[0].turns[1].hyp, '');
  assert.throws(() => parseInput('just one column'));
  assert.deepEqual(parseInput('   '), []);
});
