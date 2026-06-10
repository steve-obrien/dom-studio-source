# Block Discovery Convention

Blocks are auto-discovered from one folder level below `src/pages/blocks`.

Required:

```text
src/pages/blocks/{block-slug}/Index.vue
```

The display name is always derived from `{block-slug}`. Do not declare a separate name.

Optional metadata:

```js
export default {
	category: 'App Shells',
	categoryDescription: 'Optional override for the category summary shown in the block index.',
	categoryOrder: 10,
	order: 10,
	tag: 'New',
	summary: 'A short plain-language description of the block.',
	icon: 'M4 5h16v14H4V5Zm5 0v14M12 9h5M12 13h4',
};
```

Generation AI instructions:

- Create `src/pages/blocks/{block-slug}/Index.vue`.
- Put runnable examples in `src/pages/blocks/{block-slug}/examples/*.vue`.
- Add `block.meta.js` next to `Index.vue` only when you need custom metadata such as `category`, `summary`, `tag`, `icon`, or ordering.
- Add `categoryDescription` only when the default category copy needs a more specific explanation for that block family.
- Use the folder slug as the only source of the block name.
- Declare `icon` as SVG path data for a `24x24` viewBox, drawn with strokes, no fill, and no outer `<svg>` wrapper.
- Keep the icon visually simple enough to render at `16px`.
- Use an existing category when it fits, or introduce a new stable category with `categoryOrder`.
- Keep `summary` to one sentence.
