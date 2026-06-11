<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { highlight } from './shiki.js';
import { isExternalSourceHref, sourceHrefForPath } from './sourceLinks.js';

// The code half of an <Example> / <Playground>. Shows a toolbar with a copy
// button + show/hide toggle, and renders the source with Shiki highlighting
// when the CDN load succeeded (falls back to a plain <pre> otherwise).
const props = defineProps({
	source: { type: String, default: '' },
	lang: { type: String, default: 'vue' },
	filename: { type: String, default: '' },
	sourcePath: { type: String, default: '' },
	sourceHref: { type: String, default: '' },
	defaultOpen: { type: Boolean, default: true },
	previewLines: { type: Number, default: 0 },
	borderTop: { type: Boolean, default: true },
});

const showCode = ref(props.defaultOpen || props.previewLines > 0);
const expanded = ref(props.defaultOpen);
const copied = ref(false);
const highlighted = ref(null);
const isPreview = computed(() => props.previewLines > 0);
const isClipped = computed(() => showCode.value && isPreview.value && !expanded.value);
const resolvedSourceHref = computed(() => props.sourceHref || sourceHrefForPath(props.sourcePath));
const sourceLinkTarget = computed(() => isExternalSourceHref(resolvedSourceHref.value) ? '_blank' : null);
const sourceLinkTitle = computed(() => props.sourcePath ? `Open ${props.sourcePath}` : 'Open source file');
const toggleLabel = computed(() => {
	if (isPreview.value) return expanded.value ? 'Collapse code' : 'Expand code';
	return showCode.value ? 'Hide code' : 'Show code';
});
const codeStyle = computed(() => {
	if (!isPreview.value) return {};
	if (expanded.value) return { maxHeight: '70vh' };
	return { maxHeight: `${Math.round((props.previewLines * 20.625) + 32)}px` };
});

async function refreshHighlight() {
	highlighted.value = await highlight(props.source, props.lang);
}
onMounted(refreshHighlight);
watch(() => [props.source, props.lang], refreshHighlight);

function copy() {
	if (typeof navigator === 'undefined' || !navigator.clipboard) return;
	navigator.clipboard.writeText(props.source);
	copied.value = true;
	setTimeout(() => { copied.value = false; }, 1500);
}

function toggleCode() {
	if (isPreview.value) {
		showCode.value = true;
		expanded.value = !expanded.value;
		return;
	}
	showCode.value = !showCode.value;
}

function expandPreview() {
	if (isClipped.value) expanded.value = true;
}
</script>

<template>
	<div>
		<div
			class="flex min-w-0 items-center justify-between bg-secondary/40 px-3 py-1.5 text-xs"
			:class="borderTop && 'border-t border-border'"
		>
			<button
				type="button"
				class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-muted-fg hover:bg-background hover:text-fg"
				@click="toggleCode"
			>
				<svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 4L1 8l4 4M11 4l4 4-4 4" />
				</svg>
				{{ toggleLabel }}
			</button>
			<div class="flex items-center gap-2">
				<a
					v-if="filename && resolvedSourceHref"
					:href="resolvedSourceHref"
					:target="sourceLinkTarget || undefined"
					:rel="sourceLinkTarget ? 'noopener' : undefined"
					:title="sourceLinkTitle"
					class="font-mono text-[11px] text-muted-fg underline decoration-border underline-offset-4 transition hover:text-fg"
				>{{ filename }}</a>
				<span v-else-if="filename" class="font-mono text-[11px] text-muted-fg">{{ filename }}</span>
				<span class="font-mono text-[11px] uppercase tracking-wider text-muted-fg">{{ lang }}</span>
				<button
					type="button"
					class="rounded-md px-2 py-1 font-medium text-muted-fg hover:bg-background hover:text-fg"
					@click="copy"
				>{{ copied ? 'Copied' : 'Copy' }}</button>
			</div>
		</div>

		<div
			v-if="showCode"
			class="dom-code relative min-w-0 max-w-full border-t border-border transition-[max-height] duration-300 ease-out"
			:class="isClipped ? 'cursor-pointer overflow-hidden' : 'overflow-auto'"
			:style="codeStyle"
			@click="expandPreview"
		>
			<div v-if="highlighted" class="dom-shiki" v-html="highlighted"></div>
			<pre v-else class="overflow-auto bg-[#0b1020] p-4 text-[12.5px] leading-relaxed text-white/90"><code>{{ source }}</code></pre>
			<div
				v-if="isClipped"
				class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent via-background/80 to-background"
			></div>
		</div>
	</div>
</template>
