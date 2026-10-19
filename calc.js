// Physical presence calculation (Citizenship Act s.5(1), post-Oct 2017 rules)
// - 1095 days needed in the 5 years before the signing date (the signing day itself does not count)
// - PR days count 1, pre-PR days with status count 0.5, TR credit capped at 365
// - Departure and return days count as days in Canada
const DAY = 86400000;
const toN = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / DAY; };
const toS = n => new Date(n * DAY).toISOString().slice(0, 10);
function minus5y(n) { const d = new Date(n * DAY); d.setUTCFullYear(d.getUTCFullYear() - 5); return Math.round(d.getTime() / DAY); }
function absentDays(t) { if (!t.depart || !t.ret) return 0; return Math.max(0, toN(t.ret) - toN(t.depart) - 1); }

function compute(settings, trips, todayStr) {
  const start = toN(settings.trStart), pr = toN(settings.prDate), today = toN(todayStr);
  const horizon = Math.max(today, pr) + 365 * 8;
  const len = horizon - start + 1;
  const absent = new Uint8Array(len);
  for (const t of trips) {
    if (!t.depart) continue;
    const a = toN(t.depart) + 1;
    const b = t.ret ? toN(t.ret) - 1 : today; // no return date yet: absent through today
    for (let n = Math.max(a, start); n <= Math.min(b, horizon); n++) absent[n - start] = 1;
  }
  const trP = new Float64Array(len + 1), prP = new Float64Array(len + 1);
  for (let i = 0; i < len; i++) {
    const n = start + i, here = absent[i] ? 0 : 1;
    trP[i + 1] = trP[i] + (n < pr ? here : 0);
    prP[i + 1] = prP[i] + (n >= pr ? here : 0);
  }
  const range = (P, a, b) => { a = Math.max(a, start); b = Math.min(b, horizon); return b < a ? 0 : P[b - start + 1] - P[a - start]; };
  function at(D) { // totals for an application signed on day D
    const ws = minus5y(D), we = D - 1;
    const trDays = range(trP, ws, we), prDays = range(prP, ws, we);
    const trCredit = Math.min(365, trDays * 0.5);
    let absentIn = 0; for (let n = Math.max(ws, start); n <= Math.min(we, horizon); n++) absentIn += absent[n - start];
    return { ws, trDays, trCredit, prDays, absentIn, total: trCredit + prDays };
  }
  const now = at(today + 1); // counting today
  let eligible = null;
  for (let D = Math.max(today, pr + 1); D <= horizon; D++) { if (at(D).total >= 1095) { eligible = D; break; } }
  return { now, eligible, eligibleStr: eligible != null ? toS(eligible) : null, daysLeft: eligible != null ? Math.max(0, eligible - today) : null, atEligible: eligible != null ? at(eligible) : null, toS };
}
if (typeof module !== 'undefined') module.exports = { compute, absentDays, toN, toS };
