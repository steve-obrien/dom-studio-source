<script setup>
import { computed } from 'vue';
import { escapeHtml } from '../poster/posterModel.js';

/**
 * A scaled, read-only rendering of a post's HTML, for format previews and
 * saved templates. It draws in a sandboxed frame with scripts off, so markup
 * from a saved template can never run.
 */
const props = defineProps({
	markup: { type: String, required: true },
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	fonts: { type: Array, default: () => [] },
	/** Height the thumbnail is drawn at. */
	size: { type: Number, default: 120 },
});
const scale = computed(() => props.size / props.height);
const document = computed(() => `<!doctype html><html><head><meta charset="utf-8">${props.fonts.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('')}<style>html,body{margin:0;overflow:hidden}*{box-sizing:border-box}body>*{transform:scale(${scale.value});transform-origin:0 0}</style></head><body>${props.markup}</body></html>`);
</script>

<template>
	<iframe :srcdoc="document" sandbox="" loading="lazy" tabindex="-1" aria-hidden="true" class="pointer-events-none block rounded-sm border-0 bg-secondary shadow-sm" :style="{ width: `${Math.round(width * scale)}px`, height: `${size}px` }"></iframe>
</template>
