# DOM Studio source context

This development repository contains the Vue and Web Component system, copyable
blocks, examples, and the documentation application. The commercial terms in
`LICENSE.md` apply. Use the source files as the authority when notes differ.

Development now belongs in `steve-obrien/dom-studio-source`. Its imported history
was filtered before linking it to the reviewed source snapshot. Never merge
unfiltered history from the previous repository. See `docs/repository-migration.md`
for the operational cutover that remains separate from development.

## Architecture

- `src/pages` keeps components beside their examples and documentation.
- `src/pages/lib/vue/index.js` and `src/pages/lib/headless/index.js` define public exports.
- `src/pages/lib/designer/index.js` exports the beta designer surface.
- `src/pages/_layout` owns the documentation shell, inspector, and navigation.
- `src/routes.js` combines file-based routes, generated docs, and redirects.
- `packages/now` provides the Vue SSR and Express API runtime.
- `server/api` contains the app's endpoints; `server/lib/blockDemos` contains sample demo data.
- `src/style.css` defines the semantic theme tokens and shared styles.
- `packages/studio/package.template.json` defines the separately staged npm artifact.

## Working conventions

Read `README.md`, `AGENTS.md`, `SKILL.md`, and nearby examples before changes.
Use tabs, existing DOM Studio components, semantic theme utilities, and Tailwind
CSS v4. Document functions and public component contracts. Keep application
records, authorization, persistence, and external services owned by the host app.

Use `http://localhost:8100` for local development. See
`docs/local-development.md` for optional services and validation. No production
credentials, deployment workflows, private application history, or internal
work records are included in this distribution.
