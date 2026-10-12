# DOM Studio Project Memory

This file is a fast orientation for new agent conversations. Treat it as project-manager context, not immutable law. If code and this file disagree, trust the code and update this file when the difference matters.

## Snapshot

DOM Studio is a complete Vue and Web Component UI system you can own, edit, and ship with humans and LLMs working from the same component contract. It is part design-system documentation site, part commercial source package, part library of copyable product blocks, and part agent context bundle.

The public package is `@getdom/studio`. It exports Vue components from `src/pages/lib/vue/index.js`, framework-neutral custom elements from `src/pages/lib/headless/index.js`, styles from `src/style.css`, and agent context files from `public/llms.txt`, `SKILL.md`, and `public/skills.sh`.

Inventory from this review:

- 65 auto-discovered Vue primitives across components, data, forms, mobile, and visual.
- 73 block pages under `src/pages/blocks`.
- 77 block example files.
- 21 headless library modules.
- 11 API route files.
- 3 MySQL/Knex migrations.
- 3 tests for the reusable Now package.

## Product Direction

The core promise is inspectable, editable application UI that teams can own and ship. DOM Studio should feel useful to a developer building SaaS/product interfaces, not like a marketing theme kit. The repo leans toward dense, practical app surfaces: dashboards, settings, operations consoles, billing, communication, data capture, AI tooling, mobile shells, and product-management workflows.

The header is organised around what customers pay for, AG Grid style: Data Grid, Scheduler (week planner, month calendar, Gantt, resource scheduler), Designer, Charts and AI. Blocks, other data components and simple primitives sit under the header's Library menu. `src/pages/_layout/siteNavigation.js` owns the header; `sideNavLinks.js` orders the sidebar to match. The DOM designer roadmap (Canvas at `/designer/canvas`, Vue SFC round-trip, live components) is in `docs/dom-designer.md`.

When adding UI, prefer real product workflows, concrete data, accessible controls, and copyable source examples. Avoid generic hero pages or decorative-only composition unless the task explicitly asks for a landing/marketing page.

## Architecture

The root app is server-rendered Vue 3 through the local `packages/now` framework.

- `server.js` imports `now.config.js` and starts `createNowServer`.
- `packages/now/src/framework/server/createNowServer.js` mounts request context, API routes, Vite middleware in development, static assets and compression in production, and SSR rendering for pages.
- `src/main.js` creates the Vue app through `createNowApp`, installs router behavior, applies theme mode, and guards entitlement-gated routes.
- `src/entry-server.js` performs SSR, hydrates auth and billing offer payloads, handles paywall redirects, applies route head metadata, and sets 404 status.
- `src/routes.js` combines manual routes, file-based `Index.vue` routes, generated component routes, block legacy redirects, moved component-section redirects, docs redirects, and the catch-all 404.

Default local server configuration is in `now.config.js`: host `0.0.0.0`, port `3333`, API prefix `/api`, API directory `server/api`, SSR template `index.html`.

## Routing And Discovery

Most pages are discovered from `src/pages/**/Index.vue`. Some pages are manually imported in `src/routes.js`, including home, auth, paywall, blog article, floating guidance, and block preview routes.

Component docs are generated from `Dom*.vue` files under:

- `src/pages/components/*/Dom*.vue`
- `src/pages/data/*/Dom*.vue`
- `src/pages/dev/*/Dom*.vue`
- `src/pages/forms/*/Dom*.vue`
- `src/pages/mobile/*/Dom*.vue`
- `src/pages/visual/*/Dom*.vue`

`src/pages/_layout/componentManager.js` turns these files into component records and routes. Forms, data, and dev components also get redirects from `/components/:slug` to their current section route.

Blocks are discovered by `src/pages/blocks/blockRegistry.js` from `Index.vue` files under `src/pages/blocks`. The nested folder path is the canonical route, for example:

```text
src/pages/blocks/operations/scheduling/resource-scheduler/Index.vue
/blocks/operations/scheduling/resource-scheduler
```

Legacy flat block URLs such as `/blocks/resource-scheduler` redirect to the nested route. Add `block.meta.js` beside a block to control category, summary, icon, ordering, and tags.

## UI Conventions

Use DOM Studio primitives first:

- Actions: `DomButton`, `DomIconButton`, `DomToolbar`.
- Overlays and menus: `DomDialog`, `DomDrawer`, `DomPopover`, `DomDropdown`, `DomMenu`, `DomContextMenu`, `DomCommandPalette`.
- Structure: `DomTabs`, `DomAccordion`, `DomTreeView`, `DomScrollMenu`, `DomSplitterPanel`, `DomBreadcrumbs`, `DomStepper`, `DomDataGrid`, `DomFilterBar`, `DomActivityTimeline`.
- Scheduling: `DomMonthCalendar` for date-led month views and `DomWeekPlanner` for fixed-width day swim lanes, precise time rows, configurable app-owned drag-to-create ranges, a live current-time line, and virtualized horizontal ranges.
- Feedback: `DomToastStack`, `DomToastItem`, `useToasts`, `DomBadge`, `DomStatusPill`, `DomEmptyState`.
- Forms: `DomForm`, `DomField`, `DomTextInput`, `DomTextareaInput`, `DomTextareaComposer`, `DomSelect`, `DomNativeSelect`, `DomCombobox`, `DomAutocomplete`, `DomTagCombobox`, `DomCheckbox`, `DomRadioGroup`, `DomToggle`, `DomDatePicker`, `DomDateTimePicker`, `DomTimeSelector`, `DomCalendar`, `DomJsonInput`, `DomJsonListInput`, `DomCodeInput`.
- Mobile: `DomAppShell`, `DomAppTopBar`, `DomAppBottomNav`, `DomAppListItem`, `DomActionSheet`, `DomSafeArea`.

Docs pages normally use:

- `DomStudioLayout` for the site frame.
- `DocPage` for page title, tagline, tag, and eyebrow.
- `DocSection` for content sections.
- `Example` for copyable block/component examples, usually with `?raw` source and iframe presentation when isolation helps.
- `Playground`, `ComponentProps`, `ComponentSlots`, `ComponentEvents`, `ComponentKeyboard`, and `HeadlessAttributes` for generated component docs.

Component source commonly uses `defineOptions({ __doc: ... })` and prop `_edit` metadata so the docs/inspector can explain and edit props.

## Styling And Theme

`src/style.css` is the source of global styling, Tailwind v4 theme tokens, light/dark variables, shadow/radius values, and skin utilities.

DOM Studio components are Tailwind-first. Put ordinary layout, spacing, typography, color, border, state, responsive, and transition styling directly in Vue templates as Tailwind CSS v4 utilities. Use scoped CSS only when it expresses an intrinsic component behavior or keeps genuinely complex CSS clearer, such as coordinated container queries, selector relationships, pseudo-elements, or keyframes. Do not introduce BEM class trees solely to attach presentational styles.

Prefer semantic tokens and skin utilities:

- `canvas`, `canvas-fg`, `primary`, `primary-fg`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`.
- `skin-card`, `skin-popover`, `skin-overlay`, `skin-control`, `skin-action`, and `skin-input`.

Preserve dark-mode behavior through `[data-theme="dark"]`. Avoid one-off raw colors, large decorative gradients, and styles that cannot be themed later.

## Server, Auth, Billing, And Data

API routes are auto-discovered from `server/api`. Method suffixes map to HTTP verbs, and bracket segments map to route params:

- `server/api/billing/checkout.get.js` => `GET /api/billing/checkout`
- `server/api/blog/articles/[slug].get.js` => `GET /api/blog/articles/:slug`
- `server/api/stripe/webhook.post.js` => `POST /api/stripe/webhook`

Auth uses a signed `dom_studio_session` cookie in `server/lib/auth.js`. Billing uses Stripe payment links and webhook fulfillment. Database access is MySQL through Knex, configured in `knexfile.js`, with migrations in `server/db/migrations`.

Be careful around:

- `AUTH_SECRET`, access codes, and session cookies.
- Stripe webhook raw body handling and signature verification.
- Payment entitlement updates in `server/lib/users.js`.
- OpenAI theme generation keys and allowed origins in `server/lib/themeAi.js`.
- Database migrations, because they affect commercial access, auth, blog content, and payment state.

## Experiments

The repo contains active public experiments under `src/pages/experiments`, including a CSS button creator, a template editor, and liquid-glass surfaces. Treat experiments as product research surfaces that may still be messy, but do not casually break them because they are useful previews of the system's direction.

## Validation Matrix

Use the narrowest validation that proves the change:

- Docs/content-only: inspect the rendered route when practical; no full build is always required.
- Component or block UI: `npm run dev` or `npm run dev:screenshot`, then browser-check the changed route at desktop and mobile sizes.
- Public Vue/headless exports: `npm run types:generate` and usually `npm run build`.
- Form schema or validator changes: `npm run check:form-definition`.
- Now framework changes: `npm run now:test`, then a root app smoke test.
- Server/API/auth/billing changes: targeted route/API checks plus `npm run build` when SSR behavior might be affected.
- Theme AI endpoint changes: `npm run check:theme-ai` only when endpoint and credentials are reachable.

## Current Risks And Manager Notes

- The working tree may contain many active user edits. Agents should inspect `git status --short` and never revert unrelated changes.
- The public package contract is source-file based, so moving files can accidentally change exports, routes, or published files.
- Blocks are route-addressable by folder path; category reorganization is possible, but legacy redirects should be preserved.
- Some app behavior depends on environment variables. `.env.example` is the contract; `.env` should stay private.
- The package is currently `UNLICENSED`, with commercial source licensing intended. Avoid adding open-source license language unless explicitly asked.
- There is no broad root test suite visible in this review; validation is a mix of build, focused scripts, Now tests, and browser QA.

## Good Starter Workflow

1. Read `AGENTS.md`, this file, `README.md`, `SKILL.md`, and the relevant local source files.
2. Check `git status --short` and treat unrelated changes as user-owned.
3. Identify whether the task affects public exports, routes, docs, API, database, or package files.
4. Reuse nearby examples and DOM Studio primitives before creating new patterns.
5. Make the smallest coherent change.
6. Run the focused validation command.
7. Report what changed, what was validated, and any remaining risk.
