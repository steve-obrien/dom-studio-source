# Agent Instructions

Use tabs for indentation in code, examples, and structured snippets.

## First Read

At the start of a coding task, read these files before editing:

- `README.md` for the public product/package overview.
- `memory.md` for the project-manager context and current architecture notes.
- `SKILL.md` for DOM Studio-specific UI generation guidance.
- `package.json` for scripts, exports, package scope, and dependencies.

If a task touches a focused area, inspect the local examples beside it before making changes.

## Project Shape

DOM Studio is a source-owned Vue 3 and web component interface system for application UI. It is both:

- A documentation/demo site served through a custom SSR framework called Now.
- A package surface exported as `@getdom/studio`, `@getdom/studio/vue`, `@getdom/studio/headless`, and `@getdom/studio/style.css`.

The app uses Vite, Vue Router, Pinia, Tailwind CSS v4, Express, Knex, MySQL, Stripe, and an OpenAI-backed theme endpoint.

## Key Paths

- `src/pages/components`, `src/pages/forms`, `src/pages/mobile`, and `src/pages/visual` contain auto-discovered Vue primitives.
- `src/pages/lib/vue/index.js` is the public Vue export contract.
- `src/pages/lib/headless` contains framework-neutral custom element primitives registered by `@getdom/studio/headless`.
- `src/pages/blocks` contains repository-local block pages and examples. Nested folders are canonical routes.
- `src/pages/_layout` contains the docs shell, generated component pages, inspector, examples, playgrounds, and navigation helpers.
- `src/routes.js` wires manual routes, file-based page routes, generated component routes, legacy redirects, and paywall entitlement metadata.
- `packages/now` contains the local SSR/API framework used by the root app.
- `server/api`, `server/lib`, and `server/db/migrations` contain API routes, auth/billing/theme/blog helpers, and MySQL migrations.
- `public/llms.txt`, `SKILL.md`, and `public/skills.sh` are agent-facing context assets shipped with the package.

## Implementation Rules

- Prefer existing DOM Studio components, blocks, headless primitives, theme tokens, and docs helpers before inventing custom UI.
- Keep changes close to the requested area. This repo often has many active local edits, so do not revert unrelated files.
- Preserve public package contracts. If you add or remove a public Vue or headless export, update `src/pages/lib/vue/index.js` or `src/pages/lib/headless/index.js` and run `npm run types:generate`.
- Use semantic theme classes and CSS variables from `src/style.css`; avoid hard-coded raw colors unless defining or extending a theme token.
- Keep docs pages inside `DomStudioLayout`, `DocPage`, and `DocSection` unless the surrounding section uses a different established pattern.
- Component docs should prefer `defineOptions({ __doc: ... })` plus prop `_edit` metadata where useful.
- Blocks should include an `Index.vue`, at least one realistic `examples/*.vue` file, and `block.meta.js` when they should appear well in navigation.
- API routes live under `server/api` and use filename conventions such as `checkout.get.js`, `[slug].get.js`, or `webhook.post.js`. Use `export const config = { body: 'raw' }` for Stripe-style signature verification.
- Never commit secrets. Use `.env.example` for shape only.

## Validation

Choose the smallest validation that matches the change:

- `npm run dev` starts the SSR dev server, usually on `http://localhost:3333`.
- `npm run dev:screenshot` starts a stable browser-automation target on `http://127.0.0.1:3342`.
- `npm run build` validates the client build, SSR build, and SEO file generation.
- `npm run types:generate` regenerates public declarations after export/API surface changes.
- `npm run check:form-definition` validates form-definition helpers.
- `npm run now:test` runs tests for `packages/now`.
- `npm run check:theme-ai` only makes sense when the theme AI endpoint and credentials are reachable.

When making frontend changes, verify the affected route in a browser at desktop and mobile sizes when practical.
