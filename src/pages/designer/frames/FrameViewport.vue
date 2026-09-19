<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

const props = defineProps({ css: { type: String, default: '' }, width: { type: Number, default: 820 } });
const emit = defineEmits(['ready']);
const iframe = ref(null);
const mount = shallowRef(null);
let observer;
let timer;
const source = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src https: http: data: blob:; font-src \'self\' data:"></head><body style="margin:0"><div id="frame-mount"></div></body></html>';

/** Copies existing app styles into the isolated viewport and appends compiled imported utilities. */
function syncStyles() {
	const doc = iframe.value?.contentDocument;
	if (!doc || !mount.value) return;
	doc.querySelectorAll('[data-frame-style]').forEach((node) => node.remove());
	for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
		const clone = node.cloneNode(true);
		clone.setAttribute('data-frame-style', '');
		if (node.tagName === 'LINK') clone.href = node.href;
		doc.head.appendChild(clone);
	}
	const runtime = doc.createElement('style');
	runtime.setAttribute('data-frame-style', '');
	runtime.textContent = props.css;
	doc.head.appendChild(runtime);
	doc.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
}
/** Mounts Vue content in a script-disabled iframe; source HTML never enters srcdoc. */
async function connect() {
	mount.value = iframe.value?.contentDocument?.getElementById('frame-mount') || null;
	if (!mount.value) return;
	syncStyles();
	observer?.disconnect();
	observer = new MutationObserver(queueStyles);
	observer.observe(document.head, { childList: true, subtree: true, characterData: true });
	await nextTick();
	emit('ready');
}
/** Coalesces development stylesheet changes without reloading the document or losing selection. */
function queueStyles() { clearTimeout(timer); timer = setTimeout(syncStyles, 50); }
/** Releases observers and pending style work owned by this viewport. */
function cleanup() { observer?.disconnect(); clearTimeout(timer); }
/** Finds a layer in this viewport without interpreting its identity as a selector. */
function element(id) { return [...(mount.value?.querySelectorAll('[data-designer-id]') || [])].find((node) => node.dataset.designerId === id); }
watch(() => props.css, syncStyles);
onMounted(connect);
onBeforeUnmount(cleanup);
defineExpose({ element });
</script>

<template>
	<div class="min-w-0 overflow-auto bg-secondary/50 p-4 sm:p-6">
		<iframe ref="iframe" title="Frame designer canvas" sandbox="allow-same-origin" :srcdoc="source" :style="{ width: `${width}px` }" class="mx-auto block h-[640px] max-w-none border border-border bg-canvas shadow-sm" @load="connect" />
		<Teleport v-if="mount" :to="mount"><slot /></Teleport>
	</div>
</template>
