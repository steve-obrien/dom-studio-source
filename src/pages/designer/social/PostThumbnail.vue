<script setup>
import { computed, ref, watch } from 'vue';
import { escapeHtml } from '../poster/posterModel.js';

/**
 * A scaled, read-only rendering of a post's HTML, for format previews and
 * saved templates. It draws in a sandboxed frame with scripts off, so markup
 * from a saved template can never run.
 *
 * The frame loads once (fonts and base styles); later markup is written into
 * its body, so previews follow a drag frame by frame without reloading and
 * flashing. `allow-same-origin` lets this component write the body; scripts
 * stay off because `allow-scripts` is not granted.
 */
const props = defineProps({
	markup: { type: String, required: true },
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	fonts: { type: Array, default: () => [] },
	/** Height the thumbnail is drawn at. */
	size: { type: Number, default: 120 },
});
const frame = ref(null);
const scale = computed(() => props.size / props.height);
const shell = computed(() => `<!doctype html><html><head><meta charset="utf-8">${props.fonts.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('')}<style>html,body{margin:0;overflow:hidden}*{box-sizing:border-box}body>*{transform:scale(var(--scale,1));transform-origin:0 0}</style></head><body></body></html>`);

/**
 * Brings `target`'s children in line with `source`'s, keeping every node
 * whose tag still matches, so a moved layer only changes its style and an
 * image is never re-created (no flicker while it decodes).
 */
function morph(target, source) {
	const before = [...target.childNodes];
	const after = [...source.childNodes];
	after.forEach((next, index) => {
		const current = before[index];
		if (!current) target.appendChild(next);
		else if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) target.replaceChild(next, current);
		else if (current.nodeType !== 1) { if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue; }
		else {
			for (const { name } of [...current.attributes]) if (!next.hasAttribute(name)) current.removeAttribute(name);
			for (const { name, value } of next.attributes) if (current.getAttribute(name) !== value) current.setAttribute(name, value);
			morph(current, next);
		}
	});
	before.slice(after.length).forEach((node) => node.remove());
}

let painted = null;
function paint(reloaded = false) {
	const doc = frame.value?.contentDocument;
	if (!doc?.body) return;
	if (reloaded) painted = null;
	doc.documentElement.style.setProperty('--scale', String(scale.value));
	if (painted === props.markup) return;
	const template = doc.createElement('template');
	template.innerHTML = props.markup;
	morph(doc.body, template.content);
	painted = props.markup;
}
watch(() => [props.markup, scale.value], () => paint(), { flush: 'post' });
</script>

<template>
	<iframe ref="frame" :srcdoc="shell" sandbox="allow-same-origin" tabindex="-1" aria-hidden="true" class="pointer-events-none block rounded-sm border-0 bg-secondary shadow-sm" :style="{ width: `${Math.round(width * scale)}px`, height: `${size}px` }" @load="paint(true)"></iframe>
</template>
