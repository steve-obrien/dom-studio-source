<script setup>
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, ref, useId, useSlots, watch } from 'vue';

defineOptions({
	__doc: {
		name: 'Splitter panel',
		tag: '<DomSplitterPanel>',
		description: 'A resizable multi-pane shell for editors, inspectors, file browsers, and app-builder workspaces.',
		icon: 'M5 4v16M19 4v16M8 6h8M8 12h8M8 18h8',
		slots: [
			{ name: 'start', description: 'The leading resizable pane.' },
			{ name: 'default', description: 'The flexible central pane.' },
			{ name: 'end', description: 'Optional trailing resizable pane.' },
			{ name: 'start-handle', description: 'Optional content inside the leading resize handle.', props: '{ active, orientation, collapsed }' },
			{ name: 'end-handle', description: 'Optional content inside the trailing resize handle.', props: '{ active, orientation, collapsed }' },
		],
		events: [
			{ name: 'update:startSize', payload: '(pixels)', description: 'Emitted when the leading pane is resized. A collapsed pane emits 0.' },
			{ name: 'update:endSize', payload: '(pixels)', description: 'Emitted when the trailing pane is resized. A collapsed pane emits 0.' },
			{ name: 'resize', payload: '({ startSize, endSize })', description: 'Emitted after either splitter handle moves.' },
		],
		keyboard: [
			{ keys: 'Arrow keys', action: 'Resize along the splitter axis. Hold Shift for larger steps. Press the arrow away from the collapsed edge to reopen a pane at its minimum.' },
			{ keys: 'Enter', action: 'Collapse the pane or restore its previous size when collapse is enabled.' },
		],
	},
});

const props = defineProps({
	orientation: {
		type: String,
		default: 'horizontal',
		validator: (value) => ['horizontal', 'vertical'].includes(value),
		_edit: {
			description: 'Resize direction. Horizontal creates columns; vertical creates rows.',
			options: ['horizontal', 'vertical'],
		},
	},
	reverse: {
		type: Boolean,
		default: false,
		_edit: { description: 'Place the leading pane on the right in horizontal layouts; pointer and keyboard resizing follow its physical edge.' },
	},
	startSize: {
		type: Number,
		default: 280,
		_edit: { description: 'Width or height of the leading pane in pixels. Pass 0 to collapse it when startCollapsible is enabled.' },
	},
	endSize: {
		type: Number,
		default: 360,
		_edit: { description: 'Width or height of the trailing pane in pixels. Pass 0 to collapse it when endCollapsible is enabled.' },
	},
	minStart: {
		type: Number,
		default: 180,
		_edit: { description: 'Minimum leading pane width or height.' },
	},
	minMain: {
		type: Number,
		default: 320,
		_edit: { description: 'Minimum central pane width or height.' },
	},
	minEnd: {
		type: Number,
		default: 220,
		_edit: { description: 'Minimum trailing pane width or height.' },
	},
	startCollapsible: {
		type: Boolean,
		default: false,
		_edit: { description: 'Allow the leading pane to snap closed when dragged past its expanded minimum.' },
	},
	endCollapsible: {
		type: Boolean,
		default: false,
		_edit: { description: 'Allow the trailing pane to snap closed when dragged past its expanded minimum.' },
	},
	collapseThreshold: {
		type: Number,
		default: 32,
		_edit: { description: 'Extra drag distance in pixels to snap a pane closed or pull it open, capped at that pane’s expanded minimum.' },
	},
	handleSize: {
		type: Number,
		default: 8,
		_edit: { description: 'Splitter handle hit area in pixels.' },
	},
	flush: {
		type: Boolean,
		default: false,
		_edit: { description: 'Join adjacent panes with a one-pixel divider while keeping the full handle hit area.' },
	},
	handleClass: {
		type: [String, Array, Object],
		default: 'transition hover:bg-ring/25 focus-visible:bg-ring/35 data-[dragging=true]:bg-ring/35',
		_edit: { description: 'Classes applied to each resize handle. Use this to make handles transparent, bordered, or prominent.' },
	},
	activeHandleClass: {
		type: [String, Array, Object],
		default: '',
		_edit: { description: 'Additional classes applied to the active resize handle while dragging.' },
	},
	handleIndicatorClass: {
		type: [String, Array, Object],
		default: '',
		_edit: { description: 'Classes applied to the small visual indicator inside each resize handle.' },
	},
});

const emit = defineEmits(['update:startSize', 'update:endSize', 'resize']);
const slots = useSlots();
const id = useId();
const root = ref(null);
const startPx = ref(props.startSize);
const endPx = ref(props.endSize);
const panes = {
	start: { size: startPx, restoreSize: props.startSize },
	end: { size: endPx, restoreSize: props.endSize },
};
const panelExtent = ref(0);
const dragging = ref(null);
let resizeObserver = null;

// Slots are not reactive, so the end pane is re-checked before each render; a parent can drop it with v-if.
const hasEnd = ref(Boolean(slots.end));
onBeforeUpdate(() => {
	hasEnd.value = Boolean(slots.end);
	if (!hasEnd.value && dragging.value?.pane === 'end') endResize();
});
const isVertical = computed(() => props.orientation === 'vertical');
const isReversed = computed(() => props.reverse && !isVertical.value);
const resizeCursor = computed(() => isVertical.value ? 'row-resize' : 'col-resize');
const startCollapsed = computed(() => props.startCollapsible && startPx.value === 0);
const endCollapsed = computed(() => props.endCollapsible && endPx.value === 0);
const flushDivider = computed(() => props.flush && props.handleSize > 0);
const handleTrack = computed(() => flushDivider.value ? 1 : props.handleSize);
const rootClass = computed(() => [
	'grid min-h-0',
	isVertical.value ? 'overflow-y-auto' : 'overflow-x-auto',
]);
const handleBaseClass = computed(() => [
	'group flex touch-none outline-none',
	isVertical.value
		? 'min-w-0 cursor-row-resize items-center justify-center'
		: 'min-h-0 cursor-col-resize items-stretch justify-center',
	flushDivider.value && [
		'relative z-10 bg-border after:absolute',
		isVertical.value
			? 'after:inset-x-0 after:top-1/2 after:h-(--splitter-hit-size) after:-translate-y-1/2'
			: 'after:inset-y-0 after:left-1/2 after:w-(--splitter-hit-size) after:-translate-x-1/2',
	],
]);
const defaultIndicatorClass = computed(() => [
	'rounded-full bg-muted-fg/35 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[collapsed=true]:opacity-100 group-data-[dragging=true]:opacity-100 group-data-[dragging=true]:bg-canvas-fg/50',
	isVertical.value ? 'mx-auto h-0.5 w-10' : 'my-auto h-10 w-0.5',
]);
const gridStyle = computed(() => {
	const handle = handleTrack.value;
	const tracks = hasEnd.value
		? `${startPx.value}px ${handle}px minmax(${props.minMain}px, 1fr) ${handle}px ${endPx.value}px`
		: `${startPx.value}px ${handle}px minmax(${props.minMain}px, 1fr)`;
	const minStart = startCollapsed.value ? 0 : minimumPaneSize('start');
	const minEnd = endCollapsed.value ? 0 : minimumPaneSize('end');
	const minSize = `${minStart + props.minMain + handle + (hasEnd.value ? minEnd + handle : 0)}px`;
	const hitSize = flushDivider.value ? `${props.handleSize}px` : undefined;

	if (isVertical.value) return {
		'--splitter-hit-size': hitSize,
		gridTemplateRows: tracks,
		minHeight: minSize,
	};

	return {
		'--splitter-hit-size': hitSize,
		direction: isReversed.value ? 'rtl' : undefined,
		gridTemplateColumns: tracks,
		minWidth: minSize,
	};
});

watch(() => props.startSize, (value) => syncSizeProp('start', value));
watch(() => props.endSize, (value) => syncSizeProp('end', value));
watch([isVertical, isReversed, () => props.startCollapsible, () => props.endCollapsible], () => endResize());
watch([
	isVertical, hasEnd, () => props.minStart, () => props.minMain, () => props.minEnd,
	() => props.startCollapsible, () => props.endCollapsible, handleTrack,
], syncSizesToBounds, { flush: 'post' });

onMounted(() => {
	nextTick(syncSizesToBounds);

	if (typeof ResizeObserver === 'undefined') return;
	resizeObserver = new ResizeObserver(syncSizesToBounds);
	if (root.value) resizeObserver.observe(root.value);
});

onBeforeUnmount(() => {
	resizeObserver?.disconnect();
	endResize();
});

/**
 * Keep grid tracks stable even when a host hides a zero-width resize handle.
 * @param {number} track One-based pane or handle track.
 * @returns {{ gridColumn: number, gridRow: number, direction?: string }} Grid placement.
 */
function trackStyle(track) {
	return {
		gridColumn: isVertical.value ? 1 : track,
		gridRow: isVertical.value ? track : 1,
		direction: isReversed.value ? 'ltr' : undefined,
	};
}

/**
 * Start pointer resizing and temporarily reserve the document cursor.
 * @param {'start' | 'end'} pane Pane adjacent to the handle.
 * @param {PointerEvent} event Initial pointer event.
 * @returns {void}
 */
function beginResize(pane, event) {
	if (dragging.value || event.button !== 0 || !event.isPrimary) return;
	event.preventDefault();
	const handle = event.currentTarget;
	const initialSize = panes[pane].size.value;
	handle.focus({ preventScroll: true });
	handle.setPointerCapture(event.pointerId);
	dragging.value = {
		pane,
		handle,
		pointerId: event.pointerId,
		position: pointerPosition(event),
		initialSize,
		reachedMinimum: initialSize > 0,
		cursor: document.body.style.cursor,
		userSelect: document.body.style.userSelect,
	};
	document.body.style.cursor = resizeCursor.value;
	document.body.style.userSelect = 'none';
}

/**
 * Resize a pane with arrow keys or toggle an opted-in pane with Enter.
 * @param {'start' | 'end'} pane Pane adjacent to the focused handle.
 * @param {KeyboardEvent} event Native handle keyboard event.
 * @returns {void}
 */
function resizeFromKeyboard(pane, event) {
	const state = panes[pane];
	const collapsible = isCollapsible(pane);
	const collapsed = collapsible && state.size.value === 0;
	if (collapsible && event.key === 'Enter') {
		event.preventDefault();
		if (!event.repeat) updatePaneSize(pane, collapsed ? boundPaneSize(pane, state.restoreSize || minimumPaneSize(pane)) : 0);
		return;
	}

	const previous = isVertical.value ? 'ArrowUp' : 'ArrowLeft';
	const next = isVertical.value ? 'ArrowDown' : 'ArrowRight';
	if (event.key !== previous && event.key !== next) return;
	event.preventDefault();
	const delta = paneDirection(pane) * (event.key === next ? 1 : -1) * (event.shiftKey ? 40 : 10);
	if (collapsed && delta < 0) return;
	const minimum = minimumPaneSize(pane);
	updatePaneSize(pane, collapsed ? minimum : clamp(state.size.value + delta, minimum, maxPaneSize(pane)));
}

/**
 * Project pointer movement onto the pane's physical resize edge.
 * @param {PointerEvent} event Current pointer event.
 * @returns {void}
 */
function resizeFromPointer(event) {
	const drag = dragging.value;
	if (drag?.pointerId !== event.pointerId) return;
	const { pane, initialSize, position } = drag;
	const requested = initialSize + (pointerPosition(event) - position) * paneDirection(pane);

	if (isCollapsible(pane)) {
		const minimum = minimumPaneSize(pane);
		const threshold = clamp(props.collapseThreshold, 0, minimum);
		if (requested >= minimum) drag.reachedMinimum = true;

		if (panes[pane].size.value === 0) {
			// A new drag can pull the pane open from the edge. Reversing a collapse must reach the minimum again.
			const reopenAt = drag.reachedMinimum ? minimum : threshold;
			if (requested <= 0 || requested < reopenAt) return;
		} else if (requested < minimum && requested <= (drag.reachedMinimum ? minimum - threshold : 0)) {
			updatePaneSize(pane, 0, initialSize || panes[pane].size.value);
			return;
		}
	}

	updatePaneSize(pane, clamp(requested, minimumPaneSize(pane), maxPaneSize(pane)));
}

/**
 * Finish the active gesture on pointer release, interruption, or component teardown.
 * @param {PointerEvent} [event] Event that ended the gesture, if any.
 * @returns {void}
 */
function endResize(event) {
	const drag = dragging.value;
	if (!drag || (event && event.pointerId !== drag.pointerId)) return;
	dragging.value = null;
	if (drag.handle.hasPointerCapture(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId);
	document.body.style.cursor = drag.cursor;
	document.body.style.userSelect = drag.userSelect;
}

/**
 * Apply a user resize and emit the updated model and layout sizes.
 * @param {'start' | 'end'} pane Pane being resized.
 * @param {number} value Clamped pane size in CSS pixels.
 * @param {number} [restoreSize] Expanded size to remember when collapsing.
 * @returns {void}
 */
function updatePaneSize(pane, value, restoreSize = panes[pane].size.value) {
	const state = panes[pane];
	const collapsible = isCollapsible(pane);
	if (collapsible && state.size.value === value) return;
	const reopening = collapsible && state.size.value === 0;
	const previousStart = startPx.value;
	const previousEnd = endPx.value;
	if (collapsible && value === 0) state.restoreSize = restoreSize;
	state.size.value = value;
	if (reopening) syncSizesToBounds();
	if (pane === 'start' || startPx.value !== previousStart) emit('update:startSize', startPx.value);
	if (pane === 'end' || endPx.value !== previousEnd) emit('update:endSize', endPx.value);
	emit('resize', { startSize: startPx.value, endSize: endPx.value });
}

/**
 * Apply an external size update while remembering the previous expanded size.
 * @param {'start' | 'end'} pane Pane controlled by the prop.
 * @param {number} value Requested size in CSS pixels.
 * @returns {void}
 */
function syncSizeProp(pane, value) {
	const state = panes[pane];
	if (state.size.value === value) return;
	if (isCollapsible(pane) && value === 0) state.restoreSize = state.size.value;
	state.size.value = boundPaneSize(pane, value);
	syncSizesToBounds();
}

/**
 * Constrain pane sizes while the host uses the grid layout. Preserve sizes when a responsive host temporarily switches to flex flow.
 * @returns {void}
 */
function syncSizesToBounds() {
	if (!root.value || getComputedStyle(root.value).display !== 'grid') return;
	const extent = isVertical.value ? root.value.clientHeight : root.value.clientWidth;
	if (!extent) return;
	panelExtent.value = extent;

	startPx.value = boundPaneSize('start', startPx.value);
	if (hasEnd.value) endPx.value = boundPaneSize('end', endPx.value);
}

/**
 * Determine whether a pane may have a collapsed zero-size track.
 * @param {'start' | 'end'} pane Pane identifier.
 * @returns {boolean} Whether collapse is enabled.
 */
function isCollapsible(pane) {
	return pane === 'start' ? props.startCollapsible : props.endCollapsible;
}

/**
 * Read the pane's expanded minimum, reserving zero for its collapsed state.
 * @param {'start' | 'end'} pane Pane identifier.
 * @returns {number} Expanded minimum in CSS pixels.
 */
function minimumPaneSize(pane) {
	const minimum = pane === 'start' ? props.minStart : props.minEnd;
	return isCollapsible(pane) ? Math.max(1, minimum) : minimum;
}

/**
 * Calculate the greatest expanded size after reserving the other tracks.
 * @param {'start' | 'end'} pane Pane identifier.
 * @returns {number} Maximum in CSS pixels, or Infinity before measurement.
 */
function maxPaneSize(pane) {
	if (!panelExtent.value) return Infinity;
	const otherSize = pane === 'end' ? startPx.value : (hasEnd.value ? endPx.value : 0);
	const reserved = props.minMain + otherSize + handleTrack.value * (hasEnd.value ? 2 : 1);
	return Math.max(minimumPaneSize(pane), panelExtent.value - reserved);
}

/**
 * Apply expanded bounds while preserving an explicitly collapsed size.
 * @param {'start' | 'end'} pane Pane identifier.
 * @param {number} size Requested pane size in CSS pixels.
 * @returns {number} Resolved pane size in CSS pixels.
 */
function boundPaneSize(pane, size) {
	if (size === 0 && isCollapsible(pane)) return 0;
	return clamp(size, minimumPaneSize(pane), maxPaneSize(pane));
}

/**
 * Report a finite range maximum while waiting for the first layout measurement.
 * @param {'start' | 'end'} pane Pane identifier.
 * @returns {number} Maximum displayed to assistive technology.
 */
function handleMaximum(pane) {
	const max = panelExtent.value ? maxPaneSize(pane) : minimumPaneSize(pane);
	return Math.max(max, panes[pane].size.value);
}

/**
 * Convert physical pointer or arrow direction to growth of the named pane.
 * @param {'start' | 'end'} pane Pane identifier.
 * @returns {1 | -1} Signed multiplier for physical movement.
 */
function paneDirection(pane) {
	return (pane === 'start') !== isReversed.value ? 1 : -1;
}

/**
 * Read the pointer coordinate along the resizing axis.
 * @param {PointerEvent} event Pointer event.
 * @returns {number} Viewport coordinate in CSS pixels.
 */
function pointerPosition(event) {
	return isVertical.value ? event.clientY : event.clientX;
}

/**
 * Identify the pane associated with the current drag gesture.
 * @param {'start' | 'end'} pane Pane identifier.
 * @returns {boolean} Whether this pane is being resized.
 */
function isDragging(pane) {
	return dragging.value?.pane === pane;
}

/**
 * Describe the resize handle for assistive technology.
 * @param {'start' | 'end'} pane Pane identifier.
 * @returns {string} Accessible handle label.
 */
function handleLabel(pane) {
	if (!isVertical.value) return pane === 'start' ? 'Resize leading panel' : 'Resize trailing panel';
	return pane === 'start' ? 'Resize upper panel' : 'Resize lower panel';
}

/**
 * Clamp a pane size to its available bounds.
 * @param {number} value Requested size.
 * @param {number} min Minimum size.
 * @param {number} max Maximum size.
 * @returns {number} Bounded size.
 */
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
</script>

<template>
	<div ref="root" :class="rootClass" :style="gridStyle">
		<section v-show="!startCollapsed" :id="startCollapsible ? `${id}-start` : undefined" class="min-h-0 min-w-0 overflow-hidden" :style="trackStyle(1)">
			<slot name="start" />
		</section>

		<component
			:is="startCollapsible ? 'div' : 'button'"
			:type="startCollapsible ? undefined : 'button'"
			:role="startCollapsible ? 'separator' : undefined"
			:tabindex="startCollapsible ? 0 : undefined"
			:class="[handleBaseClass, handleClass, isDragging('start') && activeHandleClass]"
			:style="trackStyle(2)"
			:aria-label="handleLabel('start')"
			:aria-orientation="isVertical ? 'horizontal' : 'vertical'"
			:aria-controls="startCollapsible ? `${id}-start` : undefined"
			:aria-valuemin="startCollapsible ? 0 : undefined"
			:aria-valuemax="startCollapsible ? handleMaximum('start') : undefined"
			:aria-valuenow="startCollapsible ? startPx : undefined"
			:aria-valuetext="startCollapsible ? (startCollapsed ? 'Collapsed' : `${startPx} pixels`) : undefined"
			:data-dragging="isDragging('start')"
			:data-collapsed="startCollapsed"
			@pointerdown="beginResize('start', $event)"
			@pointermove="resizeFromPointer"
			@pointerup="endResize"
			@pointercancel="endResize"
			@lostpointercapture="endResize"
			@keydown="resizeFromKeyboard('start', $event)"
		>
			<slot name="start-handle" :active="isDragging('start')" :orientation="orientation" :collapsed="startCollapsed">
				<span :class="[defaultIndicatorClass, handleIndicatorClass]"></span>
			</slot>
		</component>

		<section class="min-h-0 min-w-0 overflow-hidden" :style="trackStyle(3)">
			<slot />
		</section>

		<component
			v-if="hasEnd"
			:is="endCollapsible ? 'div' : 'button'"
			:type="endCollapsible ? undefined : 'button'"
			:role="endCollapsible ? 'separator' : undefined"
			:tabindex="endCollapsible ? 0 : undefined"
			:class="[handleBaseClass, handleClass, isDragging('end') && activeHandleClass]"
			:style="trackStyle(4)"
			:aria-label="handleLabel('end')"
			:aria-orientation="isVertical ? 'horizontal' : 'vertical'"
			:aria-controls="endCollapsible ? `${id}-end` : undefined"
			:aria-valuemin="endCollapsible ? 0 : undefined"
			:aria-valuemax="endCollapsible ? handleMaximum('end') : undefined"
			:aria-valuenow="endCollapsible ? endPx : undefined"
			:aria-valuetext="endCollapsible ? (endCollapsed ? 'Collapsed' : `${endPx} pixels`) : undefined"
			:data-dragging="isDragging('end')"
			:data-collapsed="endCollapsed"
			@pointerdown="beginResize('end', $event)"
			@pointermove="resizeFromPointer"
			@pointerup="endResize"
			@pointercancel="endResize"
			@lostpointercapture="endResize"
			@keydown="resizeFromKeyboard('end', $event)"
		>
			<slot name="end-handle" :active="isDragging('end')" :orientation="orientation" :collapsed="endCollapsed">
				<span :class="[defaultIndicatorClass, handleIndicatorClass]"></span>
			</slot>
		</component>

		<section v-if="hasEnd" v-show="!endCollapsed" :id="endCollapsible ? `${id}-end` : undefined" class="min-h-0 min-w-0 overflow-hidden" :style="trackStyle(5)">
			<slot name="end" />
		</section>
	</div>
</template>
