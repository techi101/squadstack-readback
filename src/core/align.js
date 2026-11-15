// Word-level alignment (Levenshtein) between what was said and what the recogniser heard.

/** Returns ops: [{op:'='|'S'|'D'|'I', ref, hyp}] with the fewest edits. */
export function alignWords(ref, hyp) {
  const n = ref.length; const m = hyp.length;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i += 1) d[i][0] = i;
  for (let j = 0; j <= m; j += 1) d[0][j] = j;
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const sub = d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1);
      d[i][j] = Math.min(sub, d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }
  const ops = [];
  let i = n; let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)) {
      ops.push({ op: ref[i - 1] === hyp[j - 1] ? '=' : 'S', ref: ref[i - 1], hyp: hyp[j - 1] }); i -= 1; j -= 1;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ op: 'D', ref: ref[i - 1], hyp: null }); i -= 1;
    } else {
      ops.push({ op: 'I', ref: null, hyp: hyp[j - 1] }); j -= 1;
    }
  }
  return ops.reverse();
}

export function wordErrors(ops) {
  return ops.filter((o) => o.op !== '=').length;
}
