<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

const props = defineProps({
	title: { type: String, default: 'Example preview' },
	src: { type: String, default: '' },
	minWidth: { type: Number, default: 320 },
	maxWidth: { type: Number, default: 0 },
	defaultWidth: { type: Number, default: 0 },
	height: { type: Number, default: 720 },
	flushEdges: { type: Boolean, default: false },
	chrome: {
		type: String,
		default: 'none',
		validator: (value) => ['none', 'mobile'].includes(value),
	},
	device: { type: String, default: 'DOM Studio Phone' },
});

const canvas = ref(null);
const iframe = ref(null);
const viewport = ref(null);
const mountTarget = shallowRef(null);
const fallbackPreviewWidth = 1200;
const availableWidth = ref(0);
const previewWidth = ref(props.defaultWidth || props.maxWidth || fallbackPreviewWidth);
const userResized = ref(false);
const isDragging = ref(false);
const activePreset = ref('');
const isFullscreen = ref(false);
const mobilePresetWidth = 390;
const desktopPresetWidth = 1024;

let resizeObserver;
let headObserver;
let themeObserver;
let styleSyncFrame = 0;
let dragStartX = 0;
let dragStartWidth = 0;
let dragHandleOffset = 0;
let dragContentLeft = 0;
let dragContentWidth = 0;
let previousBodyOverflow = '';

const effectiveMaxWidth = computed(() => Math.max(props.minWidth, props.maxWidth || availableWidth.value || props.defaultWidth || fallbackPreviewWidth));
const clampedWidth = computed(() => clamp(previewWidth.value, props.minWidth, effectiveMaxWidth.value));
const roundedWidth = computed(() => Math.round(clampedWidth.value));
const hasMobileChrome = computed(() => props.chrome === 'mobile');
const iframeStyle = computed(() => ({
	width: `${roundedWidth.value}px`,
	height: isFullscreen.value ? '100%' : `${props.height}px`,
}));

/**
 * Constrains a numeric value to an inclusive range.
 *
 * @param {number} value Candidate value.
 * @param {number} min Minimum accepted value.
 * @param {number} max Maximum accepted value.
 * @returns {number} Clamped value.
 */
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

/**
 * Resolves the preferred responsive width from props and the measured canvas.
 *
 * @param {number} width Current available canvas width.
 * @returns {number} Preferred preview width.
 */
function preferredWidth(width = availableWidth.value) {
	return props.defaultWidth || width || props.maxWidth || fallbackPreviewWidth;
}

/**
 * Measures the usable horizontal space inside the preview canvas.
 *
 * @param {ResizeObserverEntry} [entry] Latest observer entry when available.
 * @returns {number} Canvas content width in pixels.
 */
function measureAvailableWidth(entry) {
	if (entry?.contentRect?.width) return entry.contentRect.width;
	if (!canvas.value) return 0;

	const style = window.getComputedStyle(canvas.value);
	const horizontalPadding = Number.parseFloat(style.paddingLeft || '0') + Number.parseFloat(style.paddingRight || '0');
	return Math.max(0, canvas.value.clientWidth - horizontalPadding);
}

/**
 * Measures the canvas content box in viewport coordinates for drag math.
 *
 * @returns {{ left: number, width: number }} Content box geometry.
 */
function measureCanvasContentBox() {
	if (!canvas.value) {
		return {
			left: 0,
			width: availableWidth.value || fallbackPreviewWidth,
		};
	}

	const rect = canvas.value.getBoundingClientRect();
	const style = window.getComputedStyle(canvas.value);
	const paddingLeft = Number.parseFloat(style.paddingLeft || '0');
	const paddingRight = Number.parseFloat(style.paddingRight || '0');
	const width = Math.max(0, canvas.value.clientWidth - paddingLeft - paddingRight);

	return {
		left: rect.left + paddingLeft - canvas.value.scrollLeft,
		width: width || availableWidth.value || fallbackPreviewWidth,
	};
}

/**
 * Stores the latest measured canvas width.
 *
 * @param {ResizeObserverEntry} [entry] Latest observer entry when available.
 * @returns {number} Updated width in pixels.
 */
function updateAvailableWidth(entry) {
	const width = measureAvailableWidth(entry);
	if (width) availableWidth.value = width;
	return width;
}

/**
 * Fits the preview to its configured preference within the available canvas.
 *
 * @param {ResizeObserverEntry} [entry] Latest observer entry when available.
 * @returns {void}
 */
function fitToAvailableWidth(entry) {
	const width = updateAvailableWidth(entry);
	previewWidth.value = clamp(preferredWidth(width), props.minWidth, effectiveMaxWidth.value);
}

/**
 * Re-measures the canvas and preserves an intentional user resize.
 *
 * @returns {void}
 */
function syncAvailableWidth() {
	if (!userResized.value) fitToAvailableWidth();
	else updateAvailableWidth();
}

/**
 * Creates the isolated document used by inline slot previews.
 *
 * @returns {void}
 */
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

/**
 * Synchronizes theme and stylesheet state into an inline preview document.
 *
 * @returns {void}
 */
function syncFrameDocument() {
	syncFrameTheme();
	syncFrameStyles();
}

/**
 * Mirrors host theme attributes into an inline preview document.
 *
 * @returns {void}
 */
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

/**
 * Replaces cloned host styles in an inline preview document.
 *
 * @returns {void}
 */
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
			background: var(--canvas);
			color: var(--canvas-fg);
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

/**
 * Batches iframe stylesheet synchronization into one animation frame.
 *
 * @returns {void}
 */
function scheduleStyleSync() {
	if (styleSyncFrame) cancelAnimationFrame(styleSyncFrame);
	styleSyncFrame = requestAnimationFrame(() => {
		styleSyncFrame = 0;
		syncFrameDocument();
	});
}

/**
 * Observes host styles and theme attributes used by inline previews.
 *
 * @returns {void}
 */
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

/**
 * Observes preview canvas resizing so fitted widths remain accurate.
 *
 * @returns {void}
 */
function observeShell() {
	if (!canvas.value) return;

	resizeObserver = new ResizeObserver(([entry]) => {
		if (!userResized.value) fitToAvailableWidth(entry);
		else updateAvailableWidth(entry);
	});
	resizeObserver.observe(canvas.value);
}

/**
 * Starts pointer-driven preview resizing from the current rendered geometry.
 *
 * @param {PointerEvent} event Pointer-down event from the resize separator.
 * @returns {void}
 */
function startResize(event) {
	event.preventDefault();
	userResized.value = true;
	isDragging.value = true;
	activePreset.value = '';
	updateAvailableWidth();
	const viewportRect = viewport.value?.getBoundingClientRect();
	const contentBox = measureCanvasContentBox();
	dragStartX = event.clientX;
	dragStartWidth = clampedWidth.value;
	dragHandleOffset = viewportRect ? event.clientX - viewportRect.right : 0;
	dragContentLeft = contentBox.left;
	dragContentWidth = contentBox.width;

	window.addEventListener('pointermove', resizePreview);
	window.addEventListener('pointerup', stopResize, { once: true });
}

/**
 * Updates preview width while a pointer resize is active.
 *
 * @param {PointerEvent} event Active pointer-move event.
 * @returns {void}
 */
function resizePreview(event) {
	const pointerDelta = event.clientX - dragStartX;
	const targetRight = event.clientX - dragHandleOffset;
	const contentCenter = dragContentLeft + dragContentWidth / 2;
	const centeredWidth = (targetRight - contentCenter) * 2;
	const anchoredWidth = dragStartWidth + pointerDelta;
	const overflowWidth = targetRight - dragContentLeft;
	const targetWidth = centeredWidth <= dragContentWidth
		? centeredWidth
		: Math.max(anchoredWidth, overflowWidth);

	previewWidth.value = clamp(targetWidth, props.minWidth, effectiveMaxWidth.value);
}

/**
 * Ends the current pointer resize interaction.
 *
 * @returns {void}
 */
function stopResize() {
	isDragging.value = false;
	window.removeEventListener('pointermove', resizePreview);
}

/**
 * Returns the preview to its fitted responsive width.
 *
 * @returns {void}
 */
function resetPreviewWidth() {
	userResized.value = false;
	activePreset.value = '';
	fitToAvailableWidth();
}

/**
 * Applies a named responsive width preset.
 *
 * @param {number} width Preset width in pixels.
 * @param {string} [preset] Preset identifier for pressed-state feedback.
 * @returns {void}
 */
function resizeToPreset(width, preset = '') {
	userResized.value = true;
	activePreset.value = preset;
	previewWidth.value = clamp(width, props.minWidth, effectiveMaxWidth.value);
}

/**
 * Applies the standard mobile preview width.
 *
 * @returns {void}
 */
function useMobilePreset() {
	resizeToPreset(mobilePresetWidth, 'mobile');
}

/**
 * Applies the standard desktop preview width.
 *
 * @returns {void}
 */
function useDesktopPreset() {
	resizeToPreset(desktopPresetWidth, 'desktop');
}

/**
 * Supports keyboard resizing from the separator control.
 *
 * @param {KeyboardEvent} event Separator keyboard event.
 * @returns {void}
 */
function resizeWithKeyboard(event) {
	const keySteps = {
		ArrowLeft: -40,
		ArrowRight: 40,
	};

	if (event.key === 'Home') {
		event.preventDefault();
		userResized.value = true;
		activePreset.value = '';
		previewWidth.value = props.minWidth;
		return;
	}

	if (event.key === 'End') {
		event.preventDefault();
		userResized.value = true;
		activePreset.value = '';
		previewWidth.value = effectiveMaxWidth.value;
		return;
	}

	if (!(event.key in keySteps)) return;

	event.preventDefault();
	userResized.value = true;
	activePreset.value = '';
	previewWidth.value = clamp(clampedWidth.value + keySteps[event.key], props.minWidth, effectiveMaxWidth.value);
}

/**
 * Applies the viewport-filling preview state and prevents background scrolling.
 *
 * @param {boolean} nextState Whether the preview should fill the browser window.
 * @returns {void}
 */
function setFullscreenState(nextState) {
	if (nextState === isFullscreen.value) return;

	if (nextState) {
		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	} else {
		document.body.style.overflow = previousBodyOverflow;
	}

	isFullscreen.value = nextState;
	requestAnimationFrame(syncAvailableWidth);
}

/**
 * Enters or exits a viewport-filling preview while preserving the chosen width.
 *
 * @returns {void}
 */
function toggleFullscreen() {
	setFullscreenState(!isFullscreen.value);
}

/**
 * Exits the expanded preview when the user presses Escape.
 *
 * @param {KeyboardEvent} event Global keyboard event.
 * @returns {void}
 */
function handleFullscreenKeydown(event) {
	if (event.key === 'Escape' && isFullscreen.value) setFullscreenState(false);
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
	requestAnimationFrame(syncAvailableWidth);
	window.addEventListener('resize', syncAvailableWidth);
	window.addEventListener('keydown', handleFullscreenKeydown);
	if (!props.src) {
		writeFrameDocument();
		observeHostDocument();
	}
});

onBeforeUnmount(() => {
	resizeObserver?.disconnect();
	headObserver?.disconnect();
	themeObserver?.disconnect();
	window.removeEventListener('resize', syncAvailableWidth);
	window.removeEventListener('pointermove', resizePreview);
	window.removeEventListener('keydown', handleFullscreenKeydown);
	if (isFullscreen.value) setFullscreenState(false);
	if (styleSyncFrame) cancelAnimationFrame(styleSyncFrame);
});
</script>

<template>
	<div class="iframe-preview min-w-0 bg-canvas" :class="{ 'iframe-preview-fullscreen': isFullscreen }">
		<div class="iframe-preview-toolbar flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-3 py-2">
			<div class="flex min-w-0 items-center gap-2">
				<p class="text-xs font-medium tabular-nums text-muted-fg">{{ roundedWidth }}px</p>
				<div class="inline-flex shrink-0 rounded-md border border-border bg-canvas p-0.5" role="toolbar" aria-label="Preview presets">
					<button
						type="button"
						class="grid size-7 place-items-center rounded text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						:class="activePreset === 'mobile' && 'bg-secondary text-canvas-fg shadow-sm ring-1 ring-border/70'"
						:aria-pressed="activePreset === 'mobile' ? 'true' : 'false'"
						aria-label="Mobile preview"
						title="Mobile preview"
						@click="useMobilePreset"
					>
						<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
							<rect x="7" y="2.75" width="10" height="18.5" rx="2.25" stroke="currentColor" stroke-width="1.7" />
							<path d="M10.5 17.75h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
						</svg>
					</button>
					<button
						type="button"
						class="grid size-7 place-items-center rounded text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						:class="activePreset === 'desktop' && 'bg-secondary text-canvas-fg shadow-sm ring-1 ring-border/70'"
						:aria-pressed="activePreset === 'desktop' ? 'true' : 'false'"
						aria-label="Desktop preview"
						title="Desktop preview"
						@click="useDesktopPreset"
					>
						<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
							<rect x="3.25" y="4.25" width="17.5" height="12" rx="1.75" stroke="currentColor" stroke-width="1.7" />
							<path d="M9 20h6M12 16.25V20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
						</svg>
					</button>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<button
					type="button"
					class="rounded-md px-2 py-1 text-xs font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					@click="resetPreviewWidth"
				>
					Fit
				</button>
				<button
					type="button"
					class="grid size-7 place-items-center rounded text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					:aria-label="isFullscreen ? 'Exit full screen' : 'Enter full screen'"
					:title="isFullscreen ? 'Exit full screen' : 'Enter full screen'"
					:aria-pressed="isFullscreen ? 'true' : 'false'"
					@click="toggleFullscreen"
				>
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path v-if="isFullscreen" d="M9 4v5H4M15 4v5h5M9 20v-5H4m11 5v-5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
						<path v-else d="M4 9V4h5m6 0h5v5M4 15v5h5m11-5v5h-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</div>

		<div ref="canvas" class="iframe-preview-canvas overflow-x-auto overflow-y-hidden bg-secondary/30 p-4">
			<div
				ref="viewport"
				class="iframe-preview-viewport relative mx-auto overflow-visible bg-transparent"
				:class="[
					hasMobileChrome ? 'iframe-preview-viewport-mobile' : '',
					flushEdges ? 'rounded-none shadow-none' : 'rounded-lg shadow-sm',
					{ 'iframe-preview-viewport-dragging': isDragging },
				]"
				:style="iframeStyle"
			>
				<div
					v-if="hasMobileChrome"
					class="iframe-preview-mobile-shell"
					:aria-label="device"
				>
					<div class="iframe-preview-mobile-screen">
						<iframe
							ref="iframe"
							:title="title"
							:src="src || undefined"
							class="iframe-preview-frame"
						/>
						<div class="iframe-preview-mobile-notch" aria-hidden="true"></div>
						<div class="iframe-preview-mobile-speaker" aria-hidden="true"></div>
					</div>
				</div>
				<iframe
					v-else
					ref="iframe"
					:title="title"
					:src="src || undefined"
					class="block h-full w-full rounded-[inherit] border-0 bg-canvas"
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
.iframe-preview-fullscreen {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	width: 100vw;
	height: 100vh;
	flex-direction: column;
	background: var(--canvas);
}

.iframe-preview-fullscreen .iframe-preview-toolbar {
	flex: 0 0 auto;
}

.iframe-preview-fullscreen .iframe-preview-canvas {
	min-height: 0;
	flex: 1 1 auto;
}

.iframe-preview-fullscreen .iframe-preview-viewport {
	max-height: 100%;
}

.iframe-preview-viewport-mobile {
	border-radius: 3rem;
	box-shadow: 0 24px 70px color-mix(in oklch, black 20%, transparent);
}

.iframe-preview-mobile-shell {
	height: 100%;
	padding: 0.625rem;
	background: var(--canvas-fg);
	border: 1px solid var(--border);
	border-radius: 3rem;
}

.iframe-preview-mobile-screen {
	position: relative;
	isolation: isolate;
	height: 100%;
	overflow: hidden;
	background: var(--canvas);
	border: 1px solid var(--border);
	border-radius: 2.35rem;
	clip-path: inset(0 round 2.35rem);
}

.iframe-preview-frame {
	position: relative;
	z-index: 1;
	display: block;
	width: 100%;
	height: 100%;
	background: var(--canvas);
	border: 0;
	border-radius: inherit;
}

.iframe-preview-mobile-notch {
	position: absolute;
	top: 0.5rem;
	left: 50%;
	z-index: 20;
	width: 6rem;
	height: 1.5rem;
	background: var(--canvas-fg);
	border-radius: 999px;
	transform: translateX(-50%);
}

.iframe-preview-mobile-speaker {
	position: absolute;
	top: 0.75rem;
	left: 50%;
	z-index: 30;
	width: 2.5rem;
	height: 0.375rem;
	background: color-mix(in oklch, var(--canvas) 25%, transparent);
	border-radius: 999px;
	transform: translateX(-50%);
}

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
	color: var(--canvas-fg);
	outline: none;
}

.iframe-preview-handle span {
	position: relative;
	z-index: 1;
	width: 1rem;
	height: 3rem;
	background: var(--canvas);
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
