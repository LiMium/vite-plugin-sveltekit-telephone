import { AsyncLocalStorage } from "async_hooks";

export interface HandlerParams {
  url: string,
  body: {filePath: string, functionName: string, args: any[]},
  method: string,
  context: Telephone.Context
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

export async function handleRoute(functionMap: Record<string, any>, params: HandlerParams): Promise<any> {
  const { filePath, functionName, args } = params.body;
  const availableFunctions = functionMap[filePath];
  const func = availableFunctions[functionName];
  if (!func) {
    throw new Error(`RPC function "${filePath}:${functionName}" not found`);
  }
  // console.log(`[RPC Endpoint] Calling: ${filePath}:${functionName} with args:`, args);
  return alr.run({context: params.context}, async () => {
    const result = await func(...args);
    return { result };
  })
  /*
  const result = await (func.call({context: params.context}, ...args));
  return { result };
  */
}

export declare namespace Telephone {
  // Can be overriden by the user
  export interface Context {}
}