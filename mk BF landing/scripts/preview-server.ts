/**
 * Local stand-in for Cloudflare Pages: serves dist/, applies public/_headers and runs the real order handler
 * with email stubbed (each "sent" mail is printed). Run: npm run preview  (PORT=4322)
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
import { handleChallenge, handleOrder } from '../src/lib/order-handler.ts';

const port = Number(process.env.PORT ?? 4322);
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };
const csp = readFileSync('public/_headers', 'utf8').split('\n').filter((l) => /^\s+[\w-]+: /.test(l)).slice(0, 5).map((l) => l.trim().split(/: (.*)/s).slice(0, 2) as [string, string]);
const stubMail = (async (url: string | URL, init?: RequestInit) => {
  console.log('[stub]', String(url), init?.body ?? '');
  return Response.json({ messageId: 'stub' });
}) as typeof fetch;
const env = { BREVO_API_KEY: 'stub', ORDER_TO_EMAIL: 'sales@example.com', ORDER_FROM_EMAIL: 'noreply@example.com', CAPTCHA_SECRET: 'preview-only-secret' };

createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${port}`);
  if (url.pathname === '/api/captcha' && req.method === 'GET') {
    const out = await handleChallenge(env);
    res.writeHead(out.status, Object.fromEntries(out.headers));
    return void res.end(await out.text());
  }
  if (url.pathname === '/api/order' && req.method === 'POST') {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const headers = new Headers(req.headers as Record<string, string>);
    const out = await handleOrder(new Request(url, { method: 'POST', headers, body: Buffer.concat(chunks) }), env, { fetch: stubMail });
    res.writeHead(out.status, Object.fromEntries(out.headers));
    return void res.end(Buffer.from(await out.arrayBuffer()));
  }
  let file = join('dist', normalize(decodeURIComponent(url.pathname)));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  const found = existsSync(file);
  if (!found) file = 'dist/404.html';
  const ext = extname(file);
  // Real hosts compress text, so budgets measured here should see compressed sizes too.
  const gzip = /\.(html|css|js|xml|txt|json|md)$/.test(ext) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
  const body = readFileSync(file);
  res.writeHead(found ? 200 : 404, { 'content-type': types[ext] ?? 'application/octet-stream', ...(gzip ? { 'content-encoding': 'gzip', vary: 'accept-encoding' } : {}), ...(url.pathname.startsWith('/_astro/') ? { 'cache-control': 'public, max-age=31536000, immutable' } : {}), ...Object.fromEntries(csp) });
  res.end(gzip ? gzipSync(body) : body);
}).listen(port, () => console.log(`preview on http://localhost:${port}`));
