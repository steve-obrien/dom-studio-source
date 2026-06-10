<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

const props = defineProps({
	title: { type: String, default: 'Example preview' },
	src: { type: String, default: '' },
	minWidth: { type: Number, default: 320 },
	maxWidth: { type: Number, default: 1440 },
	defaultWidth: { type: Number, default: 0 },
	height: { type: Number, default: 720 },
});

const canvas = ref(null);
const iframe = ref(null);
const mountTarget = shallowRef(null);
const availableWidth = ref(0);
const previewWidth = ref(props.defaultWidth || props.maxWidth);
const userResized = ref(false);
const isDragging = ref(false);

let resizeObserver;
let headObserver;
let themeObserver;
let styleSyncFrame = 0;
let dragStartX = 0;
let dragStartWidth = 0;

const clampedWidth = computed(() => clamp(previewWidth.value, props.minWidth, props.maxWidth));
const roundedWidth = computed(() => Math.round(clampedWidth.value));
const iframeStyle = computed(() => ({
	width: `${roundedWidth.value}px`,
	height: `${props.height}px`,
}));

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function preferredWidth() {
	return props.defaultWidth || availableWidth.value || props.maxWidth;
}

function fitToAvailableWidth() {
	previewWidth.value = clamp(preferredWidth(), props.minWidth, props.maxWidth);
}

function writeFrameDocument() {
	const frameDocument = iframe.value?.contentDocument;
	if (!frameDocument) return;

	mountTarget.value = null;
	frameDocument.open();
	frameDocument.write('<!doctype html><html><head></head><body><div id="dom-example-frame-root"></div></body></html>');
	frameDocument.close();
	syncFrameDocument();
	mountTarget.value = frameDocument.getElementById('dom-example-frame-root');
}

function syncFrameDocument() {
	syncFrameTheme();
	syncFrameStyles();
}

function syncFrameTheme() {
	const frameDocument = iframe.value?.contentDocument;
	if (!frameDocument?.documentElement || !frameDocument.body) return;

	frameDocument.documentElement.className = document.documentElement.className;
	frameDocument.body.className = document.body.className;

	const theme = document.documentElement.getAttribute('data-theme');
	if (theme) {
		frameDocument.documentElement.setAttribute('data-theme', theme);
	} else {
		frameDocument.documentElement.removeAttribute('data-theme');
	}
}

function syncFrameStyles() {
	const frameDocument = iframe.value?.contentDocument;
	if (!frameDocument?.head) return;

	frameDocument.head
		.querySelectorAll('[data-dom-example-frame-clone], [data-dom-example-frame-base]')
		.forEach((node) => node.remove());

	for (const sourceNode of document.querySelectorAll('link[rel="stylesheet"], style')) {
		const clone = sourceNode.cloneNode(true);
		clone.setAttribute('data-dom-example-frame-clone', '');
		if (clone.tagName === 'LINK') clone.href = sourceNode.href;
		frameDocument.head.appendChild(clone);
	}

	const baseStyle = frameDocument.createElement('style');
	baseStyle.setAttribute('data-dom-example-frame-base', '');
	baseStyle.textContent = `
		html,
		body,
		#dom-example-frame-root {
			min-height: 100%;
		}

		body {
			margin: 0;
			background: var(--background);
			color: var(--fg);
			font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			text-rendering: optimizeLegibility;
			-webkit-font-smoothing: antialiased;
		}

		#dom-example-frame-root {
			width: 100%;
		}

		.dom-example-frame-content {
			min-height: 100%;
			width: 100%;
		}
	`;
	frameDocument.head.appendChild(baseStyle);
}

function scheduleStyleSync() {
	if (styleSyncFrame) cancelAnimationFrame(styleSyncFrame);
	styleSyncFrame = requestAnimationFrame(() => {
		styleSyncFrame = 0;
		syncFrameDocument();
	});
}

function observeHostDocument() {
	headObserver = new MutationObserver(scheduleStyleSync);
	headObserver.observe(document.head, {
		attributes: true,
		childList: true,
		characterData: true,
		subtree: true,
	});

	themeObserver = new MutationObserver(syncFrameTheme);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class', 'data-theme'],
	});
	if (document.body) {
		themeObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ['class'],
		});
	}
}

function observeShell() {
	if (!canvas.value) return;

	resizeObserver = new ResizeObserver(([entry]) => {
		availableWidth.value = entry.contentRect.width;
		if (!userResized.value) fitToAvailableWidth();
	});
	resizeObserver.observe(canvas.value);
}

function startResize(event) {
	event.preventDefault();
	userResized.value = true;
	isDragging.value = true;
	dragStartX = event.clientX;
	dragStartWidth = clampedWidth.value;

	window.addEventListener('pointermove', resizePreview);
	window.addEventListener('pointerup', stopResize, { once: true });
}

function resizePreview(event) {
	previewWidth.value = clamp(dragStartWidth + event.clientX - dragStartX, props.minWidth, props.maxWidth);
}

function stopResize() {
	isDragging.value = false;
	window.removeEventListener('pointermove', resizePreview);
}

function resetPreviewWidth() {
	userResized.value = false;
	fitToAvailableWidth();
}

function resizeWithKeyboard(event) {
	const keySteps = {
		ArrowLeft: -40,
		ArrowRight: 40,
	};

	if (event.key === 'Home') {
		event.preventDefault();
		userResized.value = true;
		previewWidth.value = props.minWidth;
		return;
	}

	if (event.key === 'End') {
		event.preventDefault();
		userResized.value = true;
		previewWidth.value = props.maxWidth;
		return;
	}

	if (!(event.key in keySteps)) return;

	event.preventDefault();
	userResized.value = true;
	previewWidth.value = clamp(clampedWidth.value + keySteps[event.key], props.minWidth, props.maxWidth);
}

watch(
	() => [props.defaultWidth, props.minWidth, props.maxWidth],
	() => {
		if (!userResized.value) {
			fitToAvailableWidth();
		} else {
			previewWidth.value = clampedWidth.value;
		}
	}
);

onMounted(async () => {
	await nextTick();
	observeShell();
	fitToAvailableWidth();
	if (!props.src) {
		writeFrameDocument();
		observeHostDocument();
	}
});

onBeforeUnmount(() => {
	resizeObserver?.disconnect();
	headObserver?.disconnect();
	themeObserver?.disconnect();
	window.removeEventListener('pointermove', resizePreview);
	if (styleSyncFrame) cancelAnimationFrame(styleSyncFrame);
});
</script>

<template>
	<div class="iframe-preview min-w-0 bg-background">
		<div class="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-3 py-2">
			<p class="text-xs font-medium tabular-nums text-muted-fg">{{ roundedWidth }}px</p>
			<button
				type="button"
				class="rounded-md px-2 py-1 text-xs font-medium text-muted-fg transition hover:bg-secondary hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				@click="resetPreviewWidth"
			>
				Fit
			</button>
		</div>

		<div ref="canvas" class="overflow-x-auto overflow-y-hidden bg-secondary/30 p-4">
			<div
				class="iframe-preview-viewport relative mx-auto overflow-visible rounded-lg bg-transparent shadow-sm"
				:class="{ 'iframe-preview-viewport-dragging': isDragging }"
				:style="iframeStyle"
			>
				<iframe
					ref="iframe"
					:title="title"
					:src="src || undefined"
					class="block h-full w-full rounded-[inherit] border-0 bg-background"
				/>
				<div v-if="isDragging" class="absolute inset-0 z-10 cursor-ew-resize" aria-hidden="true"></div>
				<button
					type="button"
					class="iframe-preview-handle"
					role="separator"
					aria-orientation="vertical"
					:aria-label="`Resize preview width, currently ${roundedWidth}px`"
					@pointerdown="startResize"
					@keydown="resizeWithKeyboard"
					@dblclick="resetPreviewWidth"
				>
					<span aria-hidden="true"></span>
				</button>
			</div>
		</div>

		<Teleport v-if="!src && mountTarget" :to="mountTarget">
			<div class="dom-example-frame-content">
				<slot />
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.iframe-preview-handle {
	position: absolute;
	top: 0;
	right: -0.75rem;
	z-index: 20;
	display: flex;
	width: 1.5rem;
	height: 100%;
	align-items: flex-start;
	justify-content: center;
	padding-top: 1rem;
	color: var(--muted-fg);
	cursor: ew-resize;
	background: transparent;
	border: 0;
	border-radius: 999px;
	transition:
		color 150ms ease,
		opacity 150ms ease;
}

.iframe-preview-handle::before {
	position: absolute;
	top: 0.75rem;
	bottom: 0.75rem;
	left: 50%;
	width: 1px;
	content: "";
	background: color-mix(in oklch, var(--border) 70%, transparent);
	border-radius: 999px;
	transform: translateX(-50%);
}

.iframe-preview-handle:hover,
.iframe-preview-handle:focus-visible,
.iframe-preview-viewport-dragging .iframe-preview-handle {
	color: var(--fg);
	outline: none;
}

.iframe-preview-handle span {
	position: relative;
	z-index: 1;
	width: 1rem;
	height: 3rem;
	background: var(--background);
	border-right: 1px solid currentColor;
	border-left: 1px solid currentColor;
	border-radius: 999px;
	box-shadow: 0 0 0 1px var(--border), var(--shadow-sm);
	opacity: 0.7;
}

.iframe-preview-handle:hover span,
.iframe-preview-handle:focus-visible span,
.iframe-preview-viewport-dragging .iframe-preview-handle span {
	background: var(--secondary);
	box-shadow: 0 0 0 1px var(--border), var(--shadow-md);
	opacity: 1;
}
</style>
