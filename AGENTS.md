# Agent Instructions

Use tabs for indentation in code, examples, and structured snippets.
Add production-standard doc block comments for all functions.

## First Read

At the start of a coding task, read these files before editing:

- `README.md` for the public product/package overview.
- `memory.md` for the project-manager context and current architecture notes.
- `SKILL.md` for DOM Studio-specific UI generation guidance.
- `package.json` for scripts, exports, package scope, and dependencies.

If a task touches a focused area, inspect the local examples beside it before making changes.

## Project Shape

DOM Studio is a complete Vue 3 and web component interface system for application UI that teams can own, edit, and ship. It is both:

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
- Use Tailwind CSS v4 utilities directly in Vue templates for layout, spacing, typography, color, borders, states, responsive behavior, and transitions. DOM Studio component styling is Tailwind-first.
- Keep scoped CSS for behavior that is intrinsic to the component or would become materially harder to understand in utilities, such as complex selector relationships, container-query coordination, pseudo-elements, or keyframe animation. Do not add BEM class trees solely as styling hooks.
- Use semantic theme classes and CSS variables from `src/style.css`; avoid hard-coded raw colors unless defining or extending a theme token.
- Keep docs pages inside `DomStudioLayout`, `DocPage`, and `DocSection` unless the surrounding section uses a different established pattern.
- Component docs should prefer `defineOptions({ __doc: ... })` plus prop `_edit` metadata where useful.
- Document events, slots, template ref methods (`methods: [{ name, signature, description }]`) and keyboard keys in `__doc`; `npm run types:generate` turns them into typed listener props, a `<Name>Slots` and a `<Name>Exposed` interface. Public payload and option types are JSDoc `@typedef`s in the component, written with TypeScript types, and listed in `jsdocTypedefSources` in `scripts/generate-types.mjs`.
- Usage guides live beside the component as `<Name>.md` (see `src/pages/data/data-grid/DomDataGrid.md`). The docs page renders it with `ComponentGuide` from `import guide from './<Name>.md?guide'`, and `npm run package:build` ships it in `docs/components/<Name>.md` with a generated API reference. `<!-- example: File -->` embeds `examples/File.vue` live on the site and as a linked file in the package.
- Blocks should include an `Index.vue`, at least one realistic `examples/*.vue` file, and `block.meta.js` when they should appear well in navigation.
- API routes live under `server/api` and use filename conventions such as `checkout.get.js`, `[slug].get.js`, or `webhook.post.js`. Use `export const config = { body: 'raw' }` for Stripe-style signature verification.
- Never commit secrets. Use `.env.example` for shape only.

## Validation

Choose the smallest validation that matches the change:

- `npm run dev` starts the SSR dev server on `http://localhost:8100`.
- `npm run dev:screenshot` starts a stable browser-automation target on `http://localhost:8110`.
- `npm run build` validates the client build, SSR build, and SEO file generation.
- `npm run types:generate` regenerates public declarations after export/API surface changes.
- `npm run check:form-definition` validates form-definition helpers.
- `npm run now:test` runs tests for `packages/now`.
- `npm run check:theme-ai` only makes sense when the theme AI endpoint and credentials are reachable.

When making frontend changes, verify the affected route in a browser at desktop and mobile sizes when practical.

## Source distribution

This repository is a reviewed source distribution with independent Git history.
Preserve the commercial licence and the public package contracts. Use
`docs/local-development.md` for setup and `docs/releases.md` for package checks.

This checkout has no official website deployment or npm publication workflow.
Do not add production configuration, credentials, database exports, private
application history, internal work records, or self-hosted runner configuration.
Review and scan the complete intended source before sharing an update.

Use a dedicated, clearly named testing browser session. Do not take over a user's
existing browser tabs. Close task-owned test tabs, browser instances, and local
servers when verification finishes unless intentionally handed off for review.
