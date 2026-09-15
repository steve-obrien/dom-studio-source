# Studio renderer data

Component metadata describes a reusable component. A saved Studio tree describes instances arranged into a layout.

The editor works with live component references. `src/pages/_layout/inspector/serialize.js` converts them to registry identifiers for persistence. Its `serializeTree()` output is the format accepted by `DomRenderer`:

```json
{
	"id": "email-field",
	"type": "dom-text-input",
	"props": {
		"label": "Email address",
		"placeholder": "you@example.com"
	}
}
```

| Field | Meaning |
| --- | --- |
| `id` | Stable node identifier. |
| `type` | Component registry identifier or an ordinary HTML tag. |
| `props` | Props for this component instance. |
| `children` | Optional array of serialized child nodes. |

Text nodes use `type: "html-text"` and a `text` field. Registry identifiers are derived from export names, unless overridden in Studio metadata; for example, `DomTextInput` becomes `dom-text-input`.

```vue
<script setup>
import { DomRenderer } from '@getdom/studio/vue';

const savedLayout = {
	id: 'email-field',
	type: 'dom-text-input',
	props: { label: 'Email address' },
};
</script>

<template>
	<DomRenderer :spec="savedLayout" />
</template>
```

The renderer resolves `type` through the component registry. A record with `component: "DomTextInput"` is not this serializer's format. Editor-only labels and schema hints are not included in `serializeTree()` output. The current renderer traverses `children` as default content; this format does not define named slots or application event-handler bindings.

Applications own storage and application behavior. See [component discovery and documentation](component-authoring.md) for the separate catalogue and metadata contracts.
