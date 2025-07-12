## vite-plugin-sveltekit-telephone

This is a simple RPC provider for `Sveltekit` + `adapter-node`, inspired by `telefunc`.

Disclaimer: It has only been tested and used with `vite-plugin-svelte: 3.x`

## Why?
We found `telefunc` to be magical and [hence brittle at times](https://github.com/brillout/vite-plugin-server-entry/issues/21). This plugin intends to be more simple and straightforward.

### Pros
- Simple, reliable design
- Separation into dev and production plugins helps with fast build times and low dependency creep

### Cons
- Not battle tested yet
- Only supports typescript, not javascript
- Doesn't intend to cover all use-cases, frameworks
- Runtime Shield for arguments is TBD. See issue [#1](https://github.com/LiMium/vite-plugin-sveltekit-telephone/issues/1)

## Usage

Usage is very similar to `telefunc`.  See the `examples/` directory for a complete project setup.

### Install
```shell
# To install the dev time utilities
npm install --save-dev vite-plugin-sveltekit-telephone-dev

# To install the production time utilities
npm install --save vite-plugin-sveltekit-telephone-prod
```

### Add the plugin to vite.config.ts

```typescript
import { telephoneDev } from 'vite-plugin-sveltekit-telephone-dev';

export default defineConfig({
	plugins: [sveltekit(), telephoneDev.plugin()]
});

```

### Define RPCs
Define remotely callable functions in any file with `telephone.ts` extension. Recommeded location is `src/lib/tele/*.telephone.ts`.

### Define a route handler for `/_telephone`

```typescript
// src/routes/_telephone/+server.ts
import { json, type RequestHandler, error as skError } from '@sveltejs/kit'

import { functionMap } from '$lib/client/_vite-sveltekit-telephone'
import { handleRoute } from 'vite-plugin-sveltekit-telephone-prod';

const GET: RequestHandler = async (event) => {
  const cookies = event.cookies;
  const response = await handleRoute(functionMap, {
    url: event.request.url,
    method: event.request.method,
    body: await event.request.json(),
    context: {
      cookies,
    },
  })
  return json(response);
}

export { GET, GET as POST }
```

### Call RPCs

When the RPC functions are called on the client side, they are automatically proxied through the `/_telephone` route.
Use `getContext()` to get the context that you can inject via the hanlder for `/_telephone` route.

When the RPC functions are called on the server side, they are processed as direct function calls.
`getContext()` will throw an exception in this case. Use `getContextOrNull()`, which returns null instead of throwing an exception.
Else, use `withContext(context, fn)` to inject the given context before calling `fn`.

### Define the context type (optional)

```typescript
/// src/types/TelephoneContext.d.ts
import type { Cookies } from '@sveltejs/kit'
 
declare module 'telephone' {
  namespace Telephone {
    interface Context {
      cookies: Cookies
    }
  }
}
```