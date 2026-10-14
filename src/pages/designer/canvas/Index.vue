<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { componentRegistry, lookupByName } from '../../_layout/inspector/componentRegistry.js';
import DomDesigner from '../core/DesignerWorkspace.vue';
import DomMonacoCodeView from '../core/MonacoCodeView.vue';
import { createFileStorage } from '../core/storage.js';

/**
 * Canvas: the site's full-screen DOM designer.
 *
 * The designer itself is `DomDesigner`, the same component the package
 * exports. This page gives it every DOM Studio component, the dev server's
 * project files, on-demand Tailwind from the template editor endpoint, and
 * Monaco as an optional code editor.
 */

const catalog = { entries: componentRegistry, lookupByName };
// The dev server answers on this endpoint; on the published site listing fails and the file controls stay hidden.
const fileStorage = createFileStorage();
const monacoKey = 'dom-studio-canvas-monaco';
const monaco = ref(false);

onMounted(() => {
	try { monaco.value = localStorage.getItem(monacoKey) === '1'; } catch { /* storage unavailable */ }
});
watch(monaco, (value) => {
	try { localStorage.setItem(monacoKey, value ? '1' : '0'); } catch { /* storage unavailable */ }
});

/** Compiles the Tailwind classes used by the workspace's files. */
async function compileCss(content) {
	const response = await fetch('/api/experiments/template-editor/tailwind.css', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) });
	if (!response.ok) throw new Error('On-demand Tailwind is unavailable.');
	return response.text();
}

/** Loads Monaco from the site's own install, with its CSS and editor worker. */
async function loadMonaco() {
	const [, api, worker] = await Promise.all([
		import('monaco-editor/min/vs/editor/editor.main.css'),
		import('monaco-editor/esm/vs/editor/editor.api'),
		import('monaco-editor/esm/vs/editor/editor.worker?worker'),
	]);
	if (!window.MonacoEnvironment) window.MonacoEnvironment = { getWorker: () => new worker.default() };
	return api;
}
</script>

<template>
	<main class="min-h-dvh lg:h-dvh">
		<DomDesigner :catalog="catalog" :file-storage="fileStorage" :compile-css="compileCss" :legacy-storage-keys="['dom-studio-canvas-v1']" :code-editor="monaco ? DomMonacoCodeView : null" :code-editor-props="{ load: loadMonaco }" badge="Beta">
			<template #start>
				<RouterLink to="/designer" class="text-xs text-muted-fg hover:text-primary">← Designer</RouterLink>
			</template>
			<template #end>
				<label class="mr-1 hidden items-center gap-2 text-xs text-muted-fg md:flex" title="Use the Monaco editor in the code view"><input v-model="monaco" type="checkbox">Monaco</label>
			</template>
		</DomDesigner>
	</main>
</template>
