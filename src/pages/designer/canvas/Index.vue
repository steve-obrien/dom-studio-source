<script setup>
import { RouterLink } from 'vue-router';
import { componentRegistry, lookupByName } from '../../_layout/inspector/componentRegistry.js';
import DomDesigner from '../core/DesignerWorkspace.vue';
import { createFileStorage } from '../core/storage.js';

/**
 * Canvas: the site's full-screen DOM designer.
 *
 * The designer itself is `DomDesigner`, the same component the package
 * exports. This page gives it every DOM Studio component, the dev server's
 * project files, and on-demand Tailwind from the template editor endpoint.
 */

const catalog = { entries: componentRegistry, lookupByName };
// The dev server answers on this endpoint; on the published site listing fails and the file controls stay hidden.
const fileStorage = createFileStorage();

/** Compiles the Tailwind classes used by the workspace's files. */
async function compileCss(content) {
	const response = await fetch('/api/experiments/template-editor/tailwind.css', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });
	if (!response.ok) throw new Error('On-demand Tailwind is unavailable.');
	return response.text();
}
</script>

<template>
	<main class="min-h-dvh lg:h-dvh">
		<DomDesigner :catalog="catalog" :file-storage="fileStorage" :compile-css="compileCss" :legacy-storage-keys="['dom-studio-canvas-v1']" badge="Beta">
			<template #start>
				<RouterLink to="/designer" class="text-xs text-muted-fg hover:text-primary">← Designer</RouterLink>
			</template>
		</DomDesigner>
	</main>
</template>
