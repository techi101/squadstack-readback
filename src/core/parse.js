// Read pasted transcripts into calls: [{id, campaign, turns:[{ref, hyp}]}].
//
// Three formats:
//  1. Text: "# call-id | campaign" header lines, then one turn per line as  said ||| heard  (or said<TAB>heard).
//  2. JSON: [{id, campaign, turns:[{ref, hyp}]}]  or  {calls:[...]}.
//  3. JSON rows shaped like the SquadStack Conversational Streaming ASR Benchmark "results" config:
//     {sample_id, business_domain?, normalised_reference, <system>_normalised}, one line per turn.
//     Built from the public dataset card; not tested on real rows (the data is gated).

export function detectSystems(row) {
  return Object.keys(row).filter((k) => k.endsWith('_normalised') && k !== 'normalised_reference')
    .map((k) => k.replace(/_normalised$/, ''));
}

function fromBenchmarkRows(rows, system) {
  const sys = system || detectSystems(rows[0])[0];
  if (!sys) throw new Error('No <system>_normalised column found in the rows.');
  return rows.map((r) => {
    const ref = String(r.normalised_reference ?? '').split('\n');
    const hyp = String(r[`${sys}_normalised`] ?? '').split('\n');
    const turns = ref.map((line, i) => ({ ref: line, hyp: hyp[i] ?? '' })).filter((t) => t.ref.trim() || t.hyp.trim());
    return { id: `sample ${r.sample_id}`, campaign: r.business_domain || 'Benchmark', turns };
  });
}

function fromJson(data, system) {
  const list = Array.isArray(data) ? data : (data.calls || data.rows || [data]);
  if (!list.length) throw new Error('The JSON holds no calls.');
  if ('normalised_reference' in list[0]) return fromBenchmarkRows(list, system);
  return list.map((c, i) => {
    if (!Array.isArray(c.turns)) throw new Error(`Call ${i + 1} has no "turns" list.`);
    return {
      id: String(c.id ?? `call ${i + 1}`),
      campaign: c.campaign || 'Pasted',
      turns: c.turns.map((t) => ({ ref: String(t.ref ?? t.said ?? ''), hyp: String(t.hyp ?? t.heard ?? '') })),
    };
  });
}

function fromText(text) {
  const calls = [];
  let cur = null;
  text.split(/\r?\n/).forEach((raw, ln) => {
    const line = raw.trim();
    if (!line) return;
    if (line.startsWith('#')) {
      const [id, campaign] = line.slice(1).split('|').map((s) => s.trim());
      cur = { id: id || `call ${calls.length + 1}`, campaign: campaign || 'Pasted', turns: [] };
      calls.push(cur);
      return;
    }
    const parts = line.includes('|||') ? line.split('|||') : line.split('\t');
    if (parts.length < 2) throw new Error(`Line ${ln + 1}: expected  said ||| heard`);
    if (!cur) { cur = { id: 'call 1', campaign: 'Pasted', turns: [] }; calls.push(cur); }
    cur.turns.push({ ref: parts[0].trim(), hyp: parts.slice(1).join(' ').trim() });
  });
  return calls.filter((c) => c.turns.length);
}

export function parseInput(text, system) {
  const t = String(text ?? '').trim();
  if (!t) return [];
  if (t.startsWith('[') || t.startsWith('{')) return fromJson(JSON.parse(t), system);
  return fromText(t);
}
