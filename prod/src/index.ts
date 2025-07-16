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

function validateType(expectedType: string, arg: any, filePath: string, functionName: string, paramName: string): void {
  if (expectedType === 'any' || arg === undefined || arg === null) {
    return; // Skip validation for 'any' type or null/undefined arguments
  }

  const argType = typeof arg;

  if (expectedType.endsWith('[]')) {
    if (!Array.isArray(arg)) {
      throw new TelephoneValidationError(
        `RPC call to "${filePath}:${functionName}": Argument '${paramName}' expected type '${expectedType}' but got '${argType}'.`
      );
    }
    // Recursively validate each item in the array
    const itemType = expectedType.slice(0, -2);
    for (const item of arg) {
      validateType(itemType, item, filePath, functionName, paramName);
    }
  } else if (expectedType === 'object') {
    if (argType !== 'object' || Array.isArray(arg)) {
      throw new TelephoneValidationError(
        `RPC call to "${filePath}:${functionName}": Argument '${paramName}' expected type '${expectedType}' but got '${argType}'.`
      );
    }
    // For generic objects, we can't do much more without a detailed type definition (e.g., from a class or interface).
    // The current implementation validates that it is an object but not its structure.
  } else if (
    (expectedType === 'string' && argType !== 'string') ||
    (expectedType === 'number' && argType !== 'number') ||
    (expectedType === 'boolean' && argType !== 'boolean')
  ) {
    throw new TelephoneValidationError(
      `RPC call to "${filePath}:${functionName}": Argument '${paramName}' expected type '${expectedType}' but got '${argType}'.`
    );
  }
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

    if (arg === undefined || arg === null) {
      if (param.optional) {
        continue;
      } else {
        throw new TelephoneValidationError(
          `RPC call to "${filePath}:${functionName}": Argument for '${param.name}' is required but not provided.`
        );
      }
    }

    validateType(param.type, arg, filePath, functionName, param.name);
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