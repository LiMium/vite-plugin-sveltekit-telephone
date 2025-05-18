import { getContext, getContextOrNull } from "vite-plugin-sveltekit-telephone-prod";

let count = 0;

export async function greet(name: string) {
  return `[${count++}] Hello ${name}`;
}

export async function decrementCount(details: {by:number}) {
  count-= details.by;
  return count;
}

export async function reset() {
  count = 0;
  return count;
}