import { AsyncLocalStorage } from "async_hooks";

// Definition for parameter info, mirroring the one in dev/src/plugin.ts
// This is used by the validation logic.
interface ParamInfo {
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

export class TelephoneValidationError extends TelephoneError {
  constructor(message: string, public cause?: unknown) {
    super(message, cause);
    this.name = 'TelephoneValidationError';
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

function validateArgs(filePath: string, functionName: string, args: any[], expectedParams: ParamInfo[]): void {
  const minExpectedArgs = expectedParams.filter(p => !p.optional).length;
  const maxExpectedArgs = expectedParams.length;

  if (args.length < minExpectedArgs || args.length > maxExpectedArgs) {
    throw new TelephoneValidationError(
      `RPC call to "${filePath}:${functionName}": Expected ${
        minExpectedArgs === maxExpectedArgs ? maxExpectedArgs : `${minExpectedArgs}-${maxExpectedArgs}`
      } arguments, but got ${args.length}.`
    );
  }

  for (let i = 0; i < expectedParams.length; i++) {
    const param = expectedParams[i];
    const arg = args[i];
    // console.log("Validating param:", param.name, "optional", param.optional, "with type:", param.type, "and arg:", arg);

    if (arg === undefined || arg === null) {
      if (param.optional) {
        continue; // Skip validation for optional parameters
      } else {
        throw new TelephoneValidationError(
          `RPC call to "${filePath}:${functionName}": Argument for '${param.name}' is required but not provided.`
        );
      }
    }

    // Basic typeof check for primitives.
    // 'any' or complex types like 'MyInterface[]' or 'string | number' won't be strictly validated here.
    // This is a best-effort validation.
    if (arg !== undefined && param.type !== 'any') {
      const argType = typeof arg;
      // Allow 'object' for arrays as typeof [] is 'object'
      if (param.type.endsWith('[]') && argType === 'object' && Array.isArray(arg)) {
        // Could go deeper and check array item types, but keeping it simple for now.
      } else if (
        (param.type === 'string' && argType !== 'string') ||
        (param.type === 'number' && argType !== 'number') ||
        (param.type === 'boolean' && argType !== 'boolean') ||
        (param.type === 'object' && argType !== 'object' && !Array.isArray(arg)) // typeof null is 'object', which is fine.
      ) {
        // More specific error for arrays if type was like 'string[]' but got e.g. 'number[]'
        if (param.type.endsWith('[]') && !(argType === 'object' && Array.isArray(arg))) {
           throw new TelephoneValidationError(
            `RPC call to "${filePath}:${functionName}": Argument '${param.name}' expected type '${param.type}' but got '${Array.isArray(arg) ? "array" : argType}'.`
          );
        } else if (!param.type.endsWith('[]')) {
           throw new TelephoneValidationError(
            `RPC call to "${filePath}:${functionName}": Argument '${param.name}' expected type '${param.type}' but got '${argType}'.`
          );
        }
      }
    }
  }
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