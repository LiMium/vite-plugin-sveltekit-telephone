export function hello(name: string): string {
  if (typeof name !== 'string') {
    // @ts-ignore
    throw new Error(`Invalid argument type for name: expected string, got ${typeof name}`);
  }
  return `Hello, ${name}!`;
}

export async function add(a: number, b: number): Promise<number> {
  if (typeof a !== 'number' || typeof b !== 'number') {
    // @ts-ignore
    throw new Error('Invalid arguments: a and b must be numbers');
  }
  return a + b;
}

export function errorFunction(): void {
  throw new Error('This is a test error');
}

export function functionWithNoArgs(): string {
  return "No arguments here!";
}

export function functionWithOptionalArg(name?: string): string {
  return `Hello, ${name || 'world'}!`;
}
