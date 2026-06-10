# Now

Now is the small SSR/server framework powering `getdom.studio`.

It provides:

- an Express server wrapper around Vite SSR
- file-based API route discovery from `server/api`
- Vue SSR rendering helpers
- optional page-glob to route conversion
- Pinia payload hydration
- request-scoped context and cache primitives
- runtime composables for head tags and async data

The host app owns its pages, Vue root component, route glob or route records, client/server entries, and build output. This keeps Now separable as a future package while allowing `getdom.studio` to use it directly today.

## Entry Points

- `packages/now/src/framework/server/createNowServer.js`
- `packages/now/src/framework/runtime/createNowApp.js`
- `packages/now/src/framework/runtime/router.js`
- `packages/now/src/composables/useAsyncData.js`
- `packages/now/src/composables/useHead.js`
- `packages/now/server/middleware/index.js`

## Test

```sh
npm --prefix packages/now test
```
