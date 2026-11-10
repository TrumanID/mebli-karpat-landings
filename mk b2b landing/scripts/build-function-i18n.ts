/** Bundles form and email strings of every locale for the Pages Function, so a new locale needs no code change. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const out: Record<string, unknown> = {};
for (const file of readdirSync('src/i18n/ui')) {
  const { form, email } = JSON.parse(readFileSync(`src/i18n/ui/${file}`, 'utf8'));
  out[file.replace('.json', '')] = { form, email };
}
writeFileSync('functions/_i18n.generated.json', JSON.stringify(out) + '\n');
