import { handleRfq, type RfqEnv } from '../../src/lib/rfq-handler.ts';
import ui from '../_i18n.generated.json';

/** Cloudflare Pages Function. `_i18n.generated.json` is written by scripts/build-function-i18n.ts before each build. */
export const onRequestPost = ({ request, env }: { request: Request; env: RfqEnv }) => handleRfq(request, env, { ui });
