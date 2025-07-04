import { handleRoute } from 'vite-plugin-sveltekit-telephone-prod/server';
import * as e2eFunctions from '$lib/tele/e2e.telephone';

const functionMap = {
  'src/lib/tele/e2e.telephone.ts': e2eFunctions
};

export const handle = async ({ event, resolve }: any) => {
  if (event.url.pathname.startsWith('/telephone')) {
    const body = await event.request.json();
    const result = await handleRoute(functionMap, {
      url: event.url.toString(),
      body: body,
      method: event.request.method,
      context: {} // Add context if needed
    });
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return resolve(event);
};
