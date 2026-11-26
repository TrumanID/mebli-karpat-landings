import { handleOrder, type OrderEnv } from '../../src/lib/order-handler.ts';

/** Cloudflare Pages Function: receives the order form and passes it to the Gmail inbox through the Apps Script web app (ORDER_WEBHOOK_URL). */
export const onRequestPost = ({ request, env }: { request: Request; env: OrderEnv }) => handleOrder(request, env);
