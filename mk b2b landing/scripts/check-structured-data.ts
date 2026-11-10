/** Parses every JSON-LD block in dist/ and checks required properties (SPEC §10.3). */
import { read, htmlFiles } from './shared.ts';

const required: Record<string, string[]> = {
  Organization: ['name', 'url', 'address'], WebSite: ['url', 'inLanguage'], WebPage: ['url', 'name', 'inLanguage'],
  BreadcrumbList: ['itemListElement'], ItemList: ['itemListElement'], FAQPage: ['mainEntity', 'inLanguage'], Service: ['name', 'provider'],
};
const problems: string[] = [];
let blocks = 0;
for (const file of htmlFiles()) {
  const html = read(file);
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    blocks++;
    let data: { '@graph': Array<Record<string, unknown>> };
    try { data = JSON.parse(m[1]); } catch { problems.push(`${file}: JSON-LD does not parse`); continue; }
    for (const node of data['@graph']) {
      const type = String(node['@type']);
      for (const key of required[type] ?? []) if (node[key] == null) problems.push(`${file}: ${type} lacks ${key}`);
      if (node.inLanguage && node.inLanguage !== lang) problems.push(`${file}: ${type} inLanguage ${node.inLanguage} != ${lang}`);
      if (JSON.stringify(node).includes('TODO(client)')) problems.push(`${file}: ${type} contains TODO(client)`);
      if (type === 'FAQPage') for (const q of node.mainEntity as Array<{ name: string }>) if (!html.includes(q.name.replace(/&/g, '&amp;'))) problems.push(`${file}: FAQ "${q.name}" not visible`);
    }
    const price = m[1].match(/"priceValidUntil":"([^"]+)"/)?.[1];
    if (price && new Date(price) < new Date()) problems.push(`${file}: priceValidUntil in the past`);
  }
}
console.log(`check:structured-data: ${blocks} blocks, ${problems.length} problems`);
problems.forEach((p) => console.log(' -', p));
if (problems.length) process.exit(1);
