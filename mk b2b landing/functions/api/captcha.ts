import { handleChallenge, type RfqEnv } from '../../src/lib/rfq-handler.ts';

/** Cloudflare Pages Function: issues a signed proof-of-work challenge for the RFQ form. */
export const onRequestGet = ({ env }: { env: RfqEnv }) => handleChallenge(env);
