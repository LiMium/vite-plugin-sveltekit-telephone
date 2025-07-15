import { json, type RequestHandler, error as skError } from '@sveltejs/kit'

import { functionMap } from '$lib/client/_vite-sveltekit-telephone'
import { handleRoute } from 'vite-plugin-sveltekit-telephone-prod';

const GET: RequestHandler = async (event) => {
  const cookies = event.cookies;
  const response = await handleRoute(functionMap, {
    url: event.request.url,
    method: event.request.method,
    body: await event.request.json(),
    context: {
      cookies,
    },
  })
  return json(response);
}

export { GET, GET as POST }