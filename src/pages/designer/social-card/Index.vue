<script setup>
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { DomButton, DomTextareaInput, DomNumberInput, DomDesignerLayers, DomDesignerStage, DomShadowEditor, DomColorSwatch } from '../../lib/vue';
import { shadowListToCss } from '../shadow-editor/shadowModel.js';

const selected = ref('headline');
const positioning = ref(true);
const notice = ref('');
const layers = ref([
	{ id: 'brand', label: 'Brand', tag: 'p', text: 'DOM STUDIO / FIELD NOTES', style: { position: 'absolute', left: '40px', top: '36px', width: '280px', fontSize: '12px', letterSpacing: '0.14em' }, shadows: [] },
	{ id: 'headline', label: 'Headline', tag: 'h2', text: 'Small ideas.\nWorth sharing.', style: { position: 'absolute', left: '40px', top: '100px', width: '480px', fontSize: '52px', fontWeight: '750', lineHeight: '1.05' }, shadows: [] },
	{ id: 'caption', label: 'Caption', tag: 'p', text: 'Made with real HTML. Ready for your next idea.', style: { position: 'absolute', left: '40px', top: '270px', width: '480px', fontSize: '16px' }, shadows: [] },
]);
const active = computed(() => layers.value.find((layer) => layer.id === selected.value));
const tree = computed(() => [{ id: 'card', label: 'Social card · 600 × 360', open: true, children: layers.value.map(({ id, label }) => ({ id, label })) }]);
const background = ref('var(--secondary)');
const stageStyle = computed(() => ({ width: '600px', height: '360px', position: 'relative', overflow: 'hidden', background: background.value, color: 'var(--canvas-fg)', fontFamily: 'sans-serif' }));

/** Applies a stage gesture to the same model used by the HTML and property editor. */
function patch({ id, style }) {
	const layer = layers.value.find((item) => item.id === id);
	if (layer) Object.assign(layer.style, style);
}
/** Escapes model text and attribute values before generating copyable HTML. */
function escape(value) {
	return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
/** Serializes camel-case Vue style objects as ordinary CSS declarations. */
function css(style) {
	return Object.entries(style).map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`).join('; ');
}
/** Returns the rendered layer style, including independently editable shadow layers. */
function layerStyle(layer) {
	return { margin: '0px', whiteSpace: 'pre-wrap', ...layer.style, boxShadow: shadowListToCss(layer.shadows) };
}
const sourceLines = computed(() => [
	{ id: 'card', text: `<article style="${escape(css(stageStyle.value))}">` },
	...layers.value.map((layer) => ({ id: layer.id, text: `\t<${layer.tag} style="${escape(css(layerStyle(layer)))}">${escape(layer.text)}</${layer.tag}>` })),
	{ id: 'card', text: '</article>' },
]);
/** Copies HTML with resolved theme variables so it can be used outside the demo. */
async function copyHtml() {
	try {
		const theme = getComputedStyle(document.documentElement);
		const html = sourceLines.value.map((line) => line.text).join('\n').replace(/var\((--[\w-]+)\)/g, (match, key) => theme.getPropertyValue(key).trim() || match);
		await navigator.clipboard.writeText(html);
		notice.value = 'HTML copied';
	} catch { notice.value = 'Clipboard unavailable. Select and copy the HTML below.'; }
}
</script>

<template>
	<main class="min-h-dvh bg-canvas text-canvas-fg">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
			<div class="flex flex-wrap items-center gap-3"><RouterLink to="/designer" class="text-sm text-muted-fg">← UI designer</RouterLink><RouterLink to="/designer/assembly#social-card" class="text-sm text-primary underline underline-offset-4">Assembly guide</RouterLink><h1 class="font-semibold">Social card</h1><span class="rounded bg-primary/10 px-2 py-1 text-xs text-primary">Beta</span></div>
			<div class="flex items-center gap-3"><label class="flex items-center gap-2 text-sm"><input v-model="positioning" type="checkbox" />Move &amp; resize</label><DomButton size="sm" @click="copyHtml">Copy HTML</DomButton></div>
		</header>
		<p class="border-b border-border px-5 py-2 text-xs text-muted-fg">Select a layer, the HTML, or an element on the stage. Drag the selection box; use its corner to resize. Changes stay in this page until copied. <span role="status">{{ notice }}</span></p>
		<div class="grid lg:min-h-[620px] lg:grid-cols-[210px_minmax(0,1fr)_290px]">
			<aside class="border-b border-border p-4 lg:border-r"><h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">Layers</h2><DomDesignerLayers v-model="selected" :items="tree" /></aside>
			<section class="min-w-0 overflow-auto bg-secondary/40 p-6 sm:p-10" aria-label="Design workspace">
				<div class="mb-3 flex justify-between text-xs text-muted-fg"><span>HTML stage</span><span>600 × 360</span></div>
				<DomDesignerStage v-model="selected" :positioning="positioning && selected !== 'card'" class="w-[600px] shadow-lg" @style-change="patch">
					<article data-designer-id="card" :style="stageStyle">
						<component :is="layer.tag" v-for="layer in layers" :key="layer.id" :data-designer-id="layer.id" :style="layerStyle(layer)">{{ layer.text }}</component>
					</article>
				</DomDesignerStage>
			</section>
			<aside class="space-y-5 border-t border-border p-4 lg:border-l lg:border-t-0" aria-label="Layer properties">
				<h2 class="font-semibold">{{ active?.label || 'Social card' }}</h2>
				<template v-if="active">
					<DomTextareaInput v-model="active.text" label="Text" :rows="3" />
					<DomColorSwatch :model-value="active.style.color || 'var(--canvas-fg)'" label="Text colour" @update:model-value="active.style.color = $event" />
					<div class="grid grid-cols-2 gap-3"><DomNumberInput v-for="key in ['left', 'top', 'width', 'fontSize']" :key="key" :label="({ left: 'X', top: 'Y', width: 'Width', fontSize: 'Font size' })[key]" :model-value="parseFloat(active.style[key]) || 0" @update:model-value="active.style[key] = `${$event}px`" /></div>
					<DomShadowEditor v-model="active.shadows" />
				</template>
				<DomColorSwatch v-else v-model="background" label="Background" />
				<p class="text-xs leading-5 text-muted-fg">Arrow keys on the selection move by 1px. Shift moves by 10px. Alt + arrows resize. Disabling movement keeps click selection available.</p>
			</aside>
		</div>
		<section class="border-t border-border p-5"><h2 class="mb-3 text-sm font-semibold">Linked HTML <span class="font-normal text-muted-fg">· select a line to inspect its layer</span></h2><div class="overflow-auto rounded-lg bg-secondary p-3"><button v-for="(line, index) in sourceLines" :key="index" type="button" class="block w-full whitespace-pre text-left font-mono text-xs leading-6" :class="selected === line.id && 'bg-primary/10 text-primary'" :aria-pressed="selected === line.id" @click="selected = line.id">{{ line.text }}</button></div></section>
	</main>
</template>
