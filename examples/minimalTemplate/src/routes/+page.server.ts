import { greet } from '$lib/tele/test.telephone.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({parent}) {
  const greeting = await greet("from server");

  return {
    greeting,
    test: 123
  }
}