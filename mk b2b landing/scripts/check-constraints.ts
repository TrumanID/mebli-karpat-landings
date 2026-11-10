/** Gate from CONSTRAINTS.md + status from docs/constraints-status.csv. --strict fails on open SITE rows and LOCALE rows of live locales. */
import { read, strict } from './shared.ts';

const src = read('src/i18n/locales.ts');
const live = [...src.matchAll(/^\s*(\w\w): \{.*status: 'live'/gm)].map((m) => m[1]);
const prefix: Record<string, string> = { de: 'DE-', nl: 'NL-', pl: 'PL-', fr: 'FR-', cs: 'CZ-' };

const gates = new Map<string, string>();
for (const line of read('CONSTRAINTS.md').split('\n')) {
  const m = line.match(/^\| ((?:[A-Z]{1,2})-\d+) \|/);
  if (m) gates.set(m[1], line.split('|')[4].trim());
}
const status = new Map(read('docs/constraints-status.csv').trim().split('\n').slice(1).map((l) => { const [id, s] = l.split(','); return [id, s] as const; }));

const missing = [...gates.keys()].filter((id) => !status.has(id));
const blocking = [...gates].filter(([id, gate]) => {
  if (status.get(id) !== 'open') return false;
  if (gate.includes('SITE')) return true;
  if (!gate.includes('LOCALE')) return false;
  return id === 'W-06' ? live.length > 0 : live.some((l) => prefix[l] && id.startsWith(prefix[l]));
}).map(([id]) => id);

console.log(`check:constraints: ${gates.size} rows, live locales: ${live.join(', ')}`);
if (missing.length) console.log(`missing from docs/constraints-status.csv: ${missing.join(', ')}`);
console.log(`open launch blockers (${blocking.length}): ${blocking.join(', ') || 'none'}`);
if (missing.length || (strict && blocking.length)) process.exit(1);
