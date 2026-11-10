import { handleChallenge, type OrderEnv } from '../../src/lib/order-handler.ts';

/** Cloudflare Pages Function: issues a signed proof-of-work challenge for the order form. */
export const onRequestGet = ({ env }: { env: OrderEnv }) => handleChallenge(env);
