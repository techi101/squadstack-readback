import { analyseCalls, CATEGORIES } from './core/diff.js';
import { POLICIES, scorePolicy, catches, triggers } from './core/policy.js';
import { parseInput, detectSystems } from './core/parse.js';
import { SAMPLE_CALLS, SAMPLE_LABEL } from './data/sample.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CAT_LABEL = { number: 'Number', negation: 'Negation', commitment: 'Payment promise', escalation: 'Handoff signal' };
const CAT_VAR = { number: '--c-number', negation: '--c-negation', commitment: '--c-commitment', escalation: '--c-escalation' };

const EXAMPLE = `# BF-9 | BFSI · EMI reminder
हां बोलिए ||| हां बोलिए
EMI bees tareekh ko kar dunga ||| EMI tees tareekh ko kar dunga
nahi abhi salary nahi aayi ||| haan abhi salary nahi aayi

# LG-7 | Logistics · COD confirmation
साढ़े बारह सौ cash दे दूंगा ||| बारह सौ cash दे दूंगा
मुझे किसी इंसान से बात करनी है ||| मुझे किसी इन सान से बात करनी है`;

const state = {
  src: 'sample',
  sample: analyseCalls(SAMPLE_CALLS),
  pasted: null,
  campaign: 'all',
  policy: 'numbers',
  secs: 3,
  cats: new Set(CATEGORIES),
};

const allCalls = () => (state.src === 'sample' ? state.sample : (state.pasted || []));
const calls = () => allCalls().filter((c) => state.campaign === 'all' || c.campaign === state.campaign);

function errorsOf(list) {
  const out = [];
  list.forEach((c) => c.turns.forEach((t) => t.errors.forEach((e) => out.push({ call: c, turn: t, err: e }))));
  return out;
}

function ordinal(n) {
  const v = n % 100; const suf = (v >= 11 && v <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${suf}`;
}

function pct(a, b) { return b ? `${((a / b) * 100).toFixed(1)}%` : '–'; }

function renderCampaigns() {
  const names = [...new Set(allCalls().map((c) => c.campaign))];
  if (state.campaign !== 'all' && !names.includes(state.campaign)) state.campaign = 'all';
  $('campaign').innerHTML = `<option value="all">All campaigns (${allCalls().length} calls)</option>`
    + names.map((n) => `<option value="${esc(n)}" ${n === state.campaign ? 'selected' : ''}>${esc(n)} (${allCalls().filter((c) => c.campaign === n).length})</option>`).join('');
}

function renderKpis() {
  const list = calls();
  const turns = list.flatMap((c) => c.turns);
  const words = turns.reduce((a, t) => a + t.refWords, 0);
  const werr = turns.reduce((a, t) => a + t.wordErrors, 0);
  const turnsWord = turns.filter((t) => t.wordErrors > 0).length;
  const errs = errorsOf(list);
  const turnsSlot = new Set(errs.map((e) => e.turn)).size;
  const s = scorePolicy(state.policy, list, state.secs);
  const pol = POLICIES.find((p) => p.id === state.policy);
  const guard = errs.filter((e) => e.err.category === 'escalation').length;
  $('kpis').innerHTML = `
    <div class="kpi"><div class="k-label">Scanned</div><div class="k-val">${list.length} <small>calls</small></div><div class="k-sub">${turns.length} caller turns</div></div>
    <div class="kpi"><div class="k-label">Word error rate</div><div class="k-val">${pct(werr, words)}</div><div class="k-sub">${turnsWord} turns have a word error</div></div>
    <div class="kpi"><div class="k-label">Slot errors</div><div class="k-val">${errs.length}</div><div class="k-sub">in ${turnsSlot} turns · ${guard} handoff signal${guard === 1 ? '' : 's'}</div></div>
    <div class="kpi accent"><div class="k-label">Caught · ${esc(pol.short)}</div><div class="k-val">${s.caught}<small> / ${s.fixable}</small></div><div class="k-sub">readback-fixable errors</div></div>
    <div class="kpi"><div class="k-label">Extra talk time</div><div class="k-val">${s.extraSeconds.toLocaleString('en-IN')}<small> s</small></div><div class="k-sub">${s.readbacks} readbacks · ${s.wasted} on turns heard right</div></div>`;
}

function renderPolicies() {
  const list = calls();
  $('policies').innerHTML = POLICIES.map((p) => {
    const s = scorePolicy(p.id, list, state.secs);
    const w = s.fixable ? Math.round((s.caught / s.fixable) * 100) : 0;
    return `<button class="pol" role="radio" aria-checked="${p.id === state.policy}" data-pol="${p.id}">
      <span class="pol-top"><span class="pol-name">${esc(p.name)}</span><span class="pol-score">${s.caught}/${s.fixable} caught</span></span>
      <span class="pol-desc">${esc(p.desc)}</span>
      <span class="bar" aria-hidden="true"><span style="width:${w}%"></span></span>
      <span class="pol-cost"><span>${s.readbacks} readbacks</span><span>+${s.extraSeconds.toLocaleString('en-IN')} s</span><span>${s.missed} missed</span></span>
    </button>`;
  }).join('');
}

function renderFilters(errs) {
  $('cat-filters').innerHTML = CATEGORIES.map((c) => {
    const n = errs.filter((e) => e.err.category === c).length;
    return `<button class="chip" aria-pressed="${state.cats.has(c)}" data-cat="${c}"><i class="sq" style="background:var(${CAT_VAR[c]})"></i>${CAT_LABEL[c]} <span class="n">${n}</span></button>`;
  }).join('');
}

function statusCell(turn, err) {
  if (err.category === 'escalation') return '<span class="status guard">Needs a guard</span>';
  return catches(state.policy, turn, err)
    ? '<span class="status ok"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Caught</span>'
    : '<span class="status miss">Acted on</span>';
}

function valueCell(e) {
  const said = e.said ?? '—'; const heard = e.heard ?? '—';
  if (e.category === 'number') return `<span class="val">${esc(said)}<span class="arrow">→</span>${esc(heard)}</span><span class="kind">${esc(e.role)}</span>`;
  if (e.category === 'negation') return `<span class="val">${esc(said)}<span class="arrow">→</span>${esc(heard)}</span><span class="kind">negation words ${e.saidNegations} → ${e.heardNegations}</span>`;
  return `<span class="val">${esc(said)}<span class="arrow">→</span>${esc(heard)}</span>`;
}

function renderErrors() {
  const list = calls();
  const all = errorsOf(list);
  renderFilters(all);
  const shown = all.filter((e) => state.cats.has(e.err.category));
  $('errors-sub').textContent = `${shown.length} of ${all.length} shown. Click a row to open the call.`;
  $('error-rows').innerHTML = shown.map(({ call, turn, err }) => `
    <tr data-call="${esc(call.id)}" data-turn="${turn.index}" tabindex="0">
      <td class="call-id">${esc(call.id)}<small>turn ${turn.index + 1}</small></td>
      <td><span class="badge b-${err.category}">${CAT_LABEL[err.category]}</span><span class="kind">${esc(err.kind)}</span></td>
      <td class="utt">${esc(turn.refText)}</td>
      <td class="utt">${esc(turn.hypText)}</td>
      <td>${valueCell(err)}</td>
      <td class="right">${statusCell(turn, err)}</td>
    </tr>`).join('');
  const empty = shown.length === 0;
  $('errors-empty').hidden = !empty;
  document.querySelector('.table-wrap').hidden = empty;
  $('empty-text').textContent = all.length && empty
    ? 'All slot types are filtered out. Turn a filter chip back on.'
    : 'Every number, yes/no, payment promise and handoff request was heard the same as it was said.';
}

function render() {
  const pasteMode = state.src === 'paste';
  const hasData = allCalls().length > 0;
  $('sample-note').hidden = pasteMode;
  $('paste-panel').hidden = !pasteMode;
  $('results').hidden = pasteMode && !hasData;
  $('paste-empty').hidden = !(pasteMode && !hasData);
  renderCampaigns();
  if (!hasData) return;
  renderKpis();
  renderPolicies();
  renderErrors();
}

// ----- call detail -----
function diffHtml(ops, side) {
  return ops.map((o) => {
    if (side === 'ref') {
      if (o.op === '=') return esc(o.ref);
      if (o.op === 'S') return `<span class="w-sub">${esc(o.ref)}</span>`;
      if (o.op === 'D') return `<span class="w-del">${esc(o.ref)}</span>`;
      return '';
    }
    if (o.op === '=') return esc(o.hyp);
    if (o.op === 'S') return `<span class="w-sub">${esc(o.hyp)}</span>`;
    if (o.op === 'I') return `<span class="w-ins">${esc(o.hyp)}</span>`;
    return '';
  }).filter(Boolean).join(' ') || '<span class="muted">(silence)</span>';
}

function readbackLine(turn) {
  if (!triggers(state.policy, turn)) return '<div class="readback none">No readback under this policy. The agent acts on what it heard.</div>';
  if (state.policy === 'all') return '<div class="readback">Agent summarises its understanding of this turn back to the caller.</div>';
  const h = turn.hyp; const parts = [];
  h.numbers.forEach((n) => parts.push(n.role === 'amount' ? `₹${n.value.toLocaleString('en-IN')}` : n.role === 'date' ? `the ${ordinal(n.value)}` : `${n.value}`));
  if (state.policy === 'critical') {
    if (h.polarity) parts.push(h.polarity === 'no' ? 'that is a no' : 'that is a yes');
    if (h.commitment) parts.push(h.commitment);
  }
  return `<div class="readback">Agent reads back what it heard: “${esc(parts.join(', '))}, right?”</div>`;
}

function openCall(id, focusTurn) {
  const call = allCalls().find((c) => c.id === id);
  if (!call) return;
  $('dlg-campaign').textContent = call.campaign;
  $('dlg-title').textContent = call.id;
  $('dlg-body').innerHTML = call.turns.map((t) => `
    <div class="turn ${t.errors.length ? 'has-err' : ''}" id="turn-${t.index}">
      <div class="turn-head"><span>Turn ${t.index + 1}</span><span>${t.wordErrors} word error${t.wordErrors === 1 ? '' : 's'} · ${t.errors.length} slot error${t.errors.length === 1 ? '' : 's'}</span></div>
      <div class="line"><span class="who">Said</span><span>${diffHtml(t.ops, 'ref')}</span></div>
      <div class="line"><span class="who">Heard</span><span>${diffHtml(t.ops, 'hyp')}</span></div>
      ${t.errors.length ? `<div class="slots">${t.errors.map((e) => `<span class="badge b-${e.category}">${CAT_LABEL[e.category]} <small>${esc(e.kind)}: ${esc(e.said ?? '—')} → ${esc(e.heard ?? '—')}</small></span>`).join('')}</div>` : ''}
      ${readbackLine(t)}
    </div>`).join('');
  $('call-dialog').showModal();
  const el = document.getElementById(`turn-${focusTurn}`);
  if (el) el.scrollIntoView({ block: 'center' });
}

// ----- events -----
document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
  state.src = b.dataset.src;
  document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  state.campaign = 'all';
  render();
}));
$('campaign').addEventListener('change', (e) => { state.campaign = e.target.value; render(); });
$('policies').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pol]'); if (!b) return;
  state.policy = b.dataset.pol; render();
});
$('secs').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  if (v > 0 && v <= 60) { state.secs = v; render(); }
});
$('cat-filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  const c = b.dataset.cat;
  if (state.cats.has(c)) state.cats.delete(c); else state.cats.add(c);
  renderErrors();
});
$('error-rows').addEventListener('click', (e) => {
  const r = e.target.closest('tr'); if (r) openCall(r.dataset.call, Number(r.dataset.turn));
});
$('error-rows').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const r = e.target.closest('tr'); if (r) openCall(r.dataset.call, Number(r.dataset.turn));
});
$('dlg-close').addEventListener('click', () => $('call-dialog').close());
$('call-dialog').addEventListener('click', (e) => { if (e.target === $('call-dialog')) $('call-dialog').close(); });

function refreshSystems() {
  const t = $('paste').value.trim();
  let systems = [];
  if (t.startsWith('[') || t.startsWith('{')) {
    try {
      const d = JSON.parse(t); const rows = Array.isArray(d) ? d : (d.rows || d.calls || [d]);
      if (rows[0] && 'normalised_reference' in rows[0]) systems = detectSystems(rows[0]);
    } catch (e) { /* shown on Analyse */ }
  }
  $('system-row').hidden = systems.length === 0;
  const cur = $('system').value;
  $('system').innerHTML = systems.map((s) => `<option ${s === cur ? 'selected' : ''}>${esc(s)}</option>`).join('');
}
$('paste').addEventListener('input', refreshSystems);
$('load-example').addEventListener('click', () => { $('paste').value = EXAMPLE; refreshSystems(); });
$('analyse').addEventListener('click', () => {
  const err = $('paste-error'); err.hidden = true;
  try {
    const parsed = parseInput($('paste').value, $('system').value || undefined);
    if (!parsed.length) throw new Error('Nothing to analyse. Paste at least one  said ||| heard  line.');
    state.pasted = analyseCalls(parsed);
    state.campaign = 'all';
  } catch (e) {
    err.textContent = e.message; err.hidden = false; state.pasted = null;
  }
  render();
});

$('theme').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('rb-theme', root.dataset.theme); } catch (e) { /* private mode */ }
});

$('sample-label').textContent = SAMPLE_LABEL;
render();
