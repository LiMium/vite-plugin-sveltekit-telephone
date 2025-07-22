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
  if (typeof(name) != "string" && typeof(name) != "undefined" ) {
    throw new Error("Unexpected type of name:" + name)
  }
  return `Hello, ${name || 'world'}!`;
}

export async function processObject(data: { name: string; age: number }): Promise<string> {
	return `Received object for ${data.name} who is ${data.age} years old.`;
}

export async function processArray(data: string[]): Promise<string> {
	return `Received array with items: ${data.join(', ')}.`;
}

export async function processMixed(
	data: { user: { name: string }; roles: string[] }
): Promise<string> {
	return `User ${data.user.name} has roles: ${data.roles.join(', ')}.`;
}
