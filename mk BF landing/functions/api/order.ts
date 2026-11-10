import { handleOrder, type OrderEnv } from '../../src/lib/order-handler.ts';

/** Cloudflare Pages Function: receives the order form and e-mails it to ORDER_TO_EMAIL. */
export const onRequestPost = ({ request, env }: { request: Request; env: OrderEnv }) => handleOrder(request, env);
