/**
 * One-off helper (SPEC §14.4, Appendix A): pulls the 36 main-site product pages into
 * data/import/catalog.raw.json and downloads photos to assets/originals/.
 * Output is raw material only: Ukrainian consumer copy is never published as is.
 * Run: node scripts/import-catalog.ts [--no-images]
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const BASE = 'https://meblikarpat.com.ua/';
const UA = 'Mozilla/5.0 (compatible; MebliKarpat-B2B-import/1.0)';

const seeds: Array<[string, 'tables' | 'chairs', string, string]> = [
  ['barny', 'tables', 'stil-barnij', 'Barny'],
  ['barny-round', 'tables', 'stil-barnij-kruhlyi', 'Barny Round'],
  ['barny-rectangular', 'tables', 'stil-barnij-priamokutnij', 'Barny Rectangular'],
  ['bayden', 'tables', 'stil-derev-janij-biden', 'Bayden'],
  ['frankfurt', 'tables', 'stil-derev-janij-frankfurt', 'Frankfurt'],
  ['frankfurt-eko', 'tables', 'stil-derev-janij-frankfurt-eko', 'Frankfurt Eko'],
  ['fabio', 'tables', 'stil-fabio', 'Fabio'],
  ['fin-oak', 'tables', 'stil-fin-oak', 'Fin Oak'],
  ['gdansk', 'tables', 'stil-gdansk', 'Gdansk'],
  ['grand', 'tables', 'stil-derev-janij-grand', 'Grand'],
  ['johnson', 'tables', 'stil-derev-janij-johnson', 'Johnson'],
  ['likicari-long', 'tables', 'stil-derev-janij-likicari-long', 'Likicari Long'],
  ['smart', 'tables', 'stil-derev-janij-smart', 'Smart'],
  ['verke-rectangular', 'tables', 'stil-derev-janij-verke-prjamokutnij', 'Verke Rectangular'],
  ['verke-round', 'tables', 'stil-derev-janij-verke-kruglij', 'Verke Round'],
  ['lounge', 'chairs', 'stilec-lounge', 'Lounge'],
  ['boris', 'chairs', 'stilec-boris', 'Boris'],
  ['sydney', 'chairs', 'stilec-sydney', 'Sydney'],
  ['sydney-with-sides', 'chairs', 'stilec-sydney-with-sides', 'Sydney with Sides'],
  ['milan', 'chairs', 'stilec-milan', 'Milan'],
  ['milan-high', 'chairs', 'stilec-milan-high', 'Milan High'],
  ['forte-bar', 'chairs', 'stilec-forte-barnij', 'Forte Bar'],
  ['forte-01', 'chairs', 'stilec-forte-01', 'Forte 01'],
  ['forte-03', 'chairs', 'stilec-forte-03', 'Forte 03'],
  ['dallas', 'chairs', 'stilec-dallas', 'Dallas'],
  ['dallas-soft', 'chairs', 'stilec-dallas-soft', 'Dallas Soft'],
  ['aston', 'chairs', 'stilec-asti', 'Aston'],
  ['madrid', 'chairs', 'stilec-madrid', 'Madrid'],
  ['chicago', 'chairs', 'stilec-chicago', 'Chicago'],
  ['bone', 'chairs', 'stilec-bone', 'Bone'],
  ['como', 'chairs', 'stilec-como', 'Como'],
  ['vilnius', 'chairs', 'stilec-vil-njus', 'Vilnius'],
  ['chester-soft', 'chairs', 'stilec-chester-soft', 'Chester Soft'],
  ['tor', 'chairs', 'stilec-tor', 'Tor'],
  ['light', 'chairs', 'stilec-layt', 'Light'],
  ['hygge', 'chairs', 'stilec-hjuge', 'Hygge'],
];

const get = async (path: string) => {
  const res = await fetch(BASE + path, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
};
const strip = (s: string) =>
  s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ').trim();

const horeca = await get('mebli-dlja-horeca/');
const noImages = process.argv.includes('--no-images');
mkdirSync('assets/originals', { recursive: true });
mkdirSync('data/import', { recursive: true });

const out = [];
for (const [slug, category, path, name] of seeds) {
  const html = await get(path + '/');
  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const gallery = JSON.parse(html.match(/"data":\s*(\[\{"thumb"[\s\S]*?\])\s*,\s*"options"/)?.[1] ?? '[]');
  const specTable = html.match(/id="product-attribute-specs-table"[\s\S]*?<\/table>/)?.[0] ?? '';
  const specs = Object.fromEntries(
    [...specTable.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => [strip(m[1]), strip(m[2])]),
  );
  const description = strip(html.match(/class="product attribute description"[\s\S]*?<\/div>\s*<\/div>/)?.[0]?.replace(/^[^>]*>/, '') ?? '');
  const options = [...html.matchAll(/<(?:option|label)[^>]*>([^<]{2,60})<\/(?:option|label)>/g)].map((m) => strip(m[1])).filter((t) => /дуб|бук|масл|лак|емал|розкл|механ/i.test(t));
  const images: string[] = gallery.map((g: { full: string }) => g.full);
  const files: string[] = [];
  if (!noImages) {
    for (const [i, url] of images.slice(0, 4).entries()) {
      const file = `assets/originals/${slug}-${i + 1}.jpg`;
      if (!existsSync(file)) {
        const res = await fetch(url, { headers: { 'user-agent': UA } });
        if (!res.ok) continue;
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      }
      files.push(file);
    }
  }
  out.push({ slug, category, name, sourceUrl: BASE + path + '/', title, specs, description, options: [...new Set(options)], horeca: horeca.includes(`/${path}/`), images, files });
  console.log(slug, '|', title, '|', Object.keys(specs).length, 'specs |', images.length, 'images');
}
writeFileSync('data/import/catalog.raw.json', JSON.stringify(out, null, 2) + '\n');
