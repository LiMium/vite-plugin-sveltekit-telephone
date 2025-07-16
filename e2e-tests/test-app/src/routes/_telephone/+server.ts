import { json, type RequestHandler, error as skError } from '@sveltejs/kit'

import { functionMap } from '$lib/client/_vite-sveltekit-telephone'
import { handleRoute, TelephoneError, TelephoneValidationError } from 'vite-plugin-sveltekit-telephone-prod';
import { dev } from '$app/environment';

const GET: RequestHandler = async (event) => {
  const cookies = event.cookies;
  try {
    const response = await handleRoute(functionMap, {
      url: event.request.url,
      method: event.request.method,
      body: await event.request.json(),
      context: {
        cookies,
      },
    })
    return json(response);
  } catch (err: any) {
    if (err instanceof TelephoneValidationError) {
      return makeErrorResponse("Error", err.message, 400);
    } else if (err instanceof TelephoneError) {
      return makeErrorResponse("Error", err.message, 400);
    } else if (err instanceof Error) {
      return makeErrorResponse("Error", err.message, 500);
    } else {
      return makeErrorResponse("Internal error", "" + err, 500);
    }
  }
}

function makeErrorResponse(externalMessage: string, message: string, status: number) {
  if (dev) {
    console.error("Error in RPC handler:", externalMessage, message);
    return json({ message: externalMessage + ":" + message }, { status });
  }
  return json({ message: externalMessage }, { status });
}

export { GET, GET as POST }