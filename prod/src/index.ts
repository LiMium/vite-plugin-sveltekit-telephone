import { AsyncLocalStorage } from "async_hooks";
import { validateArgs } from "./validation.js";

// Definition for parameter info, mirroring the one in dev/src/plugin.ts
// This is used by the validation logic.
export interface ParamInfo {
  name: string;
  type: string;
  optional: boolean;
}

// Expected structure for function details within the functionMap
interface FunctionDetail {
  fn: (...args: any[]) => any;
  params: ParamInfo[];
}

export interface HandlerParams {
  url: string,
  body: {filePath: string, functionName: string, args: any[]},
  method: string,
  context: Telephone.Context
}

export class TelephoneError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TelephoneError';
    if (cause) {
      this.cause = cause;
    }
  }
}

const alr = new AsyncLocalStorage();

export function getContext(): Telephone.Context {
  const context = getContextOrNull()
  if (context) {
    return context
  } else {
    throw Error("Internal error: Couldn't find RPC context")
  }
}

export function getContextOrNull(): Telephone.Context | null {
  const store: Record<string, any> = alr.getStore() as any;
  if (store) {
    return store.context
  } else {
    return null
  }
}

export function withContext<T>(context: Telephone.Context, fn: () => T): T {
  return alr.run({context}, () => {
    return fn()
  })
}

export async function handleRoute(functionMap: Record<string, Record<string, FunctionDetail>>, params: HandlerParams): Promise<any> {
  const { filePath, functionName, args } = params.body;

  const fileFunctions = functionMap[filePath];
  if (!fileFunctions) {
    throw new TelephoneError(`RPC filePath "${filePath}" not found.`);
  }

  const functionEntry = fileFunctions[functionName];
  if (!functionEntry || typeof functionEntry.fn !== 'function') {
    throw new TelephoneError(`RPC function "${filePath}:${functionName}" not found or is not a function.`);
  }

  // Validate arguments
  validateArgs(filePath, functionName, args, functionEntry.params);

  // console.log(`[RPC Endpoint] Calling: ${filePath}:${functionName} with args:`, args);
  return alr.run({context: params.context}, async () => {
    const result = await functionEntry.fn(...args);
    return { result };
  });
}

export declare namespace Telephone {
  // Can be overriden by the user
  export interface Context {}
}