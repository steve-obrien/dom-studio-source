# DOM Studio

DOM Studio is a Vue 3 and Web Component interface system for application UI.

## Install

```sh
npm install @getdom/studio
```

For the quickest start, import the maintained Vue components and the complete
Tailwind CSS v4 stylesheet:

```js
import { DomButton, DomCard, DomForm } from '@getdom/studio';
import '@getdom/studio/style.css';
```

For a production app, let your own stylesheet run Tailwind and own the theme:

```css
@import "tailwindcss";
@import "@getdom/studio/tailwind.css";

:root {
	--canvas: #fff;
	--canvas-fg: oklch(0.145 0 0);
	--primary: oklch(0.205 0 0);
	--primary-fg: oklch(0.985 0 0);
	/* Add the remaining semantic theme values for your app. */
}
```

`tailwind.css` supplies DOM Studio's Tailwind sources, semantic utility mapping,
and intrinsic component styles without choosing the theme values. Copy
`theme.css` into your project when you want all of DOM Studio's defaults as a
starting point, then edit that local copy.

The explicit Vue entry point exports the same component surface:

```js
import { DomButton } from '@getdom/studio/vue';
```

Register the framework-neutral custom elements when required:

```js
import '@getdom/studio/headless';
```

## Peer dependencies

- Vue 3.5 or later.
- Tailwind CSS 4.2 or later configured in the consuming application.
- Vue Router 4.6 or later.
- Pinia 2.3 or 3.

## Licence

The package is publicly downloadable for local evaluation. A paid DOM Studio
licence is required for production, deployed, distributed, commercial, or
client use. See `LICENSE.md` in this package for the complete terms.

Documentation, examples, licences, and source access are available from
[getdom.studio](https://getdom.studio).
