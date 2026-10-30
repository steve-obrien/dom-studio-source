<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { normalizeSnapPoints, resolveSnapPoint } from '../_shared/interactionMath.js';
import { useKeyboardViewport } from '../_shared/useKeyboardViewport.js';

defineOptions({
	__doc: {
		name: 'Bottom sheet',
		tag: '<DomBottomSheet>',
		description: 'A modal content sheet with configurable snap heights, a draggable and keyboard-operable handle, scrolling body, and pinned footer. Uses the shared drawer for focus, dismissal, and scroll locking. Works standalone or in the DomAppShell overlay slot.',
		slots: [
			{ name: '(default)', payload: '{ close, expand }', description: 'Scrollable sheet content.' },
			{ name: 'header', description: 'Custom heading content beside the close button.' },
			{ name: 'footer', payload: '{ close, expand }', description: 'Pinned controls, such as a reply composer.' },
		],
		events: [
			{ name: 'update:modelValue', payload: 'boolean', description: 'Open or dismiss the sheet.' },
			{ name: 'update:snapPoint', payload: 'number', description: 'The selected fraction of the available sheet viewport.' },
		],
		keyboard: [
			{ keys: 'Handle: Arrow Up / Down', action: 'Expand or collapse to the next visible stop.' },
			{ keys: 'Handle: Home / End', action: 'Choose the smallest or largest visible stop.' },
			{ keys: 'Handle: Enter / Space', action: 'Cycle through visible snap heights.' },
			{ keys: 'Escape', action: 'Dismiss and return focus to the opener.' },
		],
	},
});

const props = defineProps({
	modelValue: { type: Boolean, default: false, _edit: { description: 'Whether the modal sheet is open.' } },
	title: { type: String, default: '', _edit: { description: 'Visible title and accessible dialog name.' } },
	label: { type: String, default: 'Details', _edit: { description: 'Accessible dialog name when supplying a custom header without a title.' } },
	snapPoints: { type: Array, default: () => [0, 0.5, 0.9], _edit: { typeRef: 'Array<number>', description: 'Fractions of the available height, from 0 to 1. Include 0 to allow drag dismissal.' } },
	initialSnapPoint: { type: Number, default: 0.5, _edit: { description: 'Preferred height on each open, rounded to the nearest non-zero stop.' } },
	snapPoint: { type: Number, default: null, _edit: { typeRef: 'number | null', description: 'Optional controlled height. Use v-model:snapPoint; null uses internal state.' } },
	contained: { type: Boolean, default: undefined, _edit: { description: 'Defaults to contained in DomAppShell, viewport otherwise. Use the shell overlay slot.' } },
	static: { type: Boolean, default: false, _edit: { description: 'Disable backdrop dismissal. Close and Escape remain available; omit zero from snapPoints to disable drag dismissal.' } },
	keyboardInset: { type: Number, default: null, _edit: { typeRef: 'number | null', description: 'Optional native keyboard inset for standalone sheets. Contained sheets inherit the resized shell.' } },
});
const emit = defineEmits(['update:modelValue', 'update:snapPoint']);
const drawer = ref(null);
const overlay = ref(null);
const panel = ref(null);
const handle = ref(null);
const teleportTarget = ref(null);
const shell = inject('dom-app-shell', null);
const isContained = computed(() => props.contained ?? Boolean(shell));
const points = computed(() => normalizeSnapPoints(props.snapPoints));
const visiblePoints = computed(() => points.value.filter((point) => point > 0));
const localSnap = ref(resolveSnapPoint(visiblePoints.value, props.initialSnapPoint));
const currentSnap = computed(() => resolveSnapPoint(visiblePoints.value, props.snapPoint ?? localSnap.value));
const dragHeight = ref(null);
const dragging = computed(() => dragHeight.value !== null);
const titleId = `dom-bottom-sheet-${useId()}`;
const handleDescriptionId = `${titleId}-size`;
const keyboard = useKeyboardViewport(drawer, () => !isContained.value && props.modelValue, () => props.keyboardInset);
const viewportStyle = computed(() => keyboard.open.value ? { height: `${keyboard.available.value}px`, top: `${keyboard.top.value}px`, bottom: 'auto', '--dom-safe-area-bottom': '0px' } : undefined);
const panelStyle = computed(() => ({
	height: dragging.value ? `${dragHeight.value}px` : `${currentSnap.value * 100}%`,
	transition: dragging.value ? 'none' : undefined,
}));
let gesture = null;
let ready = false;
let removeListeners;
let suppressClickUntil = 0;

/** Requests dismissal through the component's controlled open state. */
function close() {
	cancelDrag();
	emit('update:modelValue', false);
}

/** Sets a valid stop or requests dismissal for the explicit zero stop. */
function snapTo(value) {
	const next = resolveSnapPoint(points.value, value);
	if (next === 0) return close();
	localSnap.value = next;
	emit('update:snapPoint', next);
}

/** Expands to the largest configured stop, including before the keyboard opens. */
function expand() {
	snapTo(visiblePoints.value.at(-1));
}

/** Cycles visible heights when the handle is activated without dragging. */
function cycle() {
	if (Date.now() < suppressClickUntil) return;
	const index = visiblePoints.value.indexOf(currentSnap.value);
	snapTo(visiblePoints.value[(index + 1) % visiblePoints.value.length]);
}

/** Supports predictable keyboard resizing without triggering swipe dismissal. */
function onHandleKey(event) {
	const index = visiblePoints.value.indexOf(currentSnap.value);
	const destinations = { ArrowUp: index + 1, ArrowDown: index - 1, Home: 0, End: visiblePoints.value.length - 1 };
	if (!(event.key in destinations)) return;
	event.preventDefault();
	snapTo(visiblePoints.value[Math.max(0, Math.min(visiblePoints.value.length - 1, destinations[event.key]))]);
}

/** Starts a dedicated handle gesture; body scrolling stays native and independent. */
function onPointerDown(event) {
	if (!props.modelValue || gesture || !event.isPrimary || event.button !== 0) return;
	const available = overlay.value.clientHeight;
	if (!available) return;
	gesture = { id: event.pointerId, startY: event.clientY, height: panel.value.getBoundingClientRect().height, available, lastY: event.clientY, time: event.timeStamp, velocity: 0, moved: false };
	handle.value.setPointerCapture(event.pointerId);
}

/** Resizes the panel with the finger while keeping its footer inside the visible area. */
function onPointerMove(event) {
	if (!gesture || event.pointerId !== gesture.id) return;
	const delta = gesture.startY - event.clientY;
	if (!gesture.moved && Math.abs(delta) < 4) return;
	gesture.moved = true;
	event.preventDefault();
	gesture.velocity = (gesture.lastY - event.clientY) / Math.max(1, event.timeStamp - gesture.time) / gesture.available;
	gesture.lastY = event.clientY;
	gesture.time = event.timeStamp;
	const minimum = points.value[0] * gesture.available;
	const maximum = visiblePoints.value.at(-1) * gesture.available;
	dragHeight.value = Math.max(Math.max(64, minimum), Math.min(maximum, gesture.height + delta));
}

/** Releases capture without selecting a stop, used for cancellation and teardown. */
function cancelDrag() {
	const previous = gesture;
	gesture = null;
	dragHeight.value = null;
	if (previous && handle.value?.hasPointerCapture?.(previous.id)) handle.value.releasePointerCapture(previous.id);
}

/** Snaps after a completed drag; interrupted gestures return to their previous height. */
function onPointerUp(event) {
	if (!gesture || event.pointerId !== gesture.id) return;
	const previous = gesture;
	const destination = resolveSnapPoint(points.value, (dragHeight.value ?? previous.height) / previous.available, event.timeStamp - previous.time > 100 ? 0 : previous.velocity);
	if (previous.moved) suppressClickUntil = Date.now() + 400;
	cancelDrag();
	if (previous.moved) snapTo(destination);
}

/** Drops a cancelled gesture without letting a subsequent click resize the sheet. */
function onPointerCancel(event) {
	if (!gesture || event.pointerId !== gesture.id) return;
	if (gesture.moved) suppressClickUntil = Date.now() + 400;
	cancelDrag();
}

/** Expands editable content before a software keyboard reduces usable space. */
function onFocusIn(event) {
	if (event.target.matches('input, textarea, [contenteditable="true"], [contenteditable=""]')) expand();
}

/** Keeps the headless drawer in sync without emitting a late close over a new open. */
function onState(event) {
	if (event.target === drawer.value) emit('update:modelValue', event.detail.open);
}

/** Restores the configured initial stop on each new presentation. */
function setOpen(value) {
	if (value && !drawer.value?.open) {
		localSnap.value = resolveSnapPoint(visiblePoints.value, props.initialSnapPoint);
	}
	if (!value) cancelDrag();
	if (ready && drawer.value) drawer.value.open = value;
}

/** Upgrades custom elements before teleporting, then installs owned listeners. */
async function mount() {
	await import('../../lib/headless/drawer.js');
	if (!drawer.value) return;
	const element = drawer.value;
	element.addEventListener('dom:state', onState);
	removeListeners = () => element.removeEventListener('dom:state', onState);
	teleportTarget.value = element.ownerDocument.body;
	await nextTick();
	if (!drawer.value) return;
	ready = true;
	setOpen(props.modelValue);
}

/** Cleans up pointer capture and events before the drawer releases focus and scroll. */
function unmount() {
	ready = false;
	cancelDrag();
	removeListeners?.();
}

watch(() => props.modelValue, setOpen);
watch(points, cancelDrag);
onMounted(mount);
onBeforeUnmount(unmount);
defineExpose({ close, expand, snapTo });
</script>

<template>
	<Teleport :to="teleportTarget || 'body'" :disabled="isContained || !teleportTarget">
		<dom-drawer ref="drawer" side="bottom" :static="static || null" :aria-labelledby="title && !$slots.header ? titleId : null" :aria-label="title && !$slots.header ? null : title || label"
			data-dom-bottom-sheet class="inset-0 z-50 block pointer-events-none data-[state=open]:pointer-events-auto" :class="isContained ? 'absolute' : 'fixed'" :style="viewportStyle">
			<div ref="overlay" data-overlay data-no-defaults class="absolute inset-0 pointer-events-none data-[state=open]:pointer-events-auto" hidden>
				<div data-backdrop data-no-defaults class="absolute inset-0 bg-canvas-fg/35 opacity-0 transition-opacity duration-250 data-[state=open]:opacity-100 motion-reduce:transition-none" @pointerdown="cancelDrag"></div>
				<section ref="panel" data-panel data-no-defaults class="absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100%-max(0.75rem,var(--dom-safe-area-top,env(safe-area-inset-top,0px))))] max-w-xl flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-canvas text-canvas-fg shadow-2xl outline-none translate-y-full transition-[height,translate] duration-250 ease-out data-[state=open]:translate-y-0 motion-reduce:transition-none" :style="panelStyle" :data-snap-point="currentSnap" @focusin="onFocusIn">
					<span :id="handleDescriptionId" class="sr-only">{{ Math.round(currentSnap * 100) }} percent height. Use the up and down arrow keys to resize.</span>
					<button ref="handle" type="button" class="flex h-11 w-full shrink-0 touch-none cursor-grab items-center justify-center active:cursor-grabbing focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring" :aria-label="`Resize ${title || label}`" :aria-describedby="handleDescriptionId"
						@pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel" @lostpointercapture="onPointerCancel" @click="cycle" @keydown="onHandleKey">
						<span class="h-1 w-10 rounded-full bg-muted-fg/40" aria-hidden="true"></span>
					</button>
					<header class="flex shrink-0 items-center gap-3 border-b border-border px-5 pb-3">
						<div class="min-w-0 flex-1"><slot name="header"><h2 :id="titleId" class="truncate text-base font-semibold">{{ title || label }}</h2></slot></div>
						<button type="button" class="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-muted-fg hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring" :aria-label="`Close ${title || label}`" @click="close"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" /></svg></button>
					</header>
					<div data-sheet-scroll class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scroll-padding-block:1rem]"><slot :close="close" :expand="expand" /></div>
					<footer v-if="$slots.footer" class="shrink-0 border-t border-border bg-canvas px-4 pt-3 pb-[max(0.75rem,var(--dom-safe-area-bottom,env(safe-area-inset-bottom,0px)))]"><slot name="footer" :close="close" :expand="expand" /></footer>
					<div v-else class="shrink-0 pb-[var(--dom-safe-area-bottom,env(safe-area-inset-bottom,0px))]"></div>
				</section>
			</div>
		</dom-drawer>
	</Teleport>
</template>
