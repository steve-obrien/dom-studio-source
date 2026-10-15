<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

/**
 * One artboard: an isolated, script-disabled iframe at a fixed CSS width, so
 * responsive utilities (`md:`, `lg:`) respond to the artboard rather than the
 * browser window. Vue content is teleported in; no source HTML enters srcdoc.
 *
 * Wheel and keyboard events inside the iframe do not reach the parent page, so
 * they are forwarded for canvas panning, zooming and shortcuts.
 */
const props = defineProps({
	css: { type: String, default: '' },
	width: { type: Number, default: 1200 },
	minHeight: { type: Number, default: 640 },
	title: { type: String, default: 'Artboard' },
});
const emit = defineEmits(['ready', 'wheel', 'keydown', 'pointerdown']);
const iframe = ref(null);
const mount = shallowRef(null);
const height = ref(props.minHeight);
let styleObserver;
let sizeObserver;
let timer;
const source = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; img-src https: http: data: blob:; font-src \'self\' data: https://fonts.gstatic.com"></head><body style="margin:0;min-height:100%"><div id="artboard-mount"></div></body></html>';

/** Copies the app's styles into the artboard and appends utilities compiled for imported classes. */
function syncStyles() {
	const doc = iframe.value?.contentDocument;
	if (!doc || !mount.value) return;
	doc.querySelectorAll('[data-artboard-style]').forEach((node) => node.remove());
	for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
		const clone = node.cloneNode(true);
		clone.setAttribute('data-artboard-style', '');
		if (node.tagName === 'LINK') clone.href = node.href;
		doc.head.appendChild(clone);
	}
	const runtime = doc.createElement('style');
	runtime.setAttribute('data-artboard-style', '');
	runtime.textContent = props.css;
	doc.head.appendChild(runtime);
	doc.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
	doc.documentElement.className = document.documentElement.className;
}

/** Grows the artboard to fit its content, never shrinking below the requested height. */
function fit() {
	const content = mount.value?.firstElementChild;
	// Capped: content sized in vh units would otherwise grow with the artboard indefinitely.
	height.value = Math.min(8000, Math.max(props.minHeight, Math.round(content?.offsetHeight || 0)));
}

/** Forwards wheel input in the parent page's coordinates; the canvas decides pan or zoom. */
function forwardWheel(event) {
	const rect = iframe.value.getBoundingClientRect();
	const scale = rect.width / iframe.value.offsetWidth || 1;
	event.preventDefault();
	emit('wheel', { deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey, clientX: rect.left + event.clientX * scale, clientY: rect.top + event.clientY * scale, preventDefault() {} });
}

/** Forwards shortcuts unless the user is typing inside artboard content. */
function forwardKeydown(event) { emit('keydown', event); }

/** Tells the canvas which artboard is active when the user presses inside it. */
function forwardPointerdown(event) { emit('pointerdown', event); }

/** Mounts once the iframe document exists, then keeps styles and size in sync. */
async function connect() {
	const doc = iframe.value?.contentDocument;
	mount.value = doc?.getElementById('artboard-mount') || null;
	if (!mount.value) return;
	syncStyles();
	styleObserver?.disconnect();
	styleObserver = new MutationObserver(queueStyles);
	styleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
	styleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
	doc.addEventListener('wheel', forwardWheel, { passive: false });
	doc.addEventListener('keydown', forwardKeydown);
	doc.addEventListener('pointerdown', forwardPointerdown, true);
	sizeObserver?.disconnect();
	sizeObserver = new ResizeObserver(fit);
	sizeObserver.observe(mount.value);
	await nextTick();
	fit();
	emit('ready');
}

/** Coalesces stylesheet changes during development without reloading the artboard. */
function queueStyles() { clearTimeout(timer); timer = setTimeout(syncStyles, 50); }

/** Releases observers and listeners owned by this artboard. */
function cleanup() {
	styleObserver?.disconnect();
	sizeObserver?.disconnect();
	clearTimeout(timer);
	const doc = iframe.value?.contentDocument;
	doc?.removeEventListener('wheel', forwardWheel);
	doc?.removeEventListener('keydown', forwardKeydown);
	doc?.removeEventListener('pointerdown', forwardPointerdown, true);
}

/** Finds a rendered layer by designer id without using it as a selector. */
function element(id) {
	return [...(mount.value?.querySelectorAll('[data-designer-id]') || [])].find((node) => node.dataset.designerId === id);
}

watch(() => props.css, syncStyles);
watch(() => props.minHeight, fit);
onMounted(() => { if (iframe.value?.contentDocument?.readyState === 'complete') connect(); });
onBeforeUnmount(cleanup);
defineExpose({ element, fit });
</script>

<template>
	<div>
		<iframe
			ref="iframe"
			:title="title"
			sandbox="allow-same-origin"
			:srcdoc="source"
			:style="{ width: `${width}px`, height: `${height}px` }"
			class="block max-w-none border-0 bg-canvas"
			@load="connect"
		/>
		<Teleport v-if="mount" :to="mount"><slot /></Teleport>
	</div>
</template>
