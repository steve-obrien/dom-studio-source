<script setup>
import {
	onBeforeUnmount,
	onMounted,
	ref,
	useId,
} from 'vue';
import {
	buildLiquidGlassMap,
	supportsLiquidGlassRefraction,
} from './liquidGlass.js';

defineOptions({
	name: 'DomLiquidGlassSurface',
	__doc: {
		description: 'An experimental standalone surface that refracts content behind it with a safe translucent fallback.',
	},
});

const MAP_UPDATE_DELAY = 140;
const FALLBACK_FILTER = 'blur(var(--dom-liquid-glass-fallback-blur, 18px)) saturate(var(--dom-liquid-glass-fallback-saturation, 1.2))';

defineProps({
	refraction: {
		type: Number,
		default: 50,
	},
});

const surface = ref(null);
const mapHref = ref('');
const mode = ref('fallback');
const filterValue = ref(FALLBACK_FILTER);
const filterId = `dom-liquid-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

let mapUpdateTimer = null;
let resizeObserver = null;

/**
 * Rasterize a displacement map that matches the current surface geometry.
 *
 * @returns {void}
 */
function updateGlassMap() {
	if (!surface.value || mode.value !== 'enhanced') return;

	const bounds = surface.value.getBoundingClientRect();
	const styles = window.getComputedStyle(surface.value);
	const radius = Number.parseFloat(styles.borderTopLeftRadius) || 0;

	mapHref.value = buildLiquidGlassMap({
		width: bounds.width,
		height: bounds.height,
		radius,
	});
}

/**
 * Debounce displacement-map generation while the surface is resizing.
 *
 * @returns {void}
 */
function queueGlassMapUpdate() {
	if (mapUpdateTimer !== null) window.clearTimeout(mapUpdateTimer);
	mapUpdateTimer = window.setTimeout(updateGlassMap, MAP_UPDATE_DELAY);
}

/**
 * Enable the enhanced filter when the current rendering engine supports it.
 *
 * @returns {void}
 */
function activateLiquidGlass() {
	if (!supportsLiquidGlassRefraction()) return;

	mode.value = 'enhanced';
	filterValue.value = `url("#${filterId}") blur(var(--dom-liquid-glass-blur, 7px)) saturate(var(--dom-liquid-glass-saturation, 1.4))`;
	updateGlassMap();

	if (typeof ResizeObserver === 'function') {
		resizeObserver = new ResizeObserver(queueGlassMapUpdate);
		resizeObserver.observe(surface.value);
	}

	window.addEventListener('resize', queueGlassMapUpdate, { passive: true });
}

/**
 * Release observers and pending work owned by this surface instance.
 *
 * @returns {void}
 */
function disposeLiquidGlass() {
	resizeObserver?.disconnect();
	resizeObserver = null;
	window.removeEventListener('resize', queueGlassMapUpdate);

	if (mapUpdateTimer !== null) {
		window.clearTimeout(mapUpdateTimer);
		mapUpdateTimer = null;
	}
}

onMounted(activateLiquidGlass);
onBeforeUnmount(disposeLiquidGlass);
</script>

<template>
	<div
		ref="surface"
		class="surface"
		:data-liquid-glass-mode="mode"
		:style="{ '--dom-liquid-glass-filter': filterValue }"
	>
		<div class="content">
			<slot />
		</div>

		<svg
			class="defs"
			aria-hidden="true"
			focusable="false"
			width="0"
			height="0"
		>
			<defs>
				<filter
					:id="filterId"
					color-interpolation-filters="sRGB"
					x="-25%"
					y="-25%"
					width="150%"
					height="150%"
				>
					<feImage
						x="0"
						y="0"
						width="100%"
						height="100%"
						preserveAspectRatio="none"
						:href="mapHref || undefined"
						:xlink:href="mapHref || undefined"
						result="map"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="map"
						xChannelSelector="R"
						yChannelSelector="B"
						:scale="-refraction"
						result="displaced-red"
					/>
					<feColorMatrix
						in="displaced-red"
						type="matrix"
						values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
						result="red"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="map"
						xChannelSelector="R"
						yChannelSelector="B"
						:scale="-Math.max(0, refraction - 3)"
						result="displaced-green"
					/>
					<feColorMatrix
						in="displaced-green"
						type="matrix"
						values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
						result="green"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="map"
						xChannelSelector="R"
						yChannelSelector="B"
						:scale="-Math.max(0, refraction - 6)"
						result="displaced-blue"
					/>
					<feColorMatrix
						in="displaced-blue"
						type="matrix"
						values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
						result="blue"
					/>
					<feBlend in="red" in2="green" mode="screen" result="red-green" />
					<feBlend in="red-green" in2="blue" mode="screen" result="output" />
					<feGaussianBlur in="output" stdDeviation="0.7" />
				</filter>
			</defs>
		</svg>
	</div>
</template>

<style scoped>
.surface {
	--dom-liquid-glass-default-surface-fill: var(
		--dom-liquid-glass-fallback-background,
		color-mix(in oklch, var(--canvas, white) 68%, transparent)
	);
	--dom-liquid-glass-default-edge-top: rgb(255 255 255 / 0.58);
	--dom-liquid-glass-default-edge-top: light-dark(rgb(255 255 255 / 0.58), rgb(255 255 255 / 0.24));
	--dom-liquid-glass-default-edge-upper: rgb(255 255 255 / 0.28);
	--dom-liquid-glass-default-edge-upper: light-dark(rgb(255 255 255 / 0.28), rgb(255 255 255 / 0.11));
	--dom-liquid-glass-default-edge-side: rgb(255 255 255 / 0.14);
	--dom-liquid-glass-default-edge-side: light-dark(rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.05));
	--dom-liquid-glass-default-edge-bottom: rgb(255 255 255 / 0.09);
	--dom-liquid-glass-default-edge-bottom: light-dark(rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.03));
	--dom-liquid-glass-default-shadow:
		0 1px 2px rgb(15 23 42 / 0.1),
		0 8px 24px -8px rgb(15 23 42 / 0.2),
		0 22px 52px -18px rgb(15 23 42 / 0.24);
	--dom-liquid-glass-default-shadow:
		0 1px 2px light-dark(rgb(15 23 42 / 0.1), rgb(0 0 0 / 0.42)),
		0 8px 24px -8px light-dark(rgb(15 23 42 / 0.2), rgb(0 0 0 / 0.58)),
		0 22px 52px -18px light-dark(rgb(15 23 42 / 0.24), rgb(0 0 0 / 0.72));
	--dom-liquid-glass-default-inner-edge-top: rgb(255 255 255 / 0.42);
	--dom-liquid-glass-default-inner-edge-top: light-dark(rgb(255 255 255 / 0.42), rgb(255 255 255 / 0.18));
	--dom-liquid-glass-default-inner-edge-glow: rgb(255 255 255 / 0.09);
	--dom-liquid-glass-default-inner-edge-glow: light-dark(rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.035));
	--dom-liquid-glass-default-inner-edge-side: rgb(255 255 255 / 0.08);
	--dom-liquid-glass-default-inner-edge-side: light-dark(rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.03));
	--dom-liquid-glass-default-inner-edge-bottom: rgb(15 23 42 / 0.08);
	--dom-liquid-glass-default-inner-edge-bottom: light-dark(rgb(15 23 42 / 0.08), rgb(0 0 0 / 0.34));

	position: var(--dom-liquid-glass-position, relative);
	isolation: isolate;
	overflow: hidden;
	color: var(--canvas-fg, #171717);
	background:
		linear-gradient(
			var(--dom-liquid-glass-surface-fill, var(--dom-liquid-glass-default-surface-fill)),
			var(--dom-liquid-glass-surface-fill, var(--dom-liquid-glass-default-surface-fill))
		) padding-box,
		linear-gradient(
			180deg,
			var(--dom-liquid-glass-edge-top, var(--dom-liquid-glass-default-edge-top)) 0%,
			var(--dom-liquid-glass-edge-upper, var(--dom-liquid-glass-default-edge-upper)) 20%,
			var(--dom-liquid-glass-edge-side, var(--dom-liquid-glass-default-edge-side)) 58%,
			var(--dom-liquid-glass-edge-bottom, var(--dom-liquid-glass-default-edge-bottom)) 100%
		) border-box;
	border: 1px solid transparent;
	border-radius: var(--dom-liquid-glass-radius, var(--radius-lg, 1.25rem));
	box-shadow: var(
		--dom-liquid-glass-shadow,
		var(--dom-liquid-glass-default-shadow)
	);
	-webkit-backdrop-filter: var(--dom-liquid-glass-filter);
	backdrop-filter: var(--dom-liquid-glass-filter);
}

.surface[data-liquid-glass-mode='enhanced'] {
	--dom-liquid-glass-default-surface-fill: var(
		--dom-liquid-glass-background,
		color-mix(in oklch, var(--canvas, white) 40%, transparent)
	);
}

.surface::before,
.surface::after {
	position: absolute;
	inset: 0;
	pointer-events: none;
	content: '';
	border-radius: inherit;
}

.surface::before {
	z-index: 1;
	box-shadow:
		inset 0 1px 0 var(--dom-liquid-glass-inner-edge-top, var(--dom-liquid-glass-default-inner-edge-top)),
		inset 0 3px 8px var(--dom-liquid-glass-inner-edge-glow, var(--dom-liquid-glass-default-inner-edge-glow)),
		inset 1px 0 0 var(--dom-liquid-glass-inner-edge-side, var(--dom-liquid-glass-default-inner-edge-side)),
		inset -1px 0 0 var(--dom-liquid-glass-inner-edge-side, var(--dom-liquid-glass-default-inner-edge-side)),
		inset 0 -1px 0 var(--dom-liquid-glass-inner-edge-bottom, var(--dom-liquid-glass-default-inner-edge-bottom));
}

.surface::after {
	z-index: 0;
	background: linear-gradient(
		155deg,
		rgb(255 255 255 / 0.14),
		transparent 34%,
		rgb(255 255 255 / 0.04) 72%,
		rgb(255 255 255 / 0.08)
	);
}

.content {
	position: relative;
	z-index: 2;
}

.defs {
	position: absolute;
	width: 0;
	height: 0;
	overflow: hidden;
}

@media (prefers-reduced-transparency: reduce) {
	.surface {
		background: var(--canvas, white);
		border-color: var(--border, rgb(0 0 0 / 0.14));
		-webkit-backdrop-filter: none;
		backdrop-filter: none;
	}
}
</style>
