/** Lists TODO(client) in content and built pages. --strict fails if any remain, or if a claim is unapproved (SPEC §3.3). */
import { read, strict, walk, htmlFiles } from './shared.ts';

const counts = new Map<string, number>();
for (const file of [...walk('src/content'), ...walk('src/i18n/ui'), 'src/lib/site.ts']) {
  const n = read(file).split('TODO(client)').length - 1;
  if (n) counts.set(file, n);
}
const pages = htmlFiles().filter((f) => read(f).includes('TODO(client)')).length;
const total = [...counts.values()].reduce((a, b) => a + b, 0);
for (const [file, n] of counts) console.log(`${String(n).padStart(4)}  ${file}`);
const unapproved = read('docs/claims.md').split('\n').filter((l) => /^\|\s*C\d+/.test(l) && !/\|\s*approved\s*\|\s*$/.test(l)).length;
console.log(`check:todos: ${total} TODO(client) in source, ${pages} built pages show them, ${unapproved} claims not approved`);
if (strict && (total || pages || unapproved)) process.exit(1);
