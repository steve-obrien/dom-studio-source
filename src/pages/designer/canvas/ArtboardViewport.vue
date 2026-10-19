<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { artboardViewportCss } from './artboardCss.js';

/**
 * One artboard: an isolated, script-disabled iframe at a fixed CSS width, so
 * responsive utilities (`md:`, `lg:`) respond to the artboard rather than the
 * browser window. Vue content is teleported in; no source HTML enters srcdoc.
 *
 * Wheel, keyboard and touch events inside the iframe do not reach the parent
 * page, so they are forwarded for canvas panning, zooming and shortcuts. A tap
 * still selects; a touch that pans or pinches does not.
 *
 * The iframe grows to show the whole page, so viewport-height units (`vh`,
 * `svh`, `dvh`, `lvh`) would grow with it. Copied stylesheets resolve them
 * against `minHeight` instead, the artboard's device height.
 *
 * With `fill`, the artboard is one real viewport instead: the iframe fills its
 * container and scrolls itself, so viewport units and scrolling behave as in a
 * browser window. It reports its size through `resize`.
 */
const props = defineProps({
	css: { type: String, default: '' },
	width: { type: Number, default: 1200 },
	minHeight: { type: Number, default: 640 },
	title: { type: String, default: 'Artboard' },
	fill: { type: Boolean, default: false },
});
const emit = defineEmits(['ready', 'wheel', 'keydown', 'pointerdown', 'resize', 'touch']);
const iframe = ref(null);
const mount = shallowRef(null);
const height = ref(props.minHeight);
let styleObserver;
let syncId = 0;
const sheetCache = new Map();
let sizeObserver;
let frameObserver;
let timer;
const touchEvents = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
// Touch pointers down in this artboard, and whether the current touch sequence panned or pinched instead of tapping.
const touches = new Map();
let touchMoved = false;
const source = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; img-src https: http: data: blob:; font-src \'self\' data: https://fonts.gstatic.com"></head><body style="margin:0;min-height:100%"><div id="artboard-mount"></div></body></html>';

/** Reads a same-origin stylesheet's text so its viewport units can be rewritten; other links are kept as links. */
async function sheetText(link) {
	if (new URL(link.href, location.href).origin !== location.origin) return null;
	if (!sheetCache.has(link.href)) sheetCache.set(link.href, fetch(link.href).then((response) => (response.ok ? response.text() : null)).catch(() => null));
	return sheetCache.get(link.href);
}

/** Copies the app's styles into the artboard and appends utilities compiled for imported classes. */
async function syncStyles() {
	const doc = iframe.value?.contentDocument;
	if (!doc || !mount.value) return;
	const id = ++syncId;
	const nodes = [];
	for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
		const text = node.tagName === 'STYLE' ? node.textContent : await sheetText(node);
		if (id !== syncId) return;
		if (text === null) {
			const clone = node.cloneNode(true);
			clone.href = node.href;
			nodes.push(clone);
		} else {
			const style = doc.createElement('style');
			style.textContent = artboardViewportCss(text);
			nodes.push(style);
		}
	}
	const runtime = doc.createElement('style');
	runtime.textContent = artboardViewportCss(props.css);
	nodes.push(runtime);
	doc.querySelectorAll('[data-artboard-style]').forEach((node) => node.remove());
	for (const node of nodes) {
		node.setAttribute('data-artboard-style', '');
		doc.head.appendChild(node);
	}
	// On the canvas, touch drags pan and pinch the canvas; a filled artboard scrolls like a page.
	doc.documentElement.style.touchAction = props.fill ? '' : 'none';
	doc.documentElement.style.setProperty('--artboard-vh', props.fill ? '1vh' : `${props.minHeight / 100}px`);
	doc.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
	doc.documentElement.className = document.documentElement.className;
}

/** Grows the artboard to fit its content, never shrinking below the requested height. */
function fit() {
	if (props.fill) return;
	const content = mount.value?.firstElementChild;
	// Viewport units are resolved against minHeight (see syncStyles); the cap is a safety net for anything else that grows with the frame.
	height.value = Math.min(40000, Math.max(props.minHeight, Math.round(content?.offsetHeight || 0)));
}

/** Forwards wheel input in the parent page's coordinates; the canvas decides pan or zoom. */
function forwardWheel(event) {
	// A filled artboard is a page: its own scrolling wins.
	if (props.fill) return;
	const rect = iframe.value.getBoundingClientRect();
	const scale = rect.width / iframe.value.offsetWidth || 1;
	event.preventDefault();
	emit('wheel', { deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey, clientX: rect.left + event.clientX * scale, clientY: rect.top + event.clientY * scale, preventDefault() {} });
}

/** Forwards shortcuts unless the user is typing inside artboard content. */
function forwardKeydown(event) { emit('keydown', event); }

/** Tells the canvas which artboard is active when the user presses inside it. */
function forwardPointerdown(event) { emit('pointerdown', event); }

/** Forwards touch pointers in the parent page's coordinates, for one-finger pan and two-finger pinch. */
function forwardTouch(event) {
	if (event.pointerType !== 'touch' || props.fill) return;
	const rect = iframe.value.getBoundingClientRect();
	const scale = rect.width / iframe.value.offsetWidth || 1;
	const point = { x: event.clientX, y: event.clientY };
	if (event.type === 'pointerdown') {
		if (!touches.size) touchMoved = false;
		touches.set(event.pointerId, point);
		if (touches.size > 1) {
			touchMoved = true;
			// A second finger turns any layer drag into a pinch.
			for (const handle of event.target.ownerDocument.querySelectorAll('[data-designer-overlay] button')) {
				for (const id of touches.keys()) if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
			}
		}
	} else if (event.type === 'pointermove') {
		const start = touches.get(event.pointerId);
		if (start && Math.hypot(point.x - start.x, point.y - start.y) > 8) touchMoved = true;
	} else touches.delete(event.pointerId);
	emit('touch', { type: event.type, pointerId: event.pointerId, clientX: rect.left + point.x * scale, clientY: rect.top + point.y * scale, overlay: Boolean(event.target.closest?.('[data-designer-overlay]')) });
}

/** Swallows the click that ends a touch pan or pinch, so it does not also select a layer. */
function suppressPanClick(event) {
	if (!touchMoved) return;
	touchMoved = false;
	event.preventDefault();
	event.stopPropagation();
}

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
	for (const type of touchEvents) doc.addEventListener(type, forwardTouch, true);
	doc.addEventListener('click', suppressPanClick, true);
	sizeObserver?.disconnect();
	sizeObserver = new ResizeObserver(fit);
	sizeObserver.observe(mount.value);
	frameObserver?.disconnect();
	frameObserver = new ResizeObserver(() => emit('resize', { width: iframe.value?.clientWidth || 0, height: iframe.value?.clientHeight || 0 }));
	frameObserver.observe(iframe.value);
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
	frameObserver?.disconnect();
	clearTimeout(timer);
	const doc = iframe.value?.contentDocument;
	doc?.removeEventListener('wheel', forwardWheel);
	doc?.removeEventListener('keydown', forwardKeydown);
	doc?.removeEventListener('pointerdown', forwardPointerdown, true);
	for (const type of touchEvents) doc?.removeEventListener(type, forwardTouch, true);
	doc?.removeEventListener('click', suppressPanClick, true);
	touches.clear();
}

/** Finds a rendered layer by designer id without using it as a selector. */
function element(id) {
	return [...(mount.value?.querySelectorAll('[data-designer-id]') || [])].find((node) => node.dataset.designerId === id);
}

watch(() => props.css, syncStyles);
watch(() => [props.minHeight, props.fill], () => { syncStyles(); fit(); });
onMounted(() => { if (iframe.value?.contentDocument?.readyState === 'complete') connect(); });
onBeforeUnmount(cleanup);
defineExpose({ element, fit });
</script>

<template>
	<div :class="fill && 'size-full'">
		<iframe
			ref="iframe"
			:title="title"
			sandbox="allow-same-origin"
			:srcdoc="source"
			:style="fill ? { width: '100%', height: '100%' } : { width: `${width}px`, height: `${height}px` }"
			class="block max-w-none border-0 bg-canvas"
			@load="connect"
		/>
		<Teleport v-if="mount" :to="mount"><slot /></Teleport>
	</div>
</template>
