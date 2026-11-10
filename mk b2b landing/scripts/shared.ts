import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const strict = process.argv.includes('--strict');
export const walk = (dir: string, out: string[] = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
export const read = (p: string) => readFileSync(p, 'utf8');
export const htmlFiles = () => walk('dist').filter((f) => f.endsWith('.html'));
