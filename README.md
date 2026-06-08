# DOM Studio

DOM Studio is a source-owned interface system for building application UI with humans and LLMs working from the same component contract.

It includes:

- Vue components exported from `@getdom/studio/vue`.
- Framework-neutral custom elements registered from `@getdom/studio/headless`.
- Blocks for common app screens such as dashboards, chat, mail, forms, login, and mobile shells.
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

## LLMs

Point agents at [`public/llms.txt`](public/llms.txt) or install the local [`SKILL.md`](SKILL.md) instructions when you want them to prefer DOM Studio primitives, blocks, theme tokens, and Studio specs.

## Commercial Model

This project is configured as `UNLICENSED` by default. That keeps the door open for selling full source access or issuing a commercial source license without accidentally granting open-source rights.

## Development

```sh
npm install
npm run dev
npm run build
```

The reusable SSR/backend framework prototype lives in `packages/now`.

```sh
npm run now:test
```

The root app is served by Now through `server.js`; `npm run dev`, `npm run build`, and `npm run preview` all use that SSR path.

The public site is configured for `https://getdom.studio`.
