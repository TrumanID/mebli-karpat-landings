/** Key parity, translation status, hard-coded paths and hreflang reciprocity (SPEC §5A.7). --strict also fails on unreviewed text. */
import { existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { read, strict, walk, htmlFiles } from './shared.ts';

const errors: string[] = [];
const warnings: string[] = [];
const src = read('src/i18n/locales.ts');
const live = [...src.matchAll(/^\s*(\w\w): \{.*status: 'live'/gm)].map((m) => m[1]);

const keys = (o: unknown, base = ''): string[] => Array.isArray(o) ? o.flatMap((v, i) => keys(v, `${base}[${i}]`))
  : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => keys(v, base ? `${base}.${k}` : k)) : [base];
const leaves = (o: unknown): Map<string, unknown> => {
  const out = new Map<string, unknown>();
  const go = (v: unknown, p: string) => { if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => go(x, `${p}.${k}`)); else out.set(p, v); };
  go(o, '');
  return out;
};
const placeholders = (s: unknown) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();

for (const dir of ['src/i18n/ui', 'src/content/landing', 'src/content/faq', 'src/content/legal']) {
  const base = JSON.parse(read(`${dir}/de.json`));
  const baseKeys = new Set(keys(base).filter((k) => !k.startsWith('meta.')));
  const baseLeaves = leaves(base);
  for (const l of live.filter((x) => x !== 'de')) {
    if (!existsSync(`${dir}/${l}.json`)) { errors.push(`${dir}/${l}.json missing for live locale`); continue; }
    const other = JSON.parse(read(`${dir}/${l}.json`));
    const otherKeys = new Set(keys(other).filter((k) => !k.startsWith('meta.')));
    for (const k of baseKeys) if (!otherKeys.has(k)) errors.push(`${dir}/${l}.json lacks ${k}`);
    for (const k of otherKeys) if (!baseKeys.has(k)) errors.push(`${dir}/${l}.json has extra ${k}`);
    const otherLeaves = leaves(other);
    for (const [k, v] of baseLeaves) if (otherLeaves.has(k) && placeholders(v) !== placeholders(otherLeaves.get(k))) errors.push(`${dir}/${l}.json placeholders differ at ${k}`);
  }
}

// Translation status of pages and product texts (§5A.4, §7.3)
for (const l of live) {
  const status = JSON.parse(read(`src/content/landing/${l}.json`)).meta.status;
  if (!['reviewed', 'approved'].includes(status)) warnings.push(`landing/${l}: status ${status}`);
}
const hash = (o: object) => createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16);
for (const file of readdirSync('src/content/products')) {
  const p = JSON.parse(read(`src/content/products/${file}`));
  const de = p.i18n.de;
  const sourceHash = hash({ descriptor: de.descriptor, description: de.description, features: de.features });
  for (const [l, t] of Object.entries<{ sourceHash: string; status: string }>(p.i18n)) {
    if (t.sourceHash !== sourceHash) warnings.push(`products/${p.slug}/${l}: stale`);
    if (!p.hold && !['reviewed', 'approved'].includes(t.status)) errors.push(`products/${p.slug}/${l}: published with status ${t.status}`);
  }
}

// No hard-coded internal paths in components (§5A.2)
for (const f of walk('src/components')) {
  for (const m of read(f).matchAll(/href="(\/[^"]*)"/g)) errors.push(`${f}: hard-coded path ${m[1]}`);
}

// hreflang reciprocity on the built output (§5A.3)
const toFile = (url: string) => { const p = new URL(url).pathname; return `dist${p}index.html`; };
const links = (html: string) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
let checked = 0;
for (const file of htmlFiles()) {
  const html = read(file);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const alts = links(html);
  if (!canonical || !alts.length) continue;
  checked++;
  if (html.includes('noindex')) errors.push(`${file}: noindex page lists hreflang`);
  if (!alts.some((a) => a.href === canonical)) errors.push(`${file}: alternates do not include itself`);
  if (!alts.some((a) => a.lang === 'x-default')) errors.push(`${file}: no x-default`);
  for (const a of alts) {
    const target = toFile(a.href);
    if (!existsSync(target)) { errors.push(`${file}: alternate ${a.href} is not built`); continue; }
    if (!links(read(target)).some((b) => b.href === canonical)) errors.push(`${target}: does not link back to ${canonical}`);
  }
}

console.log(`check:i18n: live locales ${live.join(', ')}; ${checked} pages with hreflang; ${errors.length} errors; ${warnings.length} review warnings`);
errors.forEach((e) => console.log(' ERROR', e));
warnings.forEach((w) => console.log(' warn ', w));
if (errors.length || (strict && warnings.length)) process.exit(1);
