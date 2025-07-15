export async function hello(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

export async function add(a: number, b: number): Promise<number> {
  return a + b;
}

export async function errorFunction(): Promise<void> {
  throw new Error('This is a test error');
}

export async function functionWithNoArgs(): Promise<string> {
  return "No arguments here!";
}

export async function functionWithOptionalArg(name?: string): Promise<string> {
  return `Hello, ${name || 'world'}!`;
}
