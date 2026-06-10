# DOM Studio

DOM Studio is a source-owned interface system for building application UI with humans and LLMs working from the same component contract.

It includes:

- Vue components exported from `@getdom/studio/vue`.
- Framework-neutral custom elements registered from `@getdom/studio/headless`.
- Source-owned blocks in `src/pages/blocks` for common app screens such as dashboards, chat, mail, forms, login, and mobile shells.
- Studio metadata, examples, prop docs, and `llms.txt` so generated apps stay inspectable and editable.

## Usage

```js
import { DomButton, DomCard, DomForm, DomTextInput } from '@getdom/studio/vue';
import '@getdom/studio/headless';
import '@getdom/studio/style.css';
```

Headless primitives use the `dom-*` custom element prefix:

```html
<dom-dialog>
	<button slot="trigger">Open</button>
	<form method="dialog">...</form>
</dom-dialog>
```

The published package exports the Vue layer, headless primitives, styles, and AI context files. Block implementations remain in the source tree for direct reuse and adaptation rather than as a versioned import surface.

## LLMs

Point agents at [`public/llms.txt`](public/llms.txt), install the local [`SKILL.md`](SKILL.md) instructions, or use [`public/skills.sh`](public/skills.sh) when you want them to prefer DOM Studio primitives, blocks, theme tokens, and Studio specs.

When consuming the published package, those agent context files are available at `@getdom/studio/llms.txt`, `@getdom/studio/skill`, and `@getdom/studio/skills.sh`.

## Commercial Model

This project is configured as `UNLICENSED` by default. That keeps the door open for selling full source access or issuing a commercial source license without accidentally granting open-source rights.

## Development

```sh
npm install
npm run dev
npm run build
npm run preview
```

The reusable SSR/backend framework prototype lives in `packages/now`.

```sh
npm run check:form-definition
npm run check:theme-ai
npm run now:test
```

Use `npm run check:form-definition` for the fastest structural validation of the form-definition helpers and `npm run now:test` for the reusable SSR/runtime package tests.

Use `npm run check:theme-ai` only when the theme AI endpoint is reachable. By default it posts to `http://127.0.0.1:3333/api/ai/theme`, or you can override that with `THEME_AI_ENDPOINT` and `THEME_AI_PUBLIC_TOKEN`.

The root app is served by Now through `server.js`; `npm run dev`, `npm run build`, and `npm run preview` all use that SSR path.

The public site is configured for `https://getdom.studio`.
