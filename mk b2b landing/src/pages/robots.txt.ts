import { ai, liveLocales } from '../i18n/locales.ts';
import { localizedPath } from '../i18n/routes.ts';
import { site } from '../lib/site.ts';

/** Appendix C. Bot tokens must be checked against vendor docs at launch (docs/agent-readiness.md). */
const retrieval = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
const training = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];

export const GET = () => {
  const rule = ai.allowTraining ? 'Allow: /' : 'Disallow: /';
  const body = [
    'User-agent: *', 'Allow: /', 'Disallow: /api/',
    ...liveLocales.map((l) => `Disallow: ${localizedPath('thanks', l)}`),
    '', '# AI search and retrieval agents: allowed',
    ...retrieval.flatMap((b) => [`User-agent: ${b}`, 'Allow: /']),
    '', `# AI training crawlers: flag ai.allowTraining in src/i18n/locales.ts`,
    ...training.flatMap((b) => [`User-agent: ${b}`, rule]),
    '', `Sitemap: ${site.url}/sitemap-index.xml`, '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
