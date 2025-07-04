# High-Level Design: vite-plugin-sveltekit-telephone

## 1. Overview

`vite-plugin-sveltekit-telephone` is a Vite plugin designed to provide a simple Remote Procedure Call (RPC) mechanism for SvelteKit applications, particularly when using `adapter-node`. It allows developers to define functions on the server-side that can be seamlessly called from the client-side as if they were local asynchronous functions.

The plugin draws inspiration from `telefunc` but aims for a more straightforward and less "magical" implementation to enhance reliability and ease of understanding.

## 2. Key Goals/Motivation

*   **Simplicity:** Provide an easy-to-understand RPC mechanism.
*   **Reliability:** Offer a more robust alternative by avoiding complex abstractions that can sometimes be brittle.
*   **Developer Experience:** Streamline the process of creating and using server-side functions from the client.
*   **Performance:** Separate development and production concerns to optimize build times and minimize dependency creep in production builds.

## 3. Architecture

The project is structured as a monorepo with distinct packages for development-time and production-time utilities.

### 3.1. Monorepo Structure

*   **`dev/`**: Contains the Vite plugin (`vite-plugin-sveltekit-telephone-dev`) used during development. It's responsible for code generation and transformation.
*   **`prod/`**: Contains the production utilities (`vite-plugin-sveltekit-telephone-prod`) needed at runtime. This includes the server-side request handler and client-side fetch logic.
*   **`examples/`**: Includes sample SvelteKit projects demonstrating how to use the plugin.

### 3.2. Development Workflow (`dev` package)

The core of the development workflow is the Vite plugin located in `dev/src/plugin.ts`.

1.  **File Discovery:**
    *   The plugin scans the `src` directory for files matching the pattern `**/*.telephone.ts`. These files are designated to contain RPC functions.

2.  **Code Generation & Transformation:**
    *   **Client Stubs:** For each `.telephone.ts` file, the plugin transforms its content when building for the client (browser). The original server-side code is replaced with client-side stubs.
        *   Each exported function in the `.telephone.ts` file gets a corresponding asynchronous stub function in the client-side version of the file.
        *   These stubs internally use `makeRpcCall` (from `vite-plugin-sveltekit-telephone-prod/client`) to send the actual RPC request.
    *   **`functionMap` Generation:** The plugin generates a `functionMap` located at `src/lib/client/_vite-sveltekit-telephone/index.ts`. This map stores references to the *actual* server-side functions from all `.telephone.ts` files. The keys are file paths, and the values are modules containing the functions. This map is crucial for the server-side handler to locate and execute the correct RPC function.
    *   **`ts-morph`:** The plugin uses `ts-morph` to parse and analyze the TypeScript code in `.telephone.ts` files. This allows it to accurately identify exported functions and their signatures to generate the corresponding client stubs.

3.  **Vite Integration:**
    *   The plugin hooks into Vite's build process, specifically using `configResolved` to find RPC files, `buildStart` to generate the `functionMap`, and `transform` to replace server code with client stubs for browser builds.

### 3.3. Production Workflow (`prod` package)

The `prod` package provides the runtime components necessary for the RPC mechanism to function in a deployed application.

1.  **Server-Side Request Handling (`handleRoute`):**
    *   Located in `prod/src/index.ts`, the `handleRoute` function is designed to be used within a SvelteKit server endpoint, typically `src/routes/_telephone/+server.ts`.
    *   When a client makes an RPC call, it sends a POST request to this `/_telephone` endpoint.
    *   `handleRoute` uses the `functionMap` (generated during development) to look up the requested server function based on the `filePath` and `functionName` provided in the request body.
    *   It then executes the identified function with the arguments sent from the client.

2.  **Client-Side RPC Call (`makeRpcCall`):**
    *   Located in `prod/src/client.ts`, this function is responsible for making the actual `fetch` request from the client to the `/_telephone` server endpoint.
    *   It sends the `filePath`, `functionName`, and `args` in the JSON body of a POST request.
    *   It handles the response, returning the result or throwing an error if the call fails.

3.  **Context Management:**
    *   The `prod` package uses `AsyncLocalStorage` from Node.js's `async_hooks` module to manage and propagate context (e.g., cookies, user session) to RPC functions when they are executed on the server.
    *   `getContext()`, `getContextOrNull()`, and `withContext()` are utility functions provided to access this context within the server-side RPC functions.

### 3.4. RPC Call Flow

1.  **Client-Side:** A function defined in a `.telephone.ts` file is called in client-side code.
2.  **Stub Execution:** This call actually invokes a generated client stub (due to the Vite plugin's transformation).
3.  **`makeRpcCall`:** The stub calls `makeRpcCall` (from `prod/client.ts`), passing the target file path, function name, and arguments.
4.  **HTTP Request:** `makeRpcCall` sends a POST request to the `/_telephone` endpoint with the RPC details in the JSON body.
5.  **Server-Side Handler:** The SvelteKit endpoint (`src/routes/_telephone/+server.ts`) receives the request and passes it to `handleRoute` (from `prod/index.ts`).
6.  **Function Lookup:** `handleRoute` uses the `functionMap` to find the actual server-side function.
7.  **Context Injection:** `handleRoute` uses `AsyncLocalStorage` to make any provided context (e.g., from SvelteKit's `event.cookies`) available via `getContext()`.
8.  **Function Execution:** The server-side function is executed with the provided arguments and access to the context.
9.  **Response:** The result of the function is returned by `handleRoute`, which is then sent back as a JSON response to the client.
10. **Result Handling:** `makeRpcCall` receives the response, and the client stub returns the result to the original caller.

## 4. Core Components

*   **`dev/src/plugin.ts`:** The Vite plugin responsible for discovering `.telephone.ts` files, generating client stubs, and creating the `functionMap`.
*   **`prod/src/index.ts`:** Contains server-side runtime utilities:
    *   `handleRoute`: Processes incoming RPC requests.
    *   `getContext`, `getContextOrNull`, `withContext`: For accessing server-side context within RPC functions.
*   **`prod/src/client.ts`:** Contains the client-side `makeRpcCall` function that initiates the `fetch` request to the server.
*   **`.telephone.ts` files:** User-defined files (e.g., `src/lib/tele/*.telephone.ts`) where server-side RPC functions are implemented.
*   **`src/routes/_telephone/+server.ts`:** A user-created SvelteKit endpoint that uses `handleRoute` to process RPC calls.
*   **`src/lib/client/_vite-sveltekit-telephone/index.ts`:** Auto-generated file containing the `functionMap` which maps file paths to their corresponding server-side modules.

## 5. Key Concepts

*   **Code Transformation:** During the client build, the content of `.telephone.ts` files is replaced by client-side stubs. The original server-side logic remains intact for server-side execution.
*   **Function Mapping (`functionMap`):** A central registry created at build time that allows the server-side request handler to dynamically locate and call the correct RPC function based on identifiers sent from the client.
*   **Context Propagation:** A mechanism using `AsyncLocalStorage` to allow server-side context (like request-specific data such as cookies) to be accessible within the execution scope of an RPC function, even though the function call originates from a generic handler.

## 6. Usage

Installation and usage instructions are detailed in the main `README.md` file. In summary:

1.  Install `vite-plugin-sveltekit-telephone-dev` as a dev dependency and `vite-plugin-sveltekit-telephone-prod` as a regular dependency.
2.  Add the dev plugin to `vite.config.ts`.
3.  Define RPC functions in files ending with `.telephone.ts` (e.g., `src/lib/tele/example.telephone.ts`).
4.  Create a SvelteKit route handler at `src/routes/_telephone/+server.ts` using `handleRoute` and the generated `functionMap`.
5.  Call the RPC functions from client-side or server-side SvelteKit code.
6.  Optionally, define a context type by augmenting the `Telephone.Context` interface in `src/types/TelephoneContext.d.ts`.

## 7. Future Considerations/Limitations

As noted in the project's `README.md`:

*   **Runtime Shield for Arguments:** Input validation/sanitization for RPC arguments is a potential area for future development (see issue #1).
*   **TypeScript Only:** Currently, the plugin is designed for TypeScript projects and does not support JavaScript-only projects.
*   **Scope:** The plugin is focused on SvelteKit with `adapter-node` and does not aim to be a universal RPC solution for all frameworks.
*   **Battle-Tested:** The plugin is relatively new and has not been extensively battle-tested in large-scale production environments.
