import { AsyncLocalStorage } from "async_hooks";

// Definition for parameter info, mirroring the one in dev/src/plugin.ts
// This is used by the validation logic.
export interface ParamInfo {
  name: string;
  type: string | object;
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

function validateType(expectedType: string | Record<string,any>, arg: any, filePath: string, functionName: string, paramName: string): void {
  if (expectedType === 'any' || arg === undefined || arg === null) {
    return; // Skip validation for 'any' type or null/undefined arguments
  }

  const argType = typeof arg;

  if (typeof(expectedType) === 'object') {
    if(argType === 'object' && !Array.isArray(arg)) {
      if (arg === null || Array.isArray(arg)) {
        throw new TelephoneValidationError(
          `RPC call to "${filePath}:${functionName}": Argument '${paramName}' expected type '${expectedType}' but got '${argType}'.`
        );
      } else {
        for (const key of Object.keys(expectedType)) {
          if (!(key in arg)) {
            throw new TelephoneValidationError(
              `RPC call to "${filePath}:${functionName}": Missing property '${key}' in argument '${paramName}'.`
            );
          }
          validateType(expectedType[key], arg[key], filePath, functionName, `${paramName}.${key}`);
        }
      }
    } else {
      throw new TelephoneValidationError(
        `RPC call to "${filePath}:${functionName}": Argument '${paramName}' expected type '${expectedType}' but got '${argType}'.`
      );
    }
  } else if (expectedType.endsWith('[]')) {
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

export function validateArgs(filePath: string, functionName: string, args: any[], expectedParams: ParamInfo[]): void {
  const minExpectedArgs = expectedParams.filter(p => !p.optional).length;
  const maxExpectedArgs = expectedParams.length;

  if (args.length < minExpectedArgs || args.length > maxExpectedArgs) {
    throw new TelephoneValidationError(
      `RPC call to "${filePath}:${functionName}": Expected ${
        minExpectedArgs === maxExpectedArgs ? maxExpectedArgs : `${minExpectedArgs}-${maxExpectedArgs}`
      } arguments, but got ${args.length}.`
    );
  }

  for (const [i, param] of expectedParams.entries()) {
    const arg = args[i];

    if (arg === undefined) {
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

// This should match the definition in client.ts
const UNDEFINED_SUBSTITUTION = `__TELEPHONE__UNDEFINED__alphaBetaGama_check123__`

export async function handleRoute(functionMap: Record<string, Record<string, FunctionDetail>>, params: HandlerParams): Promise<any> {
  const { filePath, functionName, args: argsIn } = params.body;
  const argsString = JSON.stringify(argsIn) // .replaceAll(UNDEFINED_SUBSTITUTION, "undefined")
  const args = JSON.parse(argsString, (k, v) => {return v == UNDEFINED_SUBSTITUTION ? undefined : v})

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