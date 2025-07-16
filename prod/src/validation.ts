import { ParamInfo, TelephoneError } from "./index.js";

export class TelephoneValidationError extends TelephoneError {
  constructor(message: string, public cause?: unknown) {
    super(message, cause);
    this.name = 'TelephoneValidationError';
  }
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
